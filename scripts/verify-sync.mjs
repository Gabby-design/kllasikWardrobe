// scripts/verify-sync.mjs
// Local integration verification test against mock Upstash Redis REST service.
// Validates:
// 1. Redis hash storage (klasik:products_v2) with read-back verification
// 2. Authenticated /api/admin/health returns real Redis ping & counts
// 3. Price change persistence verified via unauthenticated fresh client /api/products (zero cookies)
// 4. Product deletion via HDEL
// 5. Stock atomic decrement and reflection in fresh /api/products response

import http from 'http';
import assert from 'assert';

console.log('====================================================');
console.log('KLASIK WARDROBE: LOCAL REDIS SYNC VERIFICATION SUITE');
console.log('====================================================\n');

// In-Memory Redis Store
const stringStore = new Map();
const hashStore = new Map();
const setStore = new Map();

function getHash(key) {
  if (!hashStore.has(key)) {
    hashStore.set(key, new Map());
  }
  return hashStore.get(key);
}

function getSet(key) {
  if (!setStore.has(key)) {
    setStore.set(key, new Set());
  }
  return setStore.get(key);
}

function encodeResult(val, isBase64) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'string') {
    return isBase64 ? Buffer.from(val, 'utf8').toString('base64') : val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => encodeResult(item, isBase64));
  }
  return val;
}

function executeRedisCommand(cmd) {
  const op = String(cmd[0]).toLowerCase();
  const args = cmd.slice(1);

  switch (op) {
    case 'ping':
      return 'PONG';

    case 'hlen': {
      const key = args[0];
      const h = hashStore.get(key);
      return h ? h.size : 0;
    }

    case 'hget': {
      const [key, field] = args;
      const h = hashStore.get(key);
      const val = h ? h.get(field) : null;
      return val !== undefined ? val : null;
    }

    case 'hset': {
      const key = args[0];
      const h = getHash(key);
      let count = 0;
      if (typeof args[1] === 'object' && args[1] !== null) {
        for (const [f, v] of Object.entries(args[1])) {
          h.set(f, typeof v === 'string' ? v : JSON.stringify(v));
          count++;
        }
      } else {
        for (let i = 1; i < args.length; i += 2) {
          const f = args[i];
          const v = args[i + 1];
          h.set(f, typeof v === 'string' ? v : JSON.stringify(v));
          count++;
        }
      }
      return count;
    }

    case 'hvals': {
      const key = args[0];
      const h = hashStore.get(key);
      if (!h) return [];
      return Array.from(h.values());
    }

    case 'hdel': {
      const [key, field] = args;
      const h = hashStore.get(key);
      if (!h) return 0;
      const existed = h.delete(field);
      return existed ? 1 : 0;
    }

    case 'del': {
      let count = 0;
      for (const k of args) {
        if (hashStore.delete(k)) count++;
        if (stringStore.delete(k)) count++;
        if (setStore.delete(k)) count++;
      }
      return count;
    }

    case 'get': {
      const key = args[0];
      const v = stringStore.get(key);
      return v !== undefined ? v : null;
    }

    case 'set': {
      const [key, val] = args;
      stringStore.set(key, typeof val === 'string' ? val : JSON.stringify(val));
      return 'OK';
    }

    case 'sadd': {
      const [key, ...members] = args;
      const s = getSet(key);
      let count = 0;
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m);
          count++;
        }
      }
      return count;
    }

    case 'smembers': {
      const key = args[0];
      const s = setStore.get(key);
      return s ? Array.from(s) : [];
    }

    case 'srem': {
      const [key, ...members] = args;
      const s = setStore.get(key);
      if (!s) return 0;
      let count = 0;
      for (const m of members) {
        if (s.delete(m)) count++;
      }
      return count;
    }

    default:
      console.warn(`[Mock Redis] Unhandled command: ${op}`);
      return 'OK';
  }
}

