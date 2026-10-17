// scripts/test-product-sync.mjs
// Test suite for server-authoritative product sync, database validation, and storage purging
import assert from 'assert';

// 1. Setup Global Mock Browser Environment
const memoryStore = new Map();
globalThis.localStorage = {
  get length() {
    return memoryStore.size;
  },
  key: (i) => Array.from(memoryStore.keys())[i] || null,
  getItem: (key) => memoryStore.get(key) || null,
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear()
};
globalThis.window = {
  location: { hostname: 'localhost' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {}
};
globalThis.document = {
  hidden: false,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// 2. Import productSync methods
const {
  runStorageMigration,
  mergeWithStoredProducts,
  resetToServerCatalog
} = await import('../src/utils/productSync.js');

const { validateProductImageUrls } = await import('../src/lib/db.js');

console.log('--- STARTING PRODUCT SYNC TEST SUITE ---');

const baseServerProducts = [
  {
    id: 'kwt-01',
    title: 'Server Shirt 1',
    price: 35000,
    image: '/images/server-shirt-1.jpg',
    updatedAt: '2026-10-16T12:00:00.000Z'
  },
  {
    id: 'kwt-05',
    title: 'Klasik Money Bags Graphic Heavyweight Tee',
    price: 35000,
    image: '/images/red-money-tee-front.jpg',
    updatedAt: '2026-10-16T15:00:00.000Z'
  }
];

// TEST 1: Server products are authoritative and returned directly
console.log('\n[TEST 1] Server products returned unaltered');
memoryStore.clear();
const res1 = mergeWithStoredProducts(baseServerProducts);
assert.strictEqual(res1.length, 2, 'Should return exactly 2 server products');
assert.strictEqual(res1[0].id, 'kwt-01');
assert.strictEqual(res1[1].id, 'kwt-05');
assert.strictEqual(res1[1].image, '/images/red-money-tee-front.jpg');
console.log('PASS: Server products returned unaltered');

// TEST 2: Legacy klasik_* storage keys are purged on migration
console.log('\n[TEST 2] Purging legacy localStorage keys');
memoryStore.set('klasik_custom_products_v3', JSON.stringify([{ id: 'old-sukuna' }]));
memoryStore.set('klasik_custom_products_v4', JSON.stringify([{ id: 'stale-edit' }]));
memoryStore.set('klasik_removed_products_v4', JSON.stringify(['kwt-01']));
memoryStore.set('unrelated_key', 'keep_me');

runStorageMigration();

assert.strictEqual(memoryStore.has('klasik_custom_products_v3'), false, 'Legacy v3 key must be purged');
assert.strictEqual(memoryStore.has('klasik_custom_products_v4'), false, 'Legacy v4 key must be purged');
assert.strictEqual(memoryStore.has('klasik_removed_products_v4'), false, 'Removed products key must be purged');
assert.strictEqual(memoryStore.get('unrelated_key'), 'keep_me', 'Unrelated keys preserved');
console.log('PASS: All legacy klasik_* keys purged from localStorage');

// TEST 3: localStorage is NOT used as source of truth for products
console.log('\n[TEST 3] Storage is not a source of truth');
memoryStore.set('klasik_custom_products_v4', JSON.stringify([{ id: 'kwt-05', title: 'Hacked Title' }]));
const res3 = mergeWithStoredProducts(baseServerProducts);
const kwt05 = res3.find((p) => p.id === 'kwt-05');
assert.strictEqual(kwt05.title, 'Klasik Money Bags Graphic Heavyweight Tee', 'Server product must override any local edit');
console.log('PASS: Server catalog is sole source of truth');

// TEST 5: Image URL validation rejects data: and blob: URLs
console.log('\n[TEST 5] Reject base64 data: and blob: URLs');
assert.throws(() => {
  validateProductImageUrls({
    id: 'test',
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    gallery: []
  });
}, /data: and blob: URLs are not allowed/);

assert.throws(() => {
  validateProductImageUrls({
    id: 'test',
    image: 'https://blob.vercel-storage.com/cover.jpg',
    gallery: ['blob:http://localhost:3000/123-abc']
  });
}, /data: and blob: URLs are not allowed/);

// Valid Vercel Blob and relative paths must pass
assert.doesNotThrow(() => {
  validateProductImageUrls({
    id: 'test',
    image: 'https://vufvxwhviwzbegaslaxg.public.blob.vercel-storage.com/product_123.jpg',
    gallery: ['/images/hero-tee-black.png']
  });
});
console.log('PASS: data: and blob: URLs strictly rejected, valid URLs accepted');

console.log('\nALL PRODUCT SYNC TESTS PASSED SUCCESSFULLY.');
