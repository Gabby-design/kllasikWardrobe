import { Redis } from '@upstash/redis';
import { createRequire } from 'module';
import { PRODUCTS } from '../data/catalog.js';

const require = createRequire(import.meta.url);
const customProductsJson = require('../data/custom-products.json');
const removedProductsJson = require('../data/removed-products.json');

export const REDIS_HASH_KEY = 'klasik:products_v2';
export const REDIS_OLD_KEY = 'klasik:products_v1';
export const REDIS_REMOVED_KEY = 'klasik:removed_ids_v1';

let redisClient = null;

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

export function ensureRedis() {
  const redis = getRedis();
  if (!redis) {
    throw new Error(
      'Database configuration missing: Set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in environment variables.'
    );
  }
  return redis;
}

export function parseRedisProduct(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

/**
 * Migration & Seeding:
 * Seed from static catalog + custom-products.json minus removed-products.json
 * ONLY when hash is empty; never overwrite existing data.
 * Migrate existing data from old key klasik:products_v1 once if present.
 */
async function ensureHashSeeded(redis) {
  const count = await redis.hlen(REDIS_HASH_KEY);
  if (count > 0) return;

  // 1. Check for legacy klasik:products_v1 list to migrate
  try {
    const oldRaw = await redis.get(REDIS_OLD_KEY);
    const oldList = parseRedisProduct(oldRaw);
    if (Array.isArray(oldList) && oldList.length > 0) {
      const removedIds = await redis.smembers(REDIS_REMOVED_KEY).catch(() => []);
      const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);
      for (const item of oldList) {
        if (item && item.id && !removedSet.has(item.id)) {
          await redis.hset(REDIS_HASH_KEY, { [item.id]: JSON.stringify(item) });
        }
      }
      const migratedCount = await redis.hlen(REDIS_HASH_KEY);
      if (migratedCount > 0) return;
    }
  } catch (migErr) {
    console.warn('[DB] Migration from v1 notice:', migErr.message);
  }

  // 2. Initial seed
  const seed = getInitialSeedProducts();
  const removedIds = await redis.smembers(REDIS_REMOVED_KEY).catch(() => []);
  const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);

  for (const item of seed) {
    if (item && item.id && !removedSet.has(item.id)) {
      await redis.hset(REDIS_HASH_KEY, { [item.id]: JSON.stringify(item) });
    }
  }
}

/**
 * Validate that image URLs are not temporary blob: URLs
 */
export function validateProductImageUrls(product) {
  const isInvalid = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.trim().toLowerCase();
    return lower.startsWith('blob:') || lower.startsWith('data:');
  };

  if (isInvalid(product.image)) {
    throw new Error('data: and blob: URLs are not allowed. Please re-upload your photo.');
  }
  if (Array.isArray(product.gallery)) {
    for (const gUrl of product.gallery) {
      if (isInvalid(gUrl)) {
        throw new Error('data: and blob: URLs are not allowed. Please re-upload your photo.');
      }
    }
  }
}

/**
 * Fetch all authoritative products from persistent Redis database.
 * Throws if Redis is not configured or fails.
 */
export async function getAuthoritativeProducts() {
  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  const [rawValues, removedIds] = await Promise.all([
    redis.hvals(REDIS_HASH_KEY),
    redis.smembers(REDIS_REMOVED_KEY).catch(() => [])
  ]);

  const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);
  const products = [];

  for (const val of (Array.isArray(rawValues) ? rawValues : [])) {
    const p = parseRedisProduct(val);
    if (p && p.id && !removedSet.has(p.id)) {
      products.push(p);
    }
  }

  return products;
}

/**
 * Fetch a single product by ID from authoritative Redis database.
 */
export async function getAuthoritativeProductById(productId) {
  if (!productId) return null;
  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  const raw = await redis.hget(REDIS_HASH_KEY, productId);
  const product = parseRedisProduct(raw);
  if (!product) return null;

  const isRemoved = await redis.sismember(REDIS_REMOVED_KEY, productId).catch(() => 0);
  if (isRemoved) return null;

  return product;
}

/**
 * Save, insert, or update a product in Redis hash.
 * Verifies the read-back copy before returning.
 */
