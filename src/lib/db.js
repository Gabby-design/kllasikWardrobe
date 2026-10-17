import fs from 'fs';
import path from 'path';
import os from 'os';
import { Redis } from '@upstash/redis';
import { PRODUCTS } from '../data/catalog.js';
import customProductsJson from '../data/custom-products.json';
import removedProductsJson from '../data/removed-products.json';

const REDIS_KEY = 'klasik:products_v1';
const REDIS_REMOVED_KEY = 'klasik:removed_ids_v1';

const TMP_PRODUCTS_FILE = path.join(os.tmpdir(), 'klasik_authoritative_products.json');
const TMP_REMOVED_FILE = path.join(os.tmpdir(), 'klasik_authoritative_removed.json');

let redisClient = null;
let memoryProductsCache = null;
let memoryRemovedIdsCache = null;

export function getRedis() {
  if (redisClient) return redisClient;

  let url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  let token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    const urlKey = Object.keys(process.env).find(
      (k) => (k.endsWith('_REST_API_URL') || k.endsWith('_KV_URL') || k.includes('REDIS_REST_URL')) && process.env[k]?.trim()
    );
    const tokenKey = Object.keys(process.env).find(
      (k) => (k.endsWith('_REST_API_TOKEN') || k.endsWith('_KV_TOKEN') || k.includes('REDIS_REST_TOKEN')) && process.env[k]?.trim()
    );
    if (urlKey && tokenKey) {
      url = process.env[urlKey].trim();
      token = process.env[tokenKey].trim();
    }
  }

  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      return redisClient;
    } catch (e) {
      console.warn('Redis init notice:', e.message);
    }
  }
  return null;
}

export function getInitialSeedProducts() {
  const baseList = Array.isArray(PRODUCTS) ? [...PRODUCTS] : [];
  const customList = Array.isArray(customProductsJson) ? customProductsJson : [];
  const removedSet = new Set(Array.isArray(removedProductsJson) ? removedProductsJson : []);

  const productMap = new Map();

  for (const item of baseList) {
    if (item && item.id && !removedSet.has(item.id)) {
      productMap.set(item.id, { ...item });
    }
  }

  for (const item of customList) {
    if (item && item.id && !removedSet.has(item.id)) {
      const existing = productMap.get(item.id) || {};
      productMap.set(item.id, { ...existing, ...item });
    }
  }

  return Array.from(productMap.values());
}

function getFallbackStore() {
  if (memoryProductsCache !== null && memoryRemovedIdsCache !== null) {
    return {
      products: memoryProductsCache,
      removedSet: memoryRemovedIdsCache,
    };
  }

  let products = null;
  let removedIds = [];

  try {
    if (fs.existsSync(TMP_PRODUCTS_FILE)) {
      products = JSON.parse(fs.readFileSync(TMP_PRODUCTS_FILE, 'utf8'));
    }
  } catch {}

  try {
    if (fs.existsSync(TMP_REMOVED_FILE)) {
      removedIds = JSON.parse(fs.readFileSync(TMP_REMOVED_FILE, 'utf8'));
    }
  } catch {}

  if (!Array.isArray(products)) {
    products = getInitialSeedProducts();
  }

  memoryProductsCache = products;
  memoryRemovedIdsCache = new Set(Array.isArray(removedIds) ? removedIds : []);

  return {
    products: memoryProductsCache,
    removedSet: memoryRemovedIdsCache,
  };
}

function saveFallbackStore(products, removedSet) {
  memoryProductsCache = products;
  if (removedSet) {
    memoryRemovedIdsCache = new Set(removedSet);
  }
  try {
    fs.writeFileSync(TMP_PRODUCTS_FILE, JSON.stringify(products), 'utf8');
    if (removedSet) {
      fs.writeFileSync(TMP_REMOVED_FILE, JSON.stringify(Array.from(removedSet)), 'utf8');
    }
  } catch {}
}

/**
 * Fetch all authoritative products from persistent database.
 * If Redis database is not yet configured, gracefully falls back to local persistent store
 * so storefront and admin page never crash with 404 or unhandled errors.
 */
