import https from 'https';

const BASE_URL = 'https://kllasik-wardrobe.vercel.app';

function fetchUrl(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runAudit() {
  const results = [];
  console.log(`Starting LiveOS Audit on ${BASE_URL}...`);

  // 1. Homepage & Mobile Meta Verification
  try {
    const home = await fetchUrl('/');
    const hasViewport = home.body.includes('name="viewport"');
    const hasCartBtn = home.body.includes('aria-label="View Shopping Bag"');
    const hasStockIndicator = home.body.includes('remaining') || home.body.includes('available');
    const hasSwatches = home.body.includes('style="background-color:');
    const passed = home.status === 200 && hasViewport && hasCartBtn && hasStockIndicator && hasSwatches;
    results.push({
      test: 'Homepage Mobile Viewport & Catalog Grid',
      passed,
      details: `Status ${home.status}, Viewport: ${hasViewport}, CartBtn: ${hasCartBtn}, StockBadge: ${hasStockIndicator}, Swatches: ${hasSwatches}`
    });
  } catch (err) {
    results.push({ test: 'Homepage Mobile Viewport & Catalog Grid', passed: false, details: err.message });
  }

  // 2. Product Detail Page with Mobile Floating Bottom Bar
  try {
    const pdp = await fetchUrl('/product/kwt-06');
    const hasTitle = pdp.body.includes('Klasik Life Is Short Minimalist Clock Tee');
    const hasGsm = pdp.body.includes('300 GSM Heavy Silk Blend');
    const hasMaterial = pdp.body.includes('Mercerized Cotton') || pdp.body.includes('Cotton &amp; Silk');
    const hasFit = pdp.body.includes('Royal Cut Fit');
    const hasFloatingBar = pdp.body.includes('md:hidden fixed bottom-4') || pdp.body.includes('Claim Last');
    const hasGallery = pdp.body.includes('snap-x snap-mandatory');
    const passed = pdp.status === 200 && hasTitle && hasGsm && hasMaterial && hasFit && hasFloatingBar && hasGallery;
    results.push({
      test: 'Product Detail Mobile Page (kwt-06)',
      passed,
      details: `Status ${pdp.status}, Title: ${hasTitle}, GSM: ${hasGsm}, Material: ${hasMaterial}, Fit: ${hasFit}, MobileStickyBar: ${hasFloatingBar}, Gallery: ${hasGallery}`
    });
  } catch (err) {
    results.push({ test: 'Product Detail Mobile Page', passed: false, details: err.message });
  }

  // 3. Live Stock GET API Verification
  try {
    const stockGet = await fetchUrl('/api/products/stock');
    let json = {};
    try { json = JSON.parse(stockGet.body); } catch {}
    const hasStockData = json.success === true && json.stocks && typeof json.stocks['kwt-01'] === 'number';
    const totalItems = json.stocks ? Object.keys(json.stocks).length : 0;
    const passed = stockGet.status === 200 && hasStockData && totalItems >= 20;
    results.push({
      test: 'Live Stock GET API (/api/products/stock)',
      passed,
      details: `Status ${stockGet.status}, Success: ${json.success}, Total Products Synced: ${totalItems}`
    });
  } catch (err) {
    results.push({ test: 'Live Stock GET API', passed: false, details: err.message });
  }

  // 4. Live Stock POST API Decrement & Real-Time Alert
  try {
    const decrementPayload = JSON.stringify({ productId: 'kwt-06', quantity: 1 });
    const postRes = await fetchUrl('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(decrementPayload) },
      body: decrementPayload
    });
    let postJson = {};
    try { postJson = JSON.parse(postRes.body); } catch {}
    const decSuccess = postRes.status === 200 && postJson.success === true && typeof postJson.newStock === 'number';
    
    // Immediate Restore back to initial stock
    const restorePayload = JSON.stringify({ productId: 'kwt-06', action: 'set', newStock: 1 });
    const restoreRes = await fetchUrl('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(restorePayload) },
      body: restorePayload
    });
    let restoreJson = {};
    try { restoreJson = JSON.parse(restoreRes.body); } catch {}
    const restoreSuccess = restoreRes.status === 200 && restoreJson.success === true && restoreJson.newStock === 1;

    const passed = decSuccess && restoreSuccess;
    results.push({
      test: 'Live Stock POST API (Claim & Restore)',
      passed,
      details: `Decrement OK: ${decSuccess} (Stock: ${postJson.newStock}), Restore OK: ${restoreSuccess} (Stock: ${restoreJson.newStock})`
    });
  } catch (err) {
    results.push({ test: 'Live Stock POST API', passed: false, details: err.message });
  }

  // 5. Admin Dashboard Access Page
  try {
    const admin = await fetchUrl('/admin');
    const hasAdminForm = admin.body.includes('Admin Passphrase') || admin.body.includes('password');
    const hasLogo = admin.body.includes('klasik-logo-black.png');
    const passed = admin.status === 200 && hasAdminForm && hasLogo;
    results.push({
      test: 'Admin Portal Screen (/admin)',
      passed,
      details: `Status ${admin.status}, Auth Form: ${hasAdminForm}, Logo: ${hasLogo}`
    });
  } catch (err) {
    results.push({ test: 'Admin Portal Screen', passed: false, details: err.message });
  }

  // 6. Checkout Page
  try {
    const checkout = await fetchUrl('/checkout');
    const hasDeliveryForm = checkout.body.includes('Delivery') || checkout.body.includes('Order Checkout');
    const hasOrderButton = checkout.body.includes('WhatsApp') || checkout.body.includes('Place Order');
    const passed = checkout.status === 200 && hasDeliveryForm && hasOrderButton;
    results.push({
      test: 'Checkout Page (/checkout)',
      passed,
      details: `Status ${checkout.status}, DeliveryForm: ${hasDeliveryForm}, OrderButton: ${hasOrderButton}`
    });
  } catch (err) {
    results.push({ test: 'Checkout Page', passed: false, details: err.message });
  }

  console.log('\n--- AUDIT SUMMARY ---');
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${r.test}: ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log(`\nFinal Verdict: ${allPassed ? 'ALL SYSTEMS OPERATIONAL ON LIVE' : 'ISSUES DETECTED'}`);
}

runAudit();
