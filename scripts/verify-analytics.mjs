// scripts/verify-analytics.mjs
// Local integration verification test against mock Upstash Redis REST service.
// Validates:
// 1. Initial hit increases total page views, today's page views, all-time visitors, today's visitors, and online-now.
// 2. Repeated hit from the same visitor on the same path within 30s triggers rate limit and does not increment counts.
// 3. New path hit from the same visitor increments views and top pages, but unique visitors remains unchanged.
// 4. Hit from a second distinct visitor increases unique visitor count.
// 5. Bot User-Agents are ignored.
// 6. /admin, /api, and static asset paths are ignored.
// 7. getAnalyticsMetrics throws an explicit error when Redis is unavailable (no fake zeros).

import http from 'http';
import assert from 'assert';

console.log('===========================================================');
console.log('KLASIK WARDROBE: LOCAL VISITOR ANALYTICS VERIFICATION SUITE');
console.log('===========================================================\n');

// In-Memory Data Stores for Mock Upstash Redis
const stringStore = new Map();
const hashStore = new Map();
const hllStore = new Map(); // key -> Set of visitor IDs for HyperLogLog simulation
const zsetStore = new Map(); // key -> Map of member -> score

function getHll(key) {
  if (!hllStore.has(key)) hllStore.set(key, new Set());
  return hllStore.get(key);
}

function getZset(key) {
  if (!zsetStore.has(key)) zsetStore.set(key, new Map());
  return zsetStore.get(key);
}

function getHash(key) {
  if (!hashStore.has(key)) hashStore.set(key, new Map());
  return hashStore.get(key);
}

function executeRedisCommand(cmd) {
  const op = String(cmd[0]).toLowerCase();
  const args = cmd.slice(1);

  switch (op) {
    case 'ping':
      return 'PONG';

    case 'incr': {
      const key = args[0];
      const cur = parseInt(stringStore.get(key) || '0', 10);
      const next = cur + 1;
      stringStore.set(key, String(next));
      return next;
    }

    case 'get': {
      const key = args[0];
      const val = stringStore.get(key);
      return val !== undefined ? val : null;
    }

    case 'set': {
      const [key, val, ...rest] = args;
      const restLower = rest.map((r) => String(r).toLowerCase());
      const isNx = restLower.includes('nx');

      if (isNx && stringStore.has(key)) {
        return null; // Key already exists, NX fails
      }
      stringStore.set(key, String(val));
      return 'OK';
    }

    case 'expire':
      return 1;

    case 'pfadd': {
      const [key, ...elements] = args;
      const hll = getHll(key);
      let added = 0;
      for (const el of elements) {
        if (!hll.has(el)) {
          hll.add(el);
          added = 1;
        }
      }
      return added;
    }

    case 'pfcount': {
      const key = args[0];
      const hll = hllStore.get(key);
      return hll ? hll.size : 0;
    }

    case 'zincrby': {
      const [key, increment, member] = args;
      const z = getZset(key);
      const cur = z.get(member) || 0;
      const next = cur + Number(increment);
      z.set(member, next);
      return String(next);
    }

    case 'zadd': {
      const key = args[0];
      const z = getZset(key);
      // Syntax: [ZADD, key, score, member] or options
      let i = 1;
      let count = 0;
      while (i < args.length) {
        const score = Number(args[i]);
        const member = String(args[i + 1]);
        z.set(member, score);
        count++;
        i += 2;
      }
      return count;
    }

    case 'zremrangebyscore': {
      const [key, minStr, maxStr] = args;
      const min = Number(minStr);
      const max = Number(maxStr);
      const z = zsetStore.get(key);
      if (!z) return 0;
      let removed = 0;
      for (const [member, score] of z.entries()) {
        if (score >= min && score <= max) {
          z.delete(member);
          removed++;
        }
      }
      return removed;
    }

    case 'zcount': {
      const [key, minStr, maxStr] = args;
      const min = Number(minStr);
      const max = maxStr === '+inf' ? Infinity : Number(maxStr);
      const z = zsetStore.get(key);
      if (!z) return 0;
      let count = 0;
      for (const score of z.values()) {
        if (score >= min && score <= max) count++;
      }
      return count;
    }

    case 'zrange':
    case 'zrevrange': {
      const [key, startStr, stopStr, ...opts] = args;
      const start = Number(startStr);
      const stop = Number(stopStr);
      const optsLower = opts.map((o) => String(o).toLowerCase());
      const isRev = op === 'zrevrange' || optsLower.includes('rev');
      const withScores = optsLower.includes('withscores');
      const z = zsetStore.get(key);
      if (!z) return [];

      const sorted = Array.from(z.entries()).sort((a, b) => (isRev ? b[1] - a[1] : a[1] - b[1]));
      const sliced = sorted.slice(start, stop === -1 ? undefined : stop + 1);

      if (withScores) {
        const result = [];
        for (const [member, score] of sliced) {
          result.push({ member, score });
        }
        return result;
      }
      return sliced.map((s) => s[0]);
    }

    case 'hincrby': {
      const [key, field, increment] = args;
      const h = getHash(key);
      const cur = parseInt(h.get(field) || '0', 10);
      const next = cur + Number(increment);
      h.set(field, String(next));
      return next;
    }

    case 'hgetall': {
      const key = args[0];
      const h = hashStore.get(key);
      if (!h) return [];
      const arr = [];
      for (const [k, v] of h.entries()) {
        arr.push(k, String(v));
      }
      return arr;
    }

    default:
      console.warn(`[Mock Redis] Unhandled command: ${op}`);
      return 'OK';
  }
}

