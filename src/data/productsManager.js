import fs from 'fs';
import path from 'path';
import { PRODUCTS } from './catalog';

const customProductsFile = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
let inMemoryCustomProducts = null;

export function getCustomProducts() {
  if (inMemoryCustomProducts !== null) {
    return inMemoryCustomProducts;
  }
  try {
    if (fs.existsSync(customProductsFile)) {
      const data = fs.readFileSync(customProductsFile, 'utf-8');
      inMemoryCustomProducts = JSON.parse(data) || [];
      return inMemoryCustomProducts;
    }
  } catch (err) {
    console.warn('Error reading custom products file:', err.message);
  }
  inMemoryCustomProducts = inMemoryCustomProducts || [];
  return inMemoryCustomProducts;
}

export function getAllProducts() {
  const custom = getCustomProducts();
  // Filter out any default products that might have been overridden by ID
  const customIds = new Set(custom.map(p => p.id));
  const activeDefaults = PRODUCTS.filter(p => !customIds.has(p.id));
  return [...custom, ...activeDefaults];
}

export function saveCustomProduct(product) {
  try {
    const existing = getCustomProducts();
    const updated = [product, ...existing.filter(p => p.id !== product.id)];
    inMemoryCustomProducts = updated;
    try {
      fs.writeFileSync(customProductsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Filesystem write skipped for custom product (read-only):', fsErr.message);
    }
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
    } catch (fsErr) {
      console.warn('Filesystem delete skipped (read-only):', fsErr.message);
    }
    return { success: true };
  } catch (err) {
    console.error('Error deleting custom product:', err);
    return { success: false, error: err.message };
  }
}
