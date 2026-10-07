import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../../../../utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean and generate unique filename
    const originalName = file.name || 'product_image.jpg';
    const ext = path.extname(originalName) || '.jpg';
    const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `product_${Date.now()}_${base}${ext}`;

    let finalImageUrl = null;
    let storageBackend = 'memory';

    // 1. Attempt Supabase Storage backend ('products' bucket)
    try {
      const supabase = createAdminClient();
      if (supabase) {
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
        } else if (error) {
          console.warn('Supabase storage upload notice:', error.message);
        }
      }
    } catch (supabaseErr) {
      console.warn('Supabase storage connection notice:', supabaseErr.message);
    }

    // 2. If Supabase storage is not available, try writing local copy to public/images
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
        console.warn('Local FS write skipped (read-only environment):', fsErr.message);
      }
    }

    // 3. Guaranteed fallback: Convert buffer to base64 Data URI
    if (!finalImageUrl) {
      const mime = file.type || 'image/jpeg';
      finalImageUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      storageBackend = 'inline-data';
    }

    return NextResponse.json({
      success: true,
      url: finalImageUrl,
      storage: storageBackend,
      fileName: safeName,
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