// Start Mock HTTP server for Upstash REST
const mockServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    try {
      if (req.url === '/pipeline') {
        const pipeline = JSON.parse(body);
        const results = pipeline.map((cmd) => {
          const rawResult = executeRedisCommand(cmd);
          return { result: rawResult };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
      }

      // Standalone command via POST or URL
      if (body) {
        const parsed = JSON.parse(body);
        if (Array.isArray(parsed)) {
          const rawResult = executeRedisCommand(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: rawResult }));
          return;
        }
      }

      // URL path format: /COMMAND/ARG1/ARG2
      const parts = req.url.split('?')[0].split('/').filter(Boolean);
      if (parts.length > 0) {
        const rawResult = executeRedisCommand(parts);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: rawResult }));
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
const mockPort = mockServer.address().port;
const mockUrl = `http://127.0.0.1:${mockPort}`;
console.log(`[Mock Redis Server] Running at ${mockUrl}\n`);

// Point environment to local mock Redis server
process.env.KV_REST_API_URL = mockUrl;
process.env.KV_REST_API_TOKEN = 'mock-test-token-12345';
process.env.UPSTASH_REDIS_REST_URL = mockUrl;
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-test-token-12345';

// Import modules under test
const { recordVisitorHit, getAnalyticsMetrics, getLagosDateStr } = await import('../src/lib/analytics.js');
const { POST: trackHandler } = await import('../app/api/track/route.js');

