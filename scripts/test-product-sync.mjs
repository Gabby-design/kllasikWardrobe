// scripts/test-product-sync.mjs
// Test suite for server-authoritative product sync, migration, and stale edit pruning
import assert from 'assert';

// 1. Setup Global Mock Browser Environment
const memoryStore = new Map();
globalThis.localStorage = {
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
  STORAGE_KEY,
  REMOVED_KEY,
  VERSION_KEY,
  runStorageMigration,
  computeProductVersion,
  isLocalEditNewer,
  mergeWithStoredProducts,
  getStoredCustomProducts,
  resetToServerCatalog
} = await import('../src/utils/productSync.js');

console.log('--- STARTING PRODUCT SYNC TEST SUITE ---');
console.log('Active Storage Key:', STORAGE_KEY);

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

// TEST 1: No local edits returns the server products
console.log('\n[TEST 1] No local edits returns server products');
memoryStore.clear();
const res1 = mergeWithStoredProducts(baseServerProducts);
assert.strictEqual(res1.length, 2, 'Should return exactly 2 server products');
assert.strictEqual(res1[0].id, 'kwt-01');
assert.strictEqual(res1[1].id, 'kwt-05');
assert.strictEqual(res1[1].image, '/images/red-money-tee-front.jpg');
console.log('✓ PASS: Server products returned unaltered when storage is empty');

// TEST 2: A stale local edit (older than server or matching old baseVersion) is discarded and removed from storage
console.log('\n[TEST 2] Stale local edit is discarded and purged');
memoryStore.clear();
const oldLocalEdit = {
  id: 'kwt-05',
  title: 'Old Sukuna Edit',
  price: 30000,
  image: '/images/old-sukuna.jpg',
  baseVersion: 'v_old_version_9999',
  editedAt: '2026-10-14T10:00:00.000Z',
  isCustom: true
};
memoryStore.set(STORAGE_KEY, JSON.stringify([oldLocalEdit]));

const res2 = mergeWithStoredProducts(baseServerProducts);
const kwt05Result = res2.find(p => p.id === 'kwt-05');
assert.strictEqual(kwt05Result.image, '/images/red-money-tee-front.jpg', 'Server image must win over stale local image');
assert.strictEqual(kwt05Result.title, 'Klasik Money Bags Graphic Heavyweight Tee', 'Server title must win over stale local title');

// Verify that the stale edit was purged from localStorage
const storedAfterMerge = JSON.parse(memoryStore.get(STORAGE_KEY) || '[]');
assert.strictEqual(storedAfterMerge.length, 0, 'Stale edit must be permanently purged from localStorage');
console.log('✓ PASS: Stale edit discarded and wiped from localStorage');

// TEST 3: A newer local edit is kept
console.log('\n[TEST 3] Newer local edit is retained');
memoryStore.clear();
const kwt01ServerVer = computeProductVersion(baseServerProducts[0]);
const freshLocalEdit = {
  id: 'kwt-01',
  title: 'Custom User Renamed Shirt',
  price: 38000,
  image: '/images/server-shirt-1.jpg',
  baseVersion: kwt01ServerVer,
  editedAt: '2026-10-16T16:00:00.000Z', // After server 12:00:00
  isCustom: true
};
memoryStore.set(STORAGE_KEY, JSON.stringify([freshLocalEdit]));

const res3 = mergeWithStoredProducts(baseServerProducts);
const kwt01Result = res3.find(p => p.id === 'kwt-01');
assert.strictEqual(kwt01Result.title, 'Custom User Renamed Shirt', 'Genuinely newer edit must be retained');
assert.strictEqual(kwt01Result.price, 38000);
console.log('✓ PASS: Genuinely newer edit retained');

