// scripts/test-live-and-local.mjs
import fs from 'fs';
import path from 'path';

// Load .env.local
if (fs.existsSync('.env.local')) {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env.local');
  } else {
    const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

import assert from 'assert';
import { createAdminSessionToken } from '../src/lib/auth.js';

const LOCAL_BASE = 'http://localhost:3001';
const PROD_BASE = 'https://kllasik-wardrobe.vercel.app';

console.log('================================================================');
console.log('KLASIK WARDROBE: LOCALHOST & VERCEL DUAL-ENVIRONMENT TEST SUITE');
console.log('================================================================');

async function testEnvironment(baseUrl, name) {
  console.log(`\n>>> Testing [${name}] at ${baseUrl} ...`);
  const results = { passed: 0, failed: 0, details: [] };

  const record = (testName, pass, msg) => {
    if (pass) {
      results.passed++;
      console.log(`  [PASS] ${testName}: ${msg}`);
      results.details.push({ test: testName, status: 'PASS', msg });
    } else {
      results.failed++;
      console.error(`  [FAIL] ${testName}: ${msg}`);
      results.details.push({ test: testName, status: 'FAIL', msg });
    }
  };

  // 1. Check Homepage
  try {
    const res = await fetch(`${baseUrl}/`, { method: 'GET' });
    record('Homepage', res.status === 200, `Status ${res.status}`);
  } catch (err) {
    record('Homepage', false, err.message);
  }

  // 2. Check /api/products
  let products = [];
  try {
    const res = await fetch(`${baseUrl}/api/products`, { method: 'GET' });
    if (res.status === 200) {
      const data = await res.json();
      products = data.products || [];
      const categories = [...new Set(products.map((p) => p.category))];
      const hasLongSleeves = categories.includes('Long Sleeves');
      const hasUpAndDown = categories.includes('Up and Down');
      const lsCount = products.filter((p) => p.category === 'Long Sleeves').length;
      const udCount = products.filter((p) => p.category === 'Up and Down').length;

      record(
        'Products API',
        products.length >= 20 && hasLongSleeves && hasUpAndDown,
        `Total: ${products.length} products. Categories: [${categories.join(', ')}]. Long Sleeves: ${lsCount}, Up and Down: ${udCount}`
      );
    } else {
      record('Products API', false, `Status ${res.status}`);
    }
  } catch (err) {
    record('Products API', false, err.message);
  }

  // 3. Check AI Auto-Detection Endpoint
  const token = createAdminSessionToken();
  try {
    // Unauth check
    const unauth = await fetch(`${baseUrl}/api/admin/analyze-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'test.jpg' }),
    });
    record('AI Analyze Auth Gate', unauth.status === 401, `Unauth returned status ${unauth.status}`);

    // Auth check with Long Sleeves image name
    const authRes = await fetch(`${baseUrl}/api/admin/analyze-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName: 'heavyweight-long-sleeve-tee-charcoal.jpg' }),
    });

    if (authRes.status === 200) {
      const authData = await authRes.json();
      const detectedCat = authData.analysis?.category;
      record(
        'AI Analyze Detection',
        detectedCat === 'Long Sleeves',
        `Classified as "${detectedCat}", Title: "${authData.analysis?.title}", Price: ₦${authData.analysis?.price}`
      );
    } else {
      record('AI Analyze Detection', false, `Status ${authRes.status}`);
    }

    // Auth check with Up and Down image name
    const authRes2 = await fetch(`${baseUrl}/api/admin/analyze-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName: 'luxury-corduroy-up-and-down-tracksuit.jpg' }),
    });

    if (authRes2.status === 200) {
      const authData2 = await authRes2.json();
      const detectedCat2 = authData2.analysis?.category;
      record(
        'AI Up & Down Detection',
        detectedCat2 === 'Up and Down',
        `Classified as "${detectedCat2}", Title: "${authData2.analysis?.title}", Price: ₦${authData2.analysis?.price}`
      );
    } else {
      record('AI Up & Down Detection', false, `Status ${authRes2.status}`);
    }
  } catch (err) {
    record('AI Analyze Endpoint', false, err.message);
  }

  // 4. Check Image Upload Endpoint
  try {
    const unauthUpload = await fetch(`${baseUrl}/api/admin/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    record('Upload Auth Gate', unauthUpload.status === 401, `Unauth upload returned status ${unauthUpload.status}`);

    // Create a 1x1 valid transparent PNG binary buffer
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'test_upload_validation.png');

    const authUpload = await fetch(`${baseUrl}/api/admin/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `admin_auth=${token}`,
      },
      body: formData,
    });

    if (authUpload.status === 200) {
      const uploadData = await authUpload.json();
      const url = uploadData.urls?.[0] || uploadData.url;
      record(
        'Image Upload API',
        Boolean(url && url.length > 5),
        `Upload succeeded! Storage: ${uploadData.storage || 'cloud'}, Public URL: ${url}`
      );
    } else {
      const errText = await authUpload.text();
      record('Image Upload API', false, `Status ${authUpload.status}: ${errText.slice(0, 150)}`);
    }
  } catch (err) {
    record('Image Upload API', false, err.message);
  }

  return results;
}

async function run() {
  const localResults = await testEnvironment(LOCAL_BASE, 'LOCALHOST (DEV)');
  const prodResults = await testEnvironment(PROD_BASE, 'VERCEL (PRODUCTION)');

  console.log('\n================================================================');
  console.log('SUMMARY RESULTS:');
  console.log(`  Localhost : ${localResults.passed} Passed / ${localResults.failed} Failed`);
  console.log(`  Vercel    : ${prodResults.passed} Passed / ${prodResults.failed} Failed`);
  console.log('================================================================\n');

  if (localResults.failed > 0 || prodResults.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
