import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../../../../utils/supabase/admin';

export const dynamic = 'force-dynamic';

async function processSingleFile(file, supabase) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const originalName = file.name || 'product_image.jpg';
  const ext = path.extname(originalName) || '.jpg';
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${base}${ext}`;

  let finalImageUrl = null;
  let storageBackend = 'memory';

  // 1. Attempt Supabase Storage ('products' bucket)
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('products')
        .upload(safeName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(safeName);

        if (publicUrlData?.publicUrl) {
          finalImageUrl = publicUrlData.publicUrl;
          storageBackend = 'supabase';
        }
      }
    } catch (e) {
      console.warn('Supabase upload notice:', e.message);
    }
  }

  // 2. Local FS fallback (wrapped to prevent 500 in read-only environments)
  if (!finalImageUrl) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, safeName);
      fs.writeFileSync(localFilePath, buffer);
      finalImageUrl = `/images/${safeName}`;
      storageBackend = 'local';
    } catch (fsErr) {
      console.warn('Local FS skipped:', fsErr.message);
    }
  }

  // 3. Inline Data URI fallback
  if (!finalImageUrl) {
    const mime = file.type || 'image/jpeg';
    finalImageUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    storageBackend = 'inline-data';
  }

  return { url: finalImageUrl, fileName: safeName, storage: storageBackend };
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Gather all files from 'files' or 'file'
    const files = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter(Boolean);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    let supabase = null;
    try {
      supabase = createAdminClient();
    } catch {
      // Supabase is optional
    }

    const results = [];
    for (const file of files) {
      const res = await processSingleFile(file, supabase);
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
    console.error('Error uploading product images:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
