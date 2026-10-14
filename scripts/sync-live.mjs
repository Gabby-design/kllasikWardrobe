// scripts/sync-live.mjs
// Bidirectional continuous synchronization between Localhost and Live Host (Vercel)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const customFile = path.join(rootDir, 'src', 'data', 'custom-products.json');

const LIVE_URL = process.env.LIVE_URL || 'https://kllasik-wardrobe.vercel.app';
const mode = process.argv[2] || 'pull';

function computeHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(str).digest('hex');
}

async function pullFromLive(currentLocalHash) {
  try {
    const res = await fetch(`${LIVE_URL}/api/products?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    if (!res.ok) return { success: false, status: res.status };

    const data = await res.json();
    const products = data.products || [];
    const customOnly = products.filter(p => p.isCustom);
    const toWrite = customOnly.length > 0 ? customOnly : products;
    const formatted = JSON.stringify(toWrite, null, 2);
    const liveHash = computeHash(formatted);

    if (liveHash !== currentLocalHash) {
      fs.writeFileSync(customFile, formatted, 'utf-8');
      console.log(`[Auto-Sync] Live host change detected. Synced ${toWrite.length} products to local file.`);
      return { success: true, updated: true, newHash: liveHash, count: toWrite.length };
    }
    return { success: true, updated: false, newHash: liveHash };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function pushToLive() {
  try {
    if (!fs.existsSync(customFile)) return { success: false, error: 'File missing' };
    const raw = fs.readFileSync(customFile, 'utf-8');
    const products = JSON.parse(raw);
    const fileHash = computeHash(raw);

    const res = await fetch(`${LIVE_URL}/api/admin/sync-catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[Auto-Sync] Local change pushed to live host (${products.length} products).`);
      return { success: true, newHash: fileHash, count: products.length, data };
    }
    return { success: false, status: res.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function startWatch() {
  console.log(`[Auto-Sync Active] Continuous synchronization running against ${LIVE_URL}`);
  let lastKnownHash = '';

  if (fs.existsSync(customFile)) {
    try {
      lastKnownHash = computeHash(fs.readFileSync(customFile, 'utf-8'));
    } catch {}
  }

  // 1. Initial sync from live host
  const initPull = await pullFromLive(lastKnownHash);
  if (initPull.success && initPull.newHash) {
    lastKnownHash = initPull.newHash;
  }

  // 2. Watch local file for changes
  let fileDebounceTimer = null;
  fs.watch(path.dirname(customFile), (eventType, filename) => {
    if (filename === 'custom-products.json') {
      clearTimeout(fileDebounceTimer);
      fileDebounceTimer = setTimeout(async () => {
        try {
          if (!fs.existsSync(customFile)) return;
          const currentContent = fs.readFileSync(customFile, 'utf-8');
          const currentHash = computeHash(currentContent);

          if (currentHash !== lastKnownHash) {
            console.log('[Auto-Sync] Local custom-products.json modified. Uploading to live host...');
            const pushRes = await pushToLive();
            if (pushRes.success) {
              lastKnownHash = currentHash;
            }
          }
        } catch {}
      }, 750);
    }
  });

  // 3. Periodic polling from live host (every 4 seconds)
  setInterval(async () => {
    try {
      const pullRes = await pullFromLive(lastKnownHash);
      if (pullRes.success && pullRes.updated) {
        lastKnownHash = pullRes.newHash;
      }
    } catch {}
  }, 4000);
}

async function main() {
  if (mode === 'watch') {
    startWatch();
  } else if (mode === 'pull') {
    console.log(`[Klasik Sync] Pulling from ${LIVE_URL}...`);
    const res = await pullFromLive('');
    if (res.success) {
      console.log(`[PASS] Pulled successfully.`);
    } else {
      console.error(`[FAIL] ${res.error || res.status}`);
      process.exit(1);
    }
  } else if (mode === 'push') {
    console.log(`[Klasik Sync] Pushing to ${LIVE_URL}...`);
    const res = await pushToLive();
    if (res.success) {
      console.log(`[PASS] Pushed successfully.`);
    } else {
      console.error(`[FAIL] ${res.error || res.status}`);
      process.exit(1);
    }
  } else {
    console.log('Usage: node scripts/sync-live.mjs [watch|pull|push]');
  }
}

main();
