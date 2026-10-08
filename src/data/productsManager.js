import fs from 'fs';
import path from 'path';
import os from 'os';
import { PRODUCTS } from './catalog.js';

const customProductsFile = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
const tmpCustomProductsFile = path.join(os.tmpdir(), 'klasik-custom-products.json');
let inMemoryCustomProducts = null;

export function getCustomProducts() {
  // 1. Try reading from primary project file
  try {
    if (fs.existsSync(customProductsFile)) {
      const data = fs.readFileSync(customProductsFile, 'utf-8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          inMemoryCustomProducts = parsed;
          return inMemoryCustomProducts;
        }
      }
    }
  } catch (err) {
    // Filesystem read failed or read-only
  }

  // 2. Fallback to /tmp if primary file wasn't loaded or on serverless
  try {
    if (fs.existsSync(tmpCustomProductsFile)) {
      const data = fs.readFileSync(tmpCustomProductsFile, 'utf-8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          inMemoryCustomProducts = parsed;
          return inMemoryCustomProducts;
        }
      }
    }
  } catch (err) {}

  if (inMemoryCustomProducts !== null) {
    return inMemoryCustomProducts;
  }
  inMemoryCustomProducts = [];
  return inMemoryCustomProducts;
}

export function getAllProducts() {
  const custom = getCustomProducts();
  const customMap = new Map(custom.map(p => [p.id, p]));

  // Merge edits into catalog defaults in-place to preserve catalog order
  const mergedDefaults = PRODUCTS.map(defaultProd => {
    if (customMap.has(defaultProd.id)) {
      const updated = customMap.get(defaultProd.id);
      customMap.delete(defaultProd.id);
      return updated;
    }
    return defaultProd;
  });

  // Any newly created custom products (not overriding defaults) go to the top
  const newlyCreated = Array.from(customMap.values());
  return [...newlyCreated, ...mergedDefaults];
}

export function saveCustomProduct(product) {
  try {
    const existing = getCustomProducts();
    const updated = [product, ...existing.filter(p => p.id !== product.id)];
    inMemoryCustomProducts = updated;

    // Write to primary file
    try {
      fs.writeFileSync(customProductsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (fsErr) {
      // Primary write skipped (e.g. read-only on Vercel)
    }

    // Also write to /tmp as serverless fallback
    try {
      fs.writeFileSync(tmpCustomProductsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (tmpErr) {}

    return { success: true, product };
  } catch (err) {
    console.error('Error saving custom product:', err);
    return { success: false, error: err.message };
  }
}

export function removeCustomProduct(productId) {
  try {
    const existing = getCustomProducts();
    const filtered = existing.filter(p => p.id !== productId);
    inMemoryCustomProducts = filtered;

    try {
      fs.writeFileSync(customProductsFile, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (fsErr) {}

    try {
      fs.writeFileSync(tmpCustomProductsFile, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (tmpErr) {}

    return { success: true };
  } catch (err) {
    console.error('Error deleting custom product:', err);
    return { success: false, error: err.message };
  }
}
