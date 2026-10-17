// scripts/sync-live.mjs
// Read-only diagnostic script. Pushing to live database is permanently disabled.

const LIVE_URL = process.env.LIVE_URL || 'https://kllasik-wardrobe.vercel.app';
const mode = process.argv[2] || 'pull';

async function checkLiveStatus() {
  try {
    const res = await fetch(`${LIVE_URL}/api/products?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    if (!res.ok) {
      console.error(`[Klasik Check] Live host returned status ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`[Klasik Check] Live host operational. Catalog has ${data.products?.length || 0} products.`);
  } catch (err) {
    console.error(`[Klasik Check] Failed to query live host:`, err.message);
  }
}

if (mode === 'push' || mode === 'watch') {
  console.log('[Notice] Overwriting live database from local scripts is disabled. Manage catalog via /admin.');
} else {
  checkLiveStatus();
}
