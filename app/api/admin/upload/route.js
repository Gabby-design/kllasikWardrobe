import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import {
  put,
  BlobAccessError,
  BlobFileTooLargeError,
  BlobStoreNotFoundError,
  BlobContentTypeNotAllowedError,
} from '@vercel/blob';

export const dynamic = 'force-dynamic';

import { verifyAdminSessionToken } from '../../../../src/lib/auth';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB Vercel Serverless payload limit
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function isAdminAuthorized() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    return Boolean(verifyAdminSessionToken(token));
  } catch (err) {
    console.error('[Upload API] Error inspecting admin auth cookie:', err);
    return false;
  }
}

function getBlobToken() {
  if (process.env.PUBLIC_BLOB_READ_WRITE_TOKEN?.trim()) {
    return process.env.PUBLIC_BLOB_READ_WRITE_TOKEN.trim();
  }
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return process.env.BLOB_READ_WRITE_TOKEN.trim();
  }
  const matchingKey = Object.keys(process.env).find(
    (key) => (key.endsWith('_READ_WRITE_TOKEN') || key.includes('BLOB_READ_WRITE')) && process.env[key]?.trim()
  );
  if (matchingKey) {
    return process.env[matchingKey].trim();
  }
  return null;
}

async function processSingleFile(file, blobToken) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalName = file.name || 'product_photo.jpg';
  const rawExt = (path.extname(originalName) || '.jpg').toLowerCase();
  const safeExt = VALID_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';
  const rawBase = path.basename(originalName, rawExt);
  const sanitizedBase = rawBase
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50) || 'photo';

  const safePathname = `products/${Date.now()}-${sanitizedBase}${safeExt}`;

  // 1. Primary: Vercel Blob storage (if configured and connected)
  if (blobToken) {
    try {
      const blob = await put(safePathname, buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type || 'image/jpeg',
        token: blobToken,
      });

      if (blob?.url) {
        return {
          url: blob.url,
          fileName: safePathname,
          storage: 'vercel-blob',
        };
      }
    } catch (blobErr) {
      console.error('[Upload API] Vercel Blob put error:', blobErr.message);
      if (process.env.VERCEL) {
        if (blobErr.message?.includes('private access') || blobErr.message?.includes('private store')) {
          throw new Error('Vercel Blob store is set to Private. Please connect the Public Blob store (kllasik-wardrobe-public) in Vercel settings.');
        }
        throw new Error(`Cloud storage upload failed: ${blobErr.message}`);
      }
    }
  } else if (process.env.VERCEL) {
    throw new Error('Cloud storage configuration missing: BLOB_READ_WRITE_TOKEN is not set.');
  }

  // 2. Local filesystem storage (local development only)
  if (!process.env.VERCEL) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFileName = `product_${Date.now()}_${sanitizedBase}${safeExt}`;
      const localFilePath = path.join(uploadDir, localFileName);
      fs.writeFileSync(localFilePath, buffer);
      return {
        url: `/images/${localFileName}`,
        fileName: localFileName,
        storage: 'local-fs',
      };
    } catch (fsErr) {
      console.error('[Upload API] Local filesystem error:', fsErr.message);
      throw new Error(`Local storage error: ${fsErr.message}`);
    }
  }

  throw new Error('Storage destination unavailable. Please ensure Vercel Blob is configured.');
}

export async function POST(request) {
  try {
    const isAuthorized = await isAdminAuthorized();
    if (!isAuthorized) {
      console.error('[Upload API] 401 Unauthorized: Admin session token missing or invalid');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin session required. Please log in.' },
        { status: 401 }
      );
    }

    const blobToken = getBlobToken();

    let formData;
    try {
      formData = await request.formData();
    } catch (formErr) {
      console.error('[Upload API] 400 Failed to parse multipart formData:', formErr);
      const isTooLarge = formErr?.message?.toLowerCase().includes('large') || formErr?.message?.toLowerCase().includes('limit');
      return NextResponse.json(
        {
          success: false,
          error: isTooLarge
            ? 'Upload payload exceeds 4.5MB request limit. Please upload smaller or resized images.'
            : `Invalid upload payload: ${formErr.message}`
        },
        { status: isTooLarge ? 413 : 400 }
      );
    }

    const files = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter(Boolean);

    if (files.length === 0) {
      console.error('[Upload API] 400 Bad Request: No files found in formData');
      return NextResponse.json(
        { success: false, error: 'No image file provided in upload request.' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') {
        console.error('[Upload API] 400 Bad Request: Invalid file object received');
        return NextResponse.json(
          { success: false, error: 'Uploaded item is not a valid file.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        console.error(`[Upload API] 413 Payload Too Large: "${file.name}" is ${sizeMb}MB (max 4.5MB)`);
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name || 'image'}" (${sizeMb}MB) exceeds maximum limit of 4.5MB. Please upload images under 4.5MB.`
          },
          { status: 413 }
        );
      }

      const mime = (file.type || '').toLowerCase();
      if (mime && !mime.startsWith('image/')) {
        console.error(`[Upload API] 400 Bad Request: Unsupported mime type "${mime}" for "${file.name}"`);
        return NextResponse.json(
          { success: false, error: `Invalid file format "${mime}". Only image files (JPEG, PNG, WEBP, GIF) are allowed.` },
          { status: 400 }
        );
      }
    }

    const results = [];
    for (const file of files) {
      const res = await processSingleFile(file, blobToken);
      results.push(res);
    }

    const urls = results.map((r) => r.url);

    return NextResponse.json({
      success: true,
      url: urls[0],
      urls: urls,
      count: urls.length,
      storage: results[0]?.storage,
      fileName: results[0]?.fileName,
    });
  } catch (error) {
    const status = error.status || (error.message?.includes('413') ? 413 : 500);
    console.error(`[Upload API] ${status} Error uploading product image:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred while uploading product image.'
      },
      { status }
    );
  }
}
