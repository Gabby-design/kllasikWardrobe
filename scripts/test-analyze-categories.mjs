// scripts/test-analyze-categories.mjs
import assert from 'assert';
import { POST } from '../app/api/admin/analyze-product/route.js';
import { createAdminSessionToken } from '../src/lib/auth.js';

console.log('===========================================================');
console.log('KLASIK WARDROBE: AI PRODUCT ANALYSIS & CATEGORY TEST SUITE');
console.log('===========================================================');

async function run() {
  process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'test_secret_for_suite_1234567890_32char_len';
  const token = createAdminSessionToken();

  // Test 1: Unauthenticated call should fail with 401
  console.log('\n[TEST 1] Testing unauthenticated call...');
  const unauthReq = new Request('http://localhost:3000/api/admin/analyze-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: 'long-sleeve-tee.jpg' }),
  });
  const unauthRes = await POST(unauthReq);
  assert.strictEqual(unauthRes.status, 401, 'Should return 401 Unauthorized');
  console.log('  PASS: Rejected unauthenticated request with status 401');

  // Helper for authenticated requests
  async function testAnalysis(payload) {
    const req = new Request('http://localhost:3000/api/admin/analyze-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Should have success: true');
    assert.ok(data.analysis, 'Should contain analysis object');
    return data.analysis;
  }

  // Test 2: Long Sleeves detection
  console.log('\n[TEST 2] Testing Long Sleeves detection...');
  const ls1 = await testAnalysis({ fileName: 'layered-long-sleeve-tee-charcoal.png' });
  assert.strictEqual(ls1.category, 'Long Sleeves', 'Should categorize as Long Sleeves');
  assert.strictEqual(ls1.price, 35000, 'Price should be 35000');
  assert.ok(ls1.gsm.includes('260 GSM'), 'GSM should be 260 GSM');
  assert.ok(ls1.title.toLowerCase().includes('long-sleeve'), 'Title should mention long-sleeve');
  assert.ok(Array.isArray(ls1.sizes) && ls1.sizes.length >= 4, 'Sizes should be array');
  assert.ok(Array.isArray(ls1.colors) && ls1.colors.length >= 1, 'Colors should be array');
  console.log(`  PASS: Correctly classified "${ls1.title}" as "${ls1.category}" (₦${ls1.price})`);

  // Test 3: Up and Down detection
  console.log('\n[TEST 3] Testing Up and Down detection...');
  const ud1 = await testAnalysis({ fileName: 'textured-up-and-down-coord-set.jpg' });
  assert.strictEqual(ud1.category, 'Up and Down', 'Should categorize as Up and Down');
  assert.strictEqual(ud1.price, 58000, 'Price should be 58000');
  assert.strictEqual(ud1.tag, 'Co-Ord Drop', 'Tag should be Co-Ord Drop');
  assert.ok(ud1.gsm.includes('280 GSM'), 'GSM should be 280 GSM');
  console.log(`  PASS: Correctly classified "${ud1.title}" as "${ud1.category}" (₦${ud1.price})`);

  // Test 4: Cargo Pants detection
  console.log('\n[TEST 4] Testing Cargo Pants detection...');
  const cp = await testAnalysis({ fileName: 'tactical-combat-cargo-pants.png' });
  assert.strictEqual(cp.category, 'Cargo Pants', 'Should categorize as Cargo Pants');
  console.log(`  PASS: Correctly classified "${cp.title}" as "${cp.category}" (₦${cp.price})`);

  // Test 5: Short Jeans detection
  console.log('\n[TEST 5] Testing Short Jeans detection...');
  const sj = await testAnalysis({ fileName: 'vintage-washed-denim-jorts.jpg' });
  assert.strictEqual(sj.category, 'Short Jeans', 'Should categorize as Short Jeans');
  console.log(`  PASS: Correctly classified "${sj.title}" as "${sj.category}" (₦${sj.price})`);

  // Test 6: Beach Pants detection
  console.log('\n[TEST 6] Testing Beach Pants detection...');
  const bp = await testAnalysis({ fileName: 'relaxed-pure-linen-beach-pants.jpg' });
  assert.strictEqual(bp.category, 'Beach Pants', 'Should categorize as Beach Pants');
  console.log(`  PASS: Correctly classified "${bp.title}" as "${bp.category}" (₦${bp.price})`);

  // Test 7: Jeans detection
  console.log('\n[TEST 7] Testing Jeans detection...');
  const jn = await testAnalysis({ fileName: 'selvedge-denim-baggy-jeans.jpg' });
  assert.strictEqual(jn.category, 'Jeans', 'Should categorize as Jeans');
  console.log(`  PASS: Correctly classified "${jn.title}" as "${jn.category}" (₦${jn.price})`);

  // Test 8: T-Shirts detection
  console.log('\n[TEST 8] Testing T-Shirts detection...');
  const ts = await testAnalysis({ fileName: 'heavyweight-organic-cotton-tee.png' });
  assert.strictEqual(ts.category, 'T-Shirts', 'Should categorize as T-Shirts');
  console.log(`  PASS: Correctly classified "${ts.title}" as "${ts.category}" (₦${ts.price})`);

  console.log('\n===========================================================');
  console.log('ALL 8 AI ANALYSIS & CATEGORY TESTS PASSED (100% SUCCESS)');
  console.log('===========================================================');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
