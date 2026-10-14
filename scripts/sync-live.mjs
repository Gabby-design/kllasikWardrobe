// scripts/sync-live.mjs
// Bidirectional synchronization between Localhost and Live Host (Vercel)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const customFile = path.join(rootDir, 'src', 'data', 'custom-products.json');

const LIVE_URL = process.env.LIVE_URL || 'https://kllasik-wardrobe.vercel.app';
const mode = process.argv[2] || 'pull';

async function main() {
  console.log(`[Klasik Sync] Mode: ${mode.toUpperCase()} | Target: ${LIVE_URL}`);

  if (mode === 'pull') {
    // Fetch live catalog from Vercel and save locally
    try {
      const res = await fetch(`${LIVE_URL}/api/products?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) {
        throw new Error(`Live server returned status ${res.status}`);
      }
      const data = await res.json();
      const products = data.products || [];
      const customOnly = products.filter(p => p.isCustom);
      const toWrite = customOnly.length > 0 ? customOnly : products;

      fs.writeFileSync(customFile, JSON.stringify(toWrite, null, 2), 'utf-8');
      console.log(`[PASS] Pulled ${toWrite.length} products from live host into src/data/custom-products.json`);
    } catch (err) {
      console.error(`[FAIL] Pull failed: ${err.message}`);
      process.exit(1);
    }
  } else if (mode === 'push') {
    // Read local custom-products.json and push to Vercel
    try {
      if (!fs.existsSync(customFile)) {
        throw new Error(`File not found: ${customFile}`);
      }
      const raw = fs.readFileSync(customFile, 'utf-8');
      const products = JSON.parse(raw);

      const res = await fetch(`${LIVE_URL}/api/admin/sync-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      if (!res.ok) {
        throw new Error(`Live server returned status ${res.status}`);
      }
      const result = await res.json();
      console.log(`[PASS] Pushed ${products.length} products to live host. Server response:`, result);
    } catch (err) {
      console.error(`[FAIL] Push failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log('Usage: node scripts/sync-live.mjs [pull|push]');
  }
}

main();
