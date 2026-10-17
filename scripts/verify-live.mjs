// scripts/verify-live.mjs
const BASE_URL = 'https://kllasik-wardrobe.vercel.app';
const PASSPHRASE = 'Kllasik_79da8dad9665';

async function run() {
  console.log('1. Checking live health endpoint...');
  const healthRes = await fetch(`${BASE_URL}/api/admin/health`, {
    headers: { Authorization: `Bearer ${PASSPHRASE}` },
  });
  const health = await healthRes.json();
  console.log('Health status:', health);
  if (!health.redisConnected) throw new Error('Redis not connected');
  if (health.productCount <= 0) throw new Error('Product count is 0');

  console.log('2. Fetching public products (Client A - initial)...');
  const initialRes = await fetch(`${BASE_URL}/api/products`);
  const initialData = await initialRes.json();
  const target = initialData.products.find(p => p.id === 'kwt-08');
  if (!target) throw new Error('Target product kwt-08 not found');
  const originalPrice = target.price;
  const testPrice = originalPrice === 40000 ? 42500 : 40000;
  console.log(`Target: ${target.title} (ID: ${target.id}), Current Price: ${originalPrice}, Test Price: ${testPrice}`);

  console.log('3. Updating price via PUT /api/products (simulating /admin save on Device 1)...');
  const updatedProduct = { ...target, price: testPrice };
  const updateRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PASSPHRASE}`,
    },
    body: JSON.stringify(updatedProduct),
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.product?.price !== testPrice) {
    throw new Error(`Update failed: ${JSON.stringify(updateData)}`);
  }
  console.log('Admin save confirmed by server. Returned verified price:', updateData.product.price);

  console.log('4. Fetching from completely separate unauthenticated client (simulating Device 2 / mobile)...');
  const device2Res = await fetch(`${BASE_URL}/api/products`, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  const device2Data = await device2Res.json();
  const device2Product = device2Data.products.find(p => p.id === 'kwt-08');
  console.log('Device 2 observed price:', device2Product?.price);
  if (device2Product?.price !== testPrice) {
    throw new Error(`Price mismatch on Device 2! Expected ${testPrice}, got ${device2Product?.price}`);
  }
  console.log('SUCCESS: Device 2 immediately sees the price updated in Redis!');

  console.log('5. Restoring original price...');
  const restoreRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PASSPHRASE}`,
    },
    body: JSON.stringify({ ...target, price: originalPrice }),
  });
  const restoreData = await restoreRes.json();
  console.log('Restored verified price:', restoreData.product?.price);

  console.log('6. Verifying restored state on fresh client...');
  const finalRes = await fetch(`${BASE_URL}/api/products`, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  const finalData = await finalRes.json();
  const finalProduct = finalData.products.find(p => p.id === 'kwt-08');
  console.log('Final verified price on Device 2:', finalProduct?.price);
  if (finalProduct?.price !== originalPrice) {
    throw new Error(`Restore failed! Expected ${originalPrice}, got ${finalProduct?.price}`);
  }

  console.log('\nLIVE PERSISTENCE AND CROSS-DEVICE SYNC FULLY VERIFIED ON PRODUCTION!');
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
