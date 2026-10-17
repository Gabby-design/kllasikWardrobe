import { Redis } from '@upstash/redis';
import { PRODUCTS } from '../data/catalog.js';

const REDIS_KEY = 'klasik:products_v1';
const REDIS_REMOVED_KEY = 'klasik:removed_ids_v1';

let redisClient = null;

export function getRedis() {
  if (redisClient) return redisClient;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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
  const catalogList = Array.isArray(PRODUCTS) ? [...PRODUCTS] : [];
  return catalogList;
}

function ensureDatabaseClient() {
  const redis = getRedis();
  if (!redis) {
    throw new Error(
      'Database configuration missing: Set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in Vercel environment variables.'
    );
  }
  return redis;
}

/**
 * Fetch all authoritative products from persistent database.
 * In production, throws clear error if database is not configured.
 * In local development, falls back to seed catalog for viewing only.
 */
export async function getAuthoritativeProducts() {
  const redis = getRedis();
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  if (!redis) {
    if (isProduction) {
      throw new Error(
        'Database connection unavailable: KV_REST_API_URL and KV_REST_API_TOKEN must be configured in Vercel environment variables.'
      );
    }
    return getInitialSeedProducts();
  }

  try {
    const [storedProducts, removedIds] = await Promise.all([
      redis.get(REDIS_KEY),
      redis.smembers(REDIS_REMOVED_KEY).catch(() => [])
    ]);

    const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);

    if (Array.isArray(storedProducts) && storedProducts.length > 0) {
      return storedProducts.filter((p) => p && p.id && !removedSet.has(p.id));
    }

    // Auto-seed database if empty
    const seed = getInitialSeedProducts();
    await redis.set(REDIS_KEY, JSON.stringify(seed));
    return seed.filter((p) => !removedSet.has(p.id));
  } catch (err) {
    console.error('getAuthoritativeProducts database error:', err);
    if (isProduction) {
      throw new Error(`Database query failed: ${err.message}`);
    }
    return getInitialSeedProducts();
  }
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
 * Validate that image URLs are not base64/data: or blob:
 */
export function validateProductImageUrls(product) {
  const isInvalid = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.trim().toLowerCase();
    return lower.startsWith('data:') || lower.startsWith('blob:');
  };

  if (isInvalid(product.image)) {
    throw new Error('Invalid product image: data: and blob: URLs are not allowed. Please upload to Vercel Blob.');
  }
  if (Array.isArray(product.gallery)) {
    for (const gUrl of product.gallery) {
      if (isInvalid(gUrl)) {
        throw new Error('Invalid gallery image: data: and blob: URLs are not allowed. Please upload to Vercel Blob.');
      }
    }
  }
}

/**
 * Save, insert, or update a product in the database.
 * Never falls back to files or memory.
 */
export async function saveAuthoritativeProduct(product) {
  if (!product || !product.id) {
    throw new Error('Valid product with id is required');
  }

  validateProductImageUrls(product);
  const redis = ensureDatabaseClient();

  try {
    await redis.srem(REDIS_REMOVED_KEY, product.id).catch(() => {});

    const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
    const currentList = Array.isArray(storedProducts) ? storedProducts : [];

    const enrichedProduct = {
      ...product,
      updatedAt: new Date().toISOString()
    };

    const updatedList = [
      enrichedProduct,
      ...currentList.filter((p) => p.id !== product.id)
    ];

    await redis.set(REDIS_KEY, JSON.stringify(updatedList));
    return { success: true, product: enrichedProduct };
  } catch (err) {
    console.error('saveAuthoritativeProduct error:', err);
    throw err;
  }
}

/**
 * Delete a product by ID from the database.
 */
export async function deleteAuthoritativeProduct(productId) {
  if (!productId) {
    throw new Error('Product ID is required for deletion');
  }

  const redis = ensureDatabaseClient();

  try {
    await redis.sadd(REDIS_REMOVED_KEY, productId);

    const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
    const currentList = Array.isArray(storedProducts) ? storedProducts : [];
    const filteredList = currentList.filter((p) => p.id !== productId);

    await redis.set(REDIS_KEY, JSON.stringify(filteredList));
    return { success: true, id: productId };
  } catch (err) {
    console.error('deleteAuthoritativeProduct error:', err);
    throw err;
  }
}

/**
 * Update stock for a product directly in the database.
 */
export async function updateAuthoritativeStock(productId, newStock) {
  if (!productId) throw new Error('Product ID required');
  const redis = ensureDatabaseClient();

  const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
  const currentList = Array.isArray(storedProducts) ? storedProducts : [];
  const existing = currentList.find((p) => p.id === productId);
  if (!existing) throw new Error(`Product ${productId} not found`);

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

/**
 * Decrement stock for a product directly in the database.
 */
export async function decrementAuthoritativeStock(productId, qty = 1) {
  if (!productId) throw new Error('Product ID required');
  const redis = ensureDatabaseClient();

  const storedProducts = (await redis.get(REDIS_KEY)) || getInitialSeedProducts();
  const currentList = Array.isArray(storedProducts) ? storedProducts : [];
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
  await redis.set(REDIS_KEY, JSON.stringify(updatedList));

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
  const redis = ensureDatabaseClient();

  try {
    const seed = getInitialSeedProducts();
    await Promise.all([
      redis.set(REDIS_KEY, JSON.stringify(seed)),
      redis.del(REDIS_REMOVED_KEY)
    ]);
    return { success: true, count: seed.length };
  } catch (err) {
    console.error('resetDatabaseToCatalog error:', err);
    throw err;
  }
}