// TEST 4: A locally created product with no server counterpart is kept
console.log('\n[TEST 4] Locally created product with no server counterpart is kept');
memoryStore.clear();
const localOnlyProduct = {
  id: 'kwt-custom-999',
  title: 'Brand New Admin Added Shirt',
  price: 45000,
  image: '/images/new-shirt.jpg',
  isCustom: true,
  editedAt: '2026-10-16T16:05:00.000Z'
};
memoryStore.set(STORAGE_KEY, JSON.stringify([localOnlyProduct]));

const res4 = mergeWithStoredProducts(baseServerProducts);
assert.strictEqual(res4.length, 3, 'Merged list should contain 2 server products + 1 custom product');
const customFound = res4.find(p => p.id === 'kwt-custom-999');
assert.ok(customFound, 'Local-only product should be present in merged list');
console.log('✓ PASS: Locally created custom product kept');

// TEST 5: A product removed from server has its local override removed
console.log('\n[TEST 5] Product removed from server has local override removed');
memoryStore.clear();
const nonServerItem = {
  id: 'kwt-deleted-from-server',
  title: 'Deleted Item Override',
  baseVersion: 'v_deleted',
  editedAt: '2026-10-14T00:00:00.000Z'
  // Note: isCustom is false or undefined (was once a server product)
};
memoryStore.set(STORAGE_KEY, JSON.stringify([nonServerItem]));
const res5 = mergeWithStoredProducts(baseServerProducts);
assert.strictEqual(res5.some(p => p.id === 'kwt-deleted-from-server'), false, 'Non-server item must not appear');
console.log('✓ PASS: Stale override for removed product eliminated');

// TEST 6: Old localStorage keys are wiped by migration
console.log('\n[TEST 6] Old localStorage keys (v1, v2, v3) wiped by migration');
memoryStore.clear();
memoryStore.set('klasik_custom_products', '{"old":1}');
memoryStore.set('klasik_custom_products_v2', '{"old":2}');
memoryStore.set('klasik_custom_products_v3', '{"old":3}');
memoryStore.set('klasik_removed_products', '[]');
memoryStore.set('klasik_removed_products_v2', '[]');
memoryStore.set('klasik_catalog_version_v2', '12345');

runStorageMigration();

assert.strictEqual(memoryStore.has('klasik_custom_products'), false);
assert.strictEqual(memoryStore.has('klasik_custom_products_v2'), false);
assert.strictEqual(memoryStore.has('klasik_custom_products_v3'), false);
assert.strictEqual(memoryStore.has('klasik_removed_products'), false);
assert.strictEqual(memoryStore.has('klasik_removed_products_v2'), false);
assert.strictEqual(memoryStore.has('klasik_catalog_version_v2'), false);
console.log('✓ PASS: All legacy cache keys wiped cleanly');

// TEST 7: Pre-seeded old v3 localStorage test (Simulating Master phone state)
console.log('\n[TEST 7] Pre-seeded v3 localStorage simulation (Master device scenario)');
memoryStore.clear();
// Simulate Master device having old v3 key containing Sukuna
memoryStore.set('klasik_custom_products_v3', JSON.stringify([{
  id: 'kwt-05',
  title: 'Old Sukuna Tee',
  image: '/images/media__1786369649479.jpg'
}]));

// When the site loads, mergeWithStoredProducts runs
const res7 = mergeWithStoredProducts(baseServerProducts);
const kwt05Sim = res7.find(p => p.id === 'kwt-05');
assert.strictEqual(kwt05Sim.image, '/images/red-money-tee-front.jpg', 'Must show new red money tee image');
assert.strictEqual(kwt05Sim.title, 'Klasik Money Bags Graphic Heavyweight Tee', 'Must show new title');
assert.strictEqual(memoryStore.has('klasik_custom_products_v3'), false, 'Old v3 key must be completely eliminated');
console.log('✓ PASS: Master device scenario completely resolved with zero revert');

console.log('\n======================================');
console.log('ALL 7 UNIT TESTS PASSED SUCCESSFULLY!');
console.log('======================================');