export async function saveAuthoritativeProduct(product) {
  if (!product || !product.id) {
    throw new Error('Valid product with id is required');
  }

  validateProductImageUrls(product);
  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  const enrichedProduct = {
    ...product,
    updatedAt: new Date().toISOString()
  };

  await redis.srem(REDIS_REMOVED_KEY, product.id).catch(() => {});
  await redis.hset(REDIS_HASH_KEY, { [product.id]: JSON.stringify(enrichedProduct) });

  // Read back and verify write
  const readBack = await redis.hget(REDIS_HASH_KEY, product.id);
  const verified = parseRedisProduct(readBack);
  if (!verified || verified.id !== product.id || verified.updatedAt !== enrichedProduct.updatedAt) {
    throw new Error(`Write verification failed: Product ${product.id} could not be verified in Redis after saving.`);
  }

  // Attach success and product properties for dual compatibility
  Object.assign(verified, { success: true, product: verified });
  return verified;
}

export const updateAuthoritativeProduct = saveAuthoritativeProduct;

/**
 * Delete a product by ID from Redis hash.
 * Verifies deletion before returning.
 */
export async function deleteAuthoritativeProduct(productId) {
  if (!productId) {
    throw new Error('Product ID is required for deletion');
  }

  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  await Promise.all([
    redis.hdel(REDIS_HASH_KEY, productId),
    redis.sadd(REDIS_REMOVED_KEY, productId)
  ]);

  const check = await redis.hget(REDIS_HASH_KEY, productId);
  if (check) {
    throw new Error(`Delete verification failed: Product ${productId} still exists in Redis.`);
  }

  return { success: true, id: productId };
}

/**
 * Update stock for a product directly in Redis hash.
 */
export async function updateAuthoritativeStock(productId, newStock) {
  if (!productId) throw new Error('Product ID required');
  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  const raw = await redis.hget(REDIS_HASH_KEY, productId);
  const existing = parseRedisProduct(raw);
  if (!existing) throw new Error(`Product ${productId} not found in database`);

  const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
  const updatedProduct = {
    ...existing,
    stock: Math.max(0, Number(newStock)),
    updatedAt: new Date().toISOString()
  };

  await redis.hset(REDIS_HASH_KEY, { [productId]: JSON.stringify(updatedProduct) });

  const verified = parseRedisProduct(await redis.hget(REDIS_HASH_KEY, productId));
  if (!verified || verified.stock !== updatedProduct.stock) {
    throw new Error(`Stock write verification failed for product ${productId}`);
  }

  return { product: verified, previousStock: prevStock, newStock: verified.stock };
}

/**
 * Decrement stock for a product directly in Redis hash.
 */
export async function decrementAuthoritativeStock(productId, qty = 1) {
  if (!productId) throw new Error('Product ID required');
  const redis = ensureRedis();
  await ensureHashSeeded(redis);

  const raw = await redis.hget(REDIS_HASH_KEY, productId);
  const existing = parseRedisProduct(raw);
  if (!existing) throw new Error(`Product ${productId} not found in database`);

  const prevStock = Number(existing.stock !== undefined ? existing.stock : 10);
  const updatedStock = Math.max(0, prevStock - Number(qty || 1));
  const updatedProduct = {
    ...existing,
    stock: updatedStock,
    updatedAt: new Date().toISOString()
  };

  await redis.hset(REDIS_HASH_KEY, { [productId]: JSON.stringify(updatedProduct) });

  const verified = parseRedisProduct(await redis.hget(REDIS_HASH_KEY, productId));
  if (!verified || verified.stock !== updatedStock) {
    throw new Error(`Stock decrement verification failed for product ${productId}`);
  }

  return {
    product: verified,
    previousStock: prevStock,
    newStock: updatedStock,
    wasLastUnit: prevStock === 1 && updatedStock === 0
  };
}

/**
 * Reset database back to original codebase catalog.
 */
export async function resetDatabaseToCatalog() {
  const redis = ensureRedis();

  await Promise.all([
    redis.del(REDIS_HASH_KEY),
    redis.del(REDIS_REMOVED_KEY),
    redis.del(REDIS_OLD_KEY).catch(() => {})
  ]);

  const seed = getInitialSeedProducts();
  for (const item of seed) {
    if (item && item.id) {
      await redis.hset(REDIS_HASH_KEY, { [item.id]: JSON.stringify(item) });
    }
  }

  const verifiedCount = await redis.hlen(REDIS_HASH_KEY);
  return { success: true, count: verifiedCount };
}
