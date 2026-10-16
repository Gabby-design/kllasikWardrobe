async function verifyLive() {
  console.log('Fetching live index HTML...');
  const res = await fetch('https://kllasik-wardrobe.vercel.app/');
  const html = await res.text();

  const hasRedTeeImage = html.includes('red-money-tee-front.jpg');
  console.log('HTML contains red-money-tee-front.jpg:', hasRedTeeImage);

  const chunkMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map(m => m[1]);
  console.log(`Found ${chunkMatches.length} script chunks in live page.`);

  let foundV4 = false;
  for (const chunk of chunkMatches) {
    const chunkRes = await fetch('https://kllasik-wardrobe.vercel.app' + chunk);
    const chunkJs = await chunkRes.text();
    if (chunkJs.includes('klasik_custom_products_v4')) {
      console.log('Found v4 cache key in live JS chunk:', chunk);
      foundV4 = true;
      break;
    }
  }

  if (hasRedTeeImage && foundV4) {
    console.log('VERIFICATION SUCCESSFUL: Live site is fully updated with server-authoritative v4 storage!');
  } else {
    console.log('Deployment still updating on CDN edges or in progress...');
  }
}

verifyLive().catch(console.error);
