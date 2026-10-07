// scripts/sync-to-supabase.mjs
// Synchronizes catalog products and images to the Supabase backend (Storage + Database)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local if present
const envPath = path.join(rootDir, '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valParts] = trimmed.split('=');
    const val = valParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) {
      supabaseUrl = val;
    }
    if ((key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') && !supabaseKey) {
      supabaseKey = val;
    }
  }
}

console.log('--- KLASIK WARDROBE SUPABASE BACKEND SYNC ---');
console.log('Supabase URL:', supabaseUrl || '(not configured)');

if (!supabaseUrl || !supabaseKey) {
  console.log('Notice: Supabase URL or Key not set. Exiting sync safely.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncBackend() {
  try {
    // 1. Check or create storage bucket 'products'
    console.log('1. Checking Supabase storage bucket "products"...');
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const productsBucket = buckets?.find(b => b.name === 'products' || b.id === 'products');
      if (!productsBucket) {
        console.log('Creating "products" public storage bucket...');
        await supabase.storage.createBucket('products', { public: true });
      } else {
        console.log('Bucket "products" exists.');
      }
    } catch (e) {
      console.warn('Storage bucket check warning:', e.message);
    }

    // 2. Upload product images to Supabase storage
    console.log('2. Uploading product images to Supabase storage...');
    const imagesDir = path.join(rootDir, 'public', 'images');
    const imageUrlMap = {};

    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      for (const file of files) {
        try {
          const filePath = path.join(imagesDir, file);
          const fileBuf = fs.readFileSync(filePath);
          const ext = path.extname(file).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

          const { data, error } = await supabase.storage
            .from('products')
            .upload(file, fileBuf, { contentType: mimeType, upsert: true });

          if (!error && data) {
            const { data: pUrl } = supabase.storage.from('products').getPublicUrl(file);
            if (pUrl?.publicUrl) {
              imageUrlMap[`/images/${file}`] = pUrl.publicUrl;
              console.log(`Uploaded ${file} -> ${pUrl.publicUrl}`);
            }
          } else {
            console.warn(`Could not upload ${file}:`, error?.message);
          }
        } catch (fileErr) {
          console.warn(`Error uploading ${file}:`, fileErr.message);
        }
      }
    }

    // 3. Read catalog products from src/data/catalog.js
    console.log('3. Syncing products into Supabase "products" table...');
    const catalogPath = path.join(rootDir, 'src', 'data', 'catalog.js');
    let products = [];

    if (fs.existsSync(catalogPath)) {
      const catalogContent = fs.readFileSync(catalogPath, 'utf8');
      // Extract PRODUCTS array via module import or parse
      const catalogModule = await import('../src/data/catalog.js');
      products = catalogModule.PRODUCTS || [];
    }

    // Read custom products if any exist
    const customPath = path.join(rootDir, 'src', 'data', 'custom-products.json');
    if (fs.existsSync(customPath)) {
      try {
        const customProds = JSON.parse(fs.readFileSync(customPath, 'utf8'));
        if (Array.isArray(customProds)) {
          products = [...products, ...customProds];
        }
      } catch {}
    }

    console.log(`Found ${products.length} products to upsert.`);

    for (const p of products) {
      const supabaseImg = imageUrlMap[p.image] || p.image;
      const row = {
        id: p.id,
        name: p.title || p.name,
        price: p.price,
        category: p.category || 'T-Shirts',
        description: p.description,
        image_url: supabaseImg,
        stock: p.stock !== undefined ? p.stock : 10,
        gsm: p.gsm || null,
        material: p.material || null,
        fit: p.fit || null
      };

      const { error: upsertErr } = await supabase.from('products').upsert(row);
      if (upsertErr) {
        console.warn(`Failed to upsert ${p.id}:`, upsertErr.message);
      } else {
        console.log(`Upserted ${p.id} (${p.category}) -> Supabase DB`);
      }
    }

    console.log('Supabase sync complete.');
  } catch (err) {
    console.error('Supabase sync error:', err.message);
  }
}

syncBackend();
