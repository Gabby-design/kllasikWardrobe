import fs from 'fs';
import path from 'path';
import os from 'os';
import { PRODUCTS } from './catalog.js';

const customProductsFile = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
const tmpCustomProductsFile = path.join(os.tmpdir(), 'klasik-custom-products.json');

const removedProductsFile = path.join(process.cwd(), 'src', 'data', 'removed-products.json');
const tmpRemovedProductsFile = path.join(os.tmpdir(), 'klasik-removed-products.json');

let inMemoryCustomProducts = null;
let inMemoryRemovedIds = null;

export function getRemovedProductIds() {
  try {
    if (fs.existsSync(removedProductsFile)) {
      const data = fs.readFileSync(removedProductsFile, 'utf-8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          inMemoryRemovedIds = parsed;
          return inMemoryRemovedIds;
        }
      }
    }
  } catch {}

  try {
    if (fs.existsSync(tmpRemovedProductsFile)) {
      const data = fs.readFileSync(tmpRemovedProductsFile, 'utf-8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          inMemoryRemovedIds = parsed;
          return inMemoryRemovedIds;
        }
      }
    }
  } catch {}

  if (inMemoryRemovedIds !== null) {
    return inMemoryRemovedIds;
  }
  inMemoryRemovedIds = [];
  return inMemoryRemovedIds;
}

export function saveRemovedProductIds(ids) {
  inMemoryRemovedIds = ids;
  try {
    fs.writeFileSync(removedProductsFile, JSON.stringify(ids, null, 2), 'utf-8');
  } catch {}
  try {
    fs.writeFileSync(tmpRemovedProductsFile, JSON.stringify(ids, null, 2), 'utf-8');
  } catch {}
}

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
  const removedIds = new Set(getRemovedProductIds());
  const customMap = new Map();

  custom.forEach((p) => {
    if (!removedIds.has(p.id)) {
      customMap.set(p.id, p);
    }
  });

  // Filter out removed catalog defaults and merge in-place
  const mergedDefaults = [];
  for (const defaultProd of PRODUCTS) {
    if (removedIds.has(defaultProd.id)) {
      continue;
    }
    if (customMap.has(defaultProd.id)) {
      mergedDefaults.push(customMap.get(defaultProd.id));
      customMap.delete(defaultProd.id);
    } else {
      mergedDefaults.push(defaultProd);
    }
  }

  // Any newly created custom products (not overriding defaults) go to the top
  const newlyCreated = Array.from(customMap.values());
  return [...newlyCreated, ...mergedDefaults];
}

export function saveCustomProduct(product) {
  try {
    // If it was previously marked removed, restore it
    const removed = getRemovedProductIds();
    if (removed.includes(product.id)) {
      saveRemovedProductIds(removed.filter((id) => id !== product.id));
    }

    const existing = getCustomProducts();
    const updated = [product, ...existing.filter((p) => p.id !== product.id)];
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
    // Record in removed IDs
    const removed = getRemovedProductIds();
    if (!removed.includes(productId)) {
      saveRemovedProductIds([...removed, productId]);
    }

    const existing = getCustomProducts();
    const filtered = existing.filter((p) => p.id !== productId);
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

export function updateProductStock(productId, newStock) {
  try {
    const all = getAllProducts();
    const existing = all.find((p) => p.id === productId);
    if (!existing) return null;
    const oldStock = Number(existing.stock !== undefined ? existing.stock : 10);
    const updated = {
      ...existing,
      stock: Math.max(0, Number(newStock)),
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    saveCustomProduct(updated);
    return { product: updated, previousStock: oldStock, newStock: updated.stock };
  } catch (err) {
    console.error('Error updating product stock:', err);
    return null;
  }
}

export function decrementProductStock(productId, qty = 1) {
  try {
    const all = getAllProducts();
    const existing = all.find((p) => p.id === productId);
    if (!existing) return null;
    const oldStock = Number(existing.stock !== undefined ? existing.stock : 10);
    const updatedStock = Math.max(0, oldStock - Number(qty));
    const updated = {
      ...existing,
      stock: updatedStock,
      updatedAt: new Date().toISOString(),
      isCustom: true,
    };
    saveCustomProduct(updated);
    return { 
      product: updated, 
      previousStock: oldStock, 
      newStock: updatedStock,
      wasLastUnit: oldStock === 1 && updatedStock === 0,
    };
  } catch (err) {
    console.error('Error decrementing product stock:', err);
    return null;
  }
}