export async function getAuthoritativeProducts() {
  const redis = getRedis();

  if (redis) {
    try {
      const [storedProducts, removedIds] = await Promise.all([
        redis.get(REDIS_KEY),
        redis.smembers(REDIS_REMOVED_KEY).catch(() => [])
      ]);

      const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);

      let parsedProducts = storedProducts;
      if (typeof storedProducts === 'string') {
        try {
          parsedProducts = JSON.parse(storedProducts);
        } catch {}
      }

      if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
        return parsedProducts.filter((p) => p && p.id && !removedSet.has(p.id));
      }

      // Auto-seed database once ONLY if empty / not present
      const seed = getInitialSeedProducts();
      await redis.set(REDIS_KEY, JSON.stringify(seed));
      return seed.filter((p) => !removedSet.has(p.id));
    } catch (err) {
      console.warn('Redis query notice, falling back to local store:', err.message);
    }
  }

  // Graceful fallback store (memory + /tmp)
  const { products, removedSet } = getFallbackStore();
  return products.filter((p) => p && p.id && !removedSet.has(p.id));
}

/**
 * Fetch a single product by ID from authoritative database
 */
export async function getAuthoritativeProductById(productId) {
  if (!productId) return null;
  const all = await getAuthoritativeProducts();
  return all.find((p) => p.id === productId) || null;
}

/**
 * Validate that image URLs are not temporary blob: URLs
 */
export function validateProductImageUrls(product) {
  const isInvalid = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.trim().toLowerCase();
    // Prohibit temporary browser blob: URLs which die when tab closes
    return lower.startsWith('blob:');
  };

  if (isInvalid(product.image)) {
    throw new Error('Temporary browser blob: URLs cannot be saved. Please re-upload your photo.');
  }
  if (Array.isArray(product.gallery)) {
    for (const gUrl of product.gallery) {
      if (isInvalid(gUrl)) {
        throw new Error('Temporary browser blob: URLs cannot be saved. Please re-upload your photo.');
      }
    }
  }
}

/**
 * Save, insert, or update a product in the database.
 * If Redis is offline or not configured, persists to local fallback store cleanly.
 */
export async function saveAuthoritativeProduct(product) {
  if (!product || !product.id) {
    throw new Error('Valid product with id is required');
  }

  validateProductImageUrls(product);
  const redis = getRedis();

  const enrichedProduct = {
    ...product,
    updatedAt: new Date().toISOString()
  };

  if (redis) {
    try {
      await redis.srem(REDIS_REMOVED_KEY, product.id).catch(() => {});

      const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
      const currentList = Array.isArray(storedProducts) ? storedProducts : [];

      const updatedList = [
        enrichedProduct,
        ...currentList.filter((p) => p.id !== product.id)
      ];

      await redis.set(REDIS_KEY, JSON.stringify(updatedList));
      return { success: true, product: enrichedProduct };
    } catch (err) {
      console.warn('Redis save notice, saving to local fallback store:', err.message);
    }
  }

  // Fallback persistent storage (/tmp + memory)
  const { products: currentList, removedSet } = getFallbackStore();
  removedSet.delete(product.id);
  const updatedList = [
    enrichedProduct,
    ...currentList.filter((p) => p.id !== product.id)
  ];
  saveFallbackStore(updatedList, removedSet);
  return { success: true, product: enrichedProduct };
}

/**
 * Delete a product by ID from the database.
 */
export async function deleteAuthoritativeProduct(productId) {
  if (!productId) {
    throw new Error('Product ID is required for deletion');
  }

  const redis = getRedis();

  if (redis) {
    try {
      await redis.sadd(REDIS_REMOVED_KEY, productId);

      const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
      const currentList = Array.isArray(storedProducts) ? storedProducts : [];
      const filteredList = currentList.filter((p) => p.id !== productId);

      await redis.set(REDIS_KEY, JSON.stringify(filteredList));
      return { success: true, id: productId };
    } catch (err) {
      console.warn('Redis delete notice, deleting from local fallback store:', err.message);
    }
  }

  // Fallback persistent storage (/tmp + memory)
  const { products: currentList, removedSet } = getFallbackStore();
  removedSet.add(productId);
  const filteredList = currentList.filter((p) => p.id !== productId);
  saveFallbackStore(filteredList, removedSet);
  return { success: true, id: productId };
}

