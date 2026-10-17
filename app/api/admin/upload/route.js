import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

import { verifyAdminSessionToken } from '../../../../src/lib/auth';

async function isAdminAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return verifyAdminSessionToken(token);
}

async function processSingleFile(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalName = file.name || 'product_image.jpg';
  const ext = path.extname(originalName) || '.jpg';
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${base}${ext}`;

  // 1. Primary: Vercel Blob storage (Production CDN)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(safeName, buffer, {
        access: 'public',
        contentType: file.type || 'image/jpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      if (blob?.url) {
        return { url: blob.url, fileName: safeName, storage: 'vercel-blob' };
      }
    } catch (blobErr) {
      console.error('Vercel Blob upload failed:', blobErr.message);
      throw new Error(`Vercel Blob upload failed: ${blobErr.message}`);
    }
  }

  // 2. Local filesystem fallback (Local development only, when not running on Vercel)
  if (!process.env.VERCEL) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, safeName);
      fs.writeFileSync(localFilePath, buffer);
      return { url: `/images/${safeName}`, fileName: safeName, storage: 'local-fs' };
    } catch (fsErr) {
      console.error('Local filesystem upload failed:', fsErr.message);
      throw new Error(`Local filesystem upload failed: ${fsErr.message}`);
    }
  }

  // 3. In production, missing BLOB_READ_WRITE_TOKEN is an error. Never fall back to base64.
  throw new Error('BLOB_READ_WRITE_TOKEN environment variable is missing on Vercel.');
}

export async function POST(request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter(Boolean);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      if (file && typeof file.arrayBuffer === 'function') {
        const res = await processSingleFile(file);
        results.push(res);
      }
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
    console.error('Error uploading product images:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