async function runTestSuite() {
  try {
    const today = getLagosDateStr();
    console.log(`[SETUP] Current Africa/Lagos date: ${today}`);

    // TEST 1: Initial hit from Visitor A on '/'
    console.log('\n[TEST 1] First visit from Visitor A on "/"');
    const req1 = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'x-vercel-ip-country': 'NG',
      },
      body: JSON.stringify({ visitorId: 'visitor-a-uuid-1234', path: '/' }),
    });

    const res1 = await trackHandler(req1);
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(json1.ok, true);
    assert.strictEqual(json1.counted, true);

    const m1 = await getAnalyticsMetrics();
    console.log('Metrics after Test 1:', {
      totalVisitors: m1.totalVisitors,
      todayVisitors: m1.todayVisitors,
      totalPageViews: m1.totalPageViews,
      todayPageViews: m1.todayPageViews,
      onlineNow: m1.onlineNow,
    });

    assert.strictEqual(m1.totalVisitors, 1, 'Total visitors should be 1');
    assert.strictEqual(m1.todayVisitors, 1, "Today's visitors should be 1");
    assert.strictEqual(m1.totalPageViews, 1, 'Total page views should be 1');
    assert.strictEqual(m1.todayPageViews, 1, "Today's page views should be 1");
    assert.strictEqual(m1.onlineNow, 1, 'Online now should be 1');
    console.log('PASS: Initial visit correctly registered across all metrics.');

    // TEST 2: Repeated hit from Visitor A on the same path '/' (Rate Limit test)
    console.log('\n[TEST 2] Repeated visit from Visitor A on "/" within 30 seconds');
    const req2 = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'x-vercel-ip-country': 'NG',
      },
      body: JSON.stringify({ visitorId: 'visitor-a-uuid-1234', path: '/' }),
    });

    const res2 = await trackHandler(req2);
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(json2.ok, true);
    assert.strictEqual(json2.rateLimited, true, 'Hit must be rate limited');

    const m2 = await getAnalyticsMetrics();
    assert.strictEqual(m2.totalPageViews, 1, 'Page views must NOT increase when rate limited');
    assert.strictEqual(m2.totalVisitors, 1, 'Unique visitors must not increase');
    console.log('PASS: Per-visitor rate limit enforced (no double-count within 30s).');

    // TEST 3: Visitor A visits a different path '/catalog'
    console.log('\n[TEST 3] Visitor A visits a new path "/catalog"');
    const req3 = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'x-vercel-ip-country': 'NG',
      },
      body: JSON.stringify({ visitorId: 'visitor-a-uuid-1234', path: '/catalog' }),
    });

    const res3 = await trackHandler(req3);
    const json3 = await res3.json();
    assert.strictEqual(res3.status, 200);
    assert.strictEqual(json3.counted, true);

    const m3 = await getAnalyticsMetrics();
    assert.strictEqual(m3.totalPageViews, 2, 'Total page views should now be 2');
    assert.strictEqual(m3.totalVisitors, 1, 'Unique visitors must STILL be 1');
    assert.strictEqual(m3.todayVisitors, 1, "Today's unique visitors must STILL be 1");
    console.log('Top pages recorded:', m3.topPages);
    assert.ok(m3.topPages.length >= 2, 'Top pages should record both paths');
    console.log('PASS: New route by same visitor increments page views but retains unique visitor count.');

    // TEST 4: Second distinct Visitor B visits '/product/kwt-01'
    console.log('\n[TEST 4] New Visitor B visits "/product/kwt-01"');
    const req4 = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'x-vercel-ip-country': 'US',
      },
      body: JSON.stringify({ visitorId: 'visitor-b-uuid-5678', path: '/product/kwt-01' }),
    });

    const res4 = await trackHandler(req4);
    const json4 = await res4.json();
    assert.strictEqual(json4.counted, true);

    const m4 = await getAnalyticsMetrics();
    assert.strictEqual(m4.totalVisitors, 2, 'Total unique visitors should now be 2');
    assert.strictEqual(m4.todayVisitors, 2, "Today's unique visitors should now be 2");
    assert.strictEqual(m4.totalPageViews, 3, 'Total page views should now be 3');
    assert.strictEqual(m4.onlineNow, 2, 'Online now should now be 2');
    console.log('PASS: Distinct visitor correctly incremented unique counts.');

    // TEST 5: Bot User-Agent ignored
    console.log('\n[TEST 5] Bot User-Agent detection (Googlebot, Bingbot)');
    const reqBot = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      body: JSON.stringify({ visitorId: 'bot-id-9999', path: '/' }),
    });

    const resBot = await trackHandler(reqBot);
    const jsonBot = await resBot.json();
    assert.strictEqual(resBot.status, 200);
    assert.strictEqual(jsonBot.ignored, 'bot');

    const mBot = await getAnalyticsMetrics();
    assert.strictEqual(mBot.totalPageViews, 3, 'Page views must NOT increase from bot');
    assert.strictEqual(mBot.totalVisitors, 2, 'Unique visitors must NOT increase from bot');
    console.log('PASS: Search crawler bot successfully ignored.');

    // TEST 6: /admin and static paths ignored
    console.log('\n[TEST 6] Ignored routes: /admin and static files');
    const reqAdmin = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'visitor-c-uuid', path: '/admin' }),
    });
    const resAdmin = await trackHandler(reqAdmin);
    const jsonAdmin = await resAdmin.json();
    assert.strictEqual(jsonAdmin.ignored, 'internal_or_static');

    const reqStatic = new Request('http://localhost:3000/api/track', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'visitor-c-uuid', path: '/images/hero.jpg' }),
    });
    const resStatic = await trackHandler(reqStatic);
    const jsonStatic = await resStatic.json();
    assert.strictEqual(jsonStatic.ignored, 'internal_or_static');

    const m6 = await getAnalyticsMetrics();
    assert.strictEqual(m6.totalPageViews, 3, 'Counts untouched by admin/static hits');
    console.log('PASS: Admin and static resource paths successfully filtered.');

    // TEST 7: Redis unavailable error check (Requirement 1: No fake zeros)
    console.log('\n[TEST 7] Redis unavailable: getAnalyticsMetrics must throw explicit error');
    // Shut down mock server to simulate Redis connection failure / network outage
    await new Promise((resolve) => mockServer.close(resolve));

    let caughtError = null;
    try {
      await getAnalyticsMetrics();
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError !== null, 'getAnalyticsMetrics MUST throw when Redis is unavailable');
    console.log('Caught explicit error as expected:', caughtError.message);
    console.log('PASS: Redis unavailable correctly throws and never returns fake zeros.');

    console.log('\n===========================================================');
    console.log('ALL 7 VISITOR ANALYTICS VERIFICATION TESTS PASSED!');
    console.log('===========================================================');
    return;
  } finally {
    try {
      mockServer.close();
    } catch {}
  }
}

runTestSuite().catch((err) => {
  console.error('\nFAILED TEST SUITE:', err);
  process.exit(1);
});