/**
 * Update stock for a product directly in the database.
 */
export async function updateAuthoritativeStock(productId, newStock) {
  if (!productId) throw new Error('Product ID required');
  const redis = getRedis();

  if (redis) {
    try {
      const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
      const currentList = Array.isArray(storedProducts) ? storedProducts : [];
      const existing = currentList.find((p) => p.id === productId);
      if (existing) {
        const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
        const updatedProduct = {
          ...existing,
          stock: Math.max(0, Number(newStock)),
          updatedAt: new Date().toISOString()
        };

        const updatedList = currentList.map((p) => (p.id === productId ? updatedProduct : p));
        await redis.set(REDIS_KEY, JSON.stringify(updatedList));

        return { product: updatedProduct, previousStock: prevStock, newStock: updatedProduct.stock };
      }
    } catch (err) {
      console.warn('Redis stock update notice, updating fallback store:', err.message);
    }
  }

  const { products: currentList, removedSet } = getFallbackStore();
  const existing = currentList.find((p) => p.id === productId);
  if (!existing) throw new Error(`Product ${productId} not found`);

  const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
  const updatedProduct = {
    ...existing,
    stock: Math.max(0, Number(newStock)),
    updatedAt: new Date().toISOString()
  };

  const updatedList = currentList.map((p) => (p.id === productId ? updatedProduct : p));
  saveFallbackStore(updatedList, removedSet);

  return { product: updatedProduct, previousStock: prevStock, newStock: updatedProduct.stock };
}

/**
 * Decrement stock for a product directly in the database.
 */
export async function decrementAuthoritativeStock(productId, qty = 1) {
  if (!productId) throw new Error('Product ID required');
  const redis = getRedis();

  if (redis) {
    try {
      const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
      const currentList = Array.isArray(storedProducts) ? storedProducts : [];
      const existing = currentList.find((p) => p.id === productId);
      if (existing) {
        const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
        const updatedStock = Math.max(0, prevStock - Number(qty || 1));
        const updatedProduct = {
          ...existing,
          stock: updatedStock,
          updatedAt: new Date().toISOString()
        };

        const updatedList = currentList.map((p) => (p.id === productId ? updatedProduct : p));
        await redis.set(REDIS_KEY, JSON.stringify(updatedList));

        return {
          product: updatedProduct,
          previousStock: prevStock,
          newStock: updatedStock,
          wasLastUnit: prevStock === 1 && updatedStock === 0
        };
      }
    } catch (err) {
      console.warn('Redis decrement notice, decrementing fallback store:', err.message);
    }
  }

  const { products: currentList, removedSet } = getFallbackStore();
  const existing = currentList.find((p) => p.id === productId);
  if (!existing) throw new Error(`Product ${productId} not found`);

  const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
  const updatedStock = Math.max(0, prevStock - Number(qty || 1));
  const updatedProduct = {
    ...existing,
    stock: updatedStock,
    updatedAt: new Date().toISOString()
  };

  const updatedList = currentList.map((p) => (p.id === productId ? updatedProduct : p));
  saveFallbackStore(updatedList, removedSet);

  return {
    product: updatedProduct,
    previousStock: prevStock,
    newStock: updatedStock,
    wasLastUnit: prevStock === 1 && updatedStock === 0
  };
}

/**
 * Reset database back to original codebase catalog.
 */
export async function resetDatabaseToCatalog() {
  const redis = getRedis();

  if (redis) {
    try {
      const seed = getInitialSeedProducts();
      await Promise.all([
        redis.set(REDIS_KEY, JSON.stringify(seed)),
        redis.del(REDIS_REMOVED_KEY)
      ]);
      return { success: true, count: seed.length };
    } catch (err) {
      console.warn('Redis reset notice, resetting fallback store:', err.message);
    }
  }

  const seed = getInitialSeedProducts();
  saveFallbackStore(seed, new Set());
  return { success: true, count: seed.length };
}
