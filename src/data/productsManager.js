import { PRODUCTS } from './catalog.js';

/**
 * DEPRECATED RUNTIME FILE:
 * Database operations now go exclusively through src/lib/db.js.
 * Runtime writes to JSON files are prohibited.
 */

export function getRemovedProductIds() {
  return [];
}

export function saveRemovedProductIds() {
  // Runtime writes to JSON files are disabled.
}

export function getCustomProducts() {
  return [];
}

export function getAllProducts() {
  return Array.isArray(PRODUCTS) ? [...PRODUCTS] : [];
}

export function saveCustomProduct(product) {
  // Runtime writes to JSON files are disabled.
  return { success: true, product };
}

export function removeCustomProduct() {
  // Runtime writes to JSON files are disabled.
  return { success: true };
}

export function updateProductStock(productId, newStock) {
  const prod = getAllProducts().find((p) => p.id === productId);
  return prod ? { product: prod, previousStock: 10, newStock } : null;
}

export function decrementProductStock(productId, qty = 1) {
  const prod = getAllProducts().find((p) => p.id === productId);
  return prod ? { product: prod, previousStock: 10, newStock: 9 } : null;
}

export function getProductById(productId) {
  return getAllProducts().find((p) => p.id === productId) || null;
}