// Create and start Mock HTTP server for Upstash REST
const mockServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const isBase64 = req.headers['upstash-encoding'] === 'base64';

    try {
      if (req.url === '/pipeline') {
        const pipeline = JSON.parse(body);
        const results = pipeline.map((cmd) => {
          const rawResult = executeRedisCommand(cmd);
          return { result: encodeResult(rawResult, isBase64) };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
      }

      // Single command execution endpoint
      const parts = req.url.split('/').filter(Boolean);
      if (parts.length > 0) {
        const rawResult = executeRedisCommand(parts);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: encodeResult(rawResult, isBase64) }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

mockServer.listen(0, '127.0.0.1', async () => {
  const port = mockServer.address().port;
  console.log(`[SETUP] Local mock Upstash Redis active at http://127.0.0.1:${port}`);

  // Configure environment variables for this test run
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-integration-token-xyz';
  process.env.ADMIN_SESSION_SECRET = 'c8b671a539284249a42beff38b30743b17921a539284249a42beff38b30743b1';
  process.env.ADMIN_PASSPHRASE = 'Klasik_Test_Passphrase_2026';
  process.env.VERCEL_ENV = 'development';

  try {
    // Dynamically import application modules with mocked Redis configuration
    const { 
      getAuthoritativeProducts, 
      updateAuthoritativeProduct, 
      deleteAuthoritativeProduct, 
      updateAuthoritativeStock,
      decrementAuthoritativeStock,
      REDIS_HASH_KEY 
    } = await import('../src/lib/db.js');

    const { GET: getProductsRoute } = await import('../app/api/products/route.js');
    const { GET: getHealthRoute } = await import('../app/api/admin/health/route.js');

    // -------------------------------------------------------------------------
    // TEST 1: AUTHENTICATED /api/admin/health ENDPOINT
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing /api/admin/health authentication & metrics...');
    
    // Unauthenticated call must fail with 401
    const unauthReq = new Request('http://localhost:3000/api/admin/health', {
      method: 'GET',
      headers: new Headers(),
    });
    const unauthRes = await getHealthRoute(unauthReq);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated health check must return HTTP 401');
    console.log('  PASS: Unauthenticated health request rejected with 401');

    // Authenticated call with Bearer passphrase
    const authReq = new Request('http://localhost:3000/api/admin/health', {
      method: 'GET',
      headers: new Headers({
        Authorization: `Bearer ${process.env.ADMIN_PASSPHRASE}`,
      }),
    });
    const authRes = await getHealthRoute(authReq);
    assert.strictEqual(authRes.status, 200, 'Authenticated health check must return HTTP 200');
    const healthData = await authRes.json();
    assert.strictEqual(healthData.redisConnected, true, 'redisConnected must be true');
    assert.strictEqual(typeof healthData.productCount, 'number', 'productCount must be a number');
    assert.strictEqual(typeof healthData.newestUpdatedAt, 'number', 'newestUpdatedAt must be a number');
    assert.strictEqual(typeof healthData.blobEnvPresent, 'boolean', 'blobEnvPresent must be a boolean');
    console.log(`  PASS: Health metrics confirmed: redisConnected=${healthData.redisConnected}, productCount=${healthData.productCount}`);

    // -------------------------------------------------------------------------
    // TEST 2: INITIAL CATALOG SEEDING INTO REDIS HASH
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying initial catalog seed into Redis hash...');
    const initialList = await getAuthoritativeProducts();
    assert(initialList.length > 0, 'Catalog should seed initial products');
    const hash = hashStore.get(REDIS_HASH_KEY);
    assert(hash && hash.size > 0, 'Redis hash must contain seeded products');
    console.log(`  PASS: Initial catalog seeded ${hash.size} products into hash "${REDIS_HASH_KEY}"`);

    // -------------------------------------------------------------------------
    // TEST 3: PRICE CHANGE PERSISTENCE WITH VERIFICATION READ-BACK
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Updating product price in Redis...');
    const testTarget = initialList[0];
    const targetId = testTarget.id;
    const testNewPrice = 77800; // Distinct test price

    const updatedProduct = await updateAuthoritativeProduct({
      ...testTarget,
      id: targetId,
      price: testNewPrice,
      title: `${testTarget.title} (Verified Edition)`,
    });

    assert.strictEqual(updatedProduct.price, testNewPrice, 'Returned product must reflect new price');
    assert.strictEqual(updatedProduct.id, targetId, 'Product ID must match');

    // Directly verify that Redis hash stored the updated record
    const storedRaw = hash.get(targetId);
    assert(storedRaw, 'Target product must exist in Redis hash');
    const parsedStored = JSON.parse(storedRaw);
    assert.strictEqual(parsedStored.price, testNewPrice, 'Redis hash must contain new price');
    console.log(`  PASS: Saved price change (₦${testNewPrice}) confirmed in Redis hash`);

    // -------------------------------------------------------------------------
    // TEST 4: FRESH CLIENT WITH NO COOKIES READS /api/products
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Querying /api/products from fresh client with zero cookies...');
    
    // Fresh request with NO cookies and NO authorization headers
    const freshClientReq = new Request('http://localhost:3000/api/products', {
      method: 'GET',
      headers: new Headers({
        // Deliberately empty headers (no cookie, no credentials)
      }),
    });

    const productsResponse = await getProductsRoute(freshClientReq);
    assert.strictEqual(productsResponse.status, 200, 'Fresh client request must succeed with 200');
    
    const responsePayload = await productsResponse.json();
    assert.strictEqual(responsePayload.success, true, 'API response must indicate success: true');
    assert(Array.isArray(responsePayload.products), 'API response must contain products array');

    const freshTarget = responsePayload.products.find((p) => p.id === targetId);
    assert(freshTarget, `Fresh client must receive target product ${targetId}`);
    
    if (freshTarget.price !== testNewPrice) {
      throw new Error(
        `SYNC FAILURE: Fresh client received price ${freshTarget.price}, expected ${testNewPrice}!`
      );
    }
    console.log(`  PASS: Fresh client with no cookies saw updated price: ₦${freshTarget.price}`);

    // -------------------------------------------------------------------------
    // TEST 5: ATOMIC STOCK UPDATE & DECREMENT
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing atomic stock update and decrement...');
    const targetProductForStock = responsePayload.products[1];
    const stockId = targetProductForStock.id;

    // Set stock to 5
    await updateAuthoritativeStock(stockId, 5);
    let checkStock = JSON.parse(hash.get(stockId));
    assert.strictEqual(checkStock.stock, 5, 'Stock should be set to 5');

    // Decrement by 2
    const decResult = await decrementAuthoritativeStock(stockId, 2);
    assert.strictEqual(decResult.newStock, 3, 'Stock should decrement to 3');
    checkStock = JSON.parse(hash.get(stockId));
    assert.strictEqual(checkStock.stock, 3, 'Redis hash stock must be 3');

    // Read back via unauthenticated /api/products
    const freshStockReq = new Request('http://localhost:3000/api/products');
    const freshStockRes = await getProductsRoute(freshStockReq);
    const freshStockData = await freshStockRes.json();
    const freshStockItem = freshStockData.products.find((p) => p.id === stockId);
    assert.strictEqual(freshStockItem.stock, 3, 'Fresh client must see decremented stock of 3');
    console.log(`  PASS: Atomic stock decrement reflected on fresh client (stock=${freshStockItem.stock})`);

    // -------------------------------------------------------------------------
    // TEST 6: PRODUCT DELETION VIA HDEL
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Testing product deletion via HDEL...');
    await deleteAuthoritativeProduct(targetId);
    assert(!hash.has(targetId), 'Product must be removed from Redis hash');

    const freshAfterDeleteReq = new Request('http://localhost:3000/api/products');
    const freshAfterDeleteRes = await getProductsRoute(freshAfterDeleteReq);
    const freshAfterDeleteData = await freshAfterDeleteRes.json();
    const deletedFound = freshAfterDeleteData.products.find((p) => p.id === targetId);
    assert.strictEqual(deletedFound, undefined, 'Deleted product must not appear in /api/products');
    console.log(`  PASS: Product ${targetId} successfully deleted via HDEL and removed from fresh client view`);

    console.log('\n====================================================');
    console.log('ALL VERIFICATION SYNC TESTS PASSED (100% SUCCESS)');
    console.log('====================================================\n');

    mockServer.close();
    process.exit(0);
  } catch (err) {
    console.error('\nVERIFICATION TEST FAILED:', err);
    mockServer.close();
    process.exit(1);
  }
});
