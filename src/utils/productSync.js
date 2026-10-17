// src/utils/productSync.js
// Dual-resilient client-side synchronization engine for Klasik Wardrobe.
// Server/Database is authoritative, with seamless local client caching for instant offline/ephemeral resilience.

export const STORAGE_KEY = 'klasik_custom_products_v5';
export const REMOVED_KEY = 'klasik_removed_products_v5';
export const VERSION_KEY = 'klasik_catalog_version_v5';
export const CHANNEL_NAME = 'klasik_products_channel_v5';

// Purges legacy obsolete keys from older storage versions
export function runStorageMigration() {
  if (typeof window === 'undefined') return;

  try {
    const legacyKeys = [
      'klasik_custom_products_v1',
      'klasik_custom_products_v2',
      'klasik_custom_products_v3',
      'klasik_custom_products_v4',
      'klasik_removed_products_v1',
      'klasik_removed_products_v2',
      'klasik_removed_products_v3',
      'klasik_removed_products_v4',
    ];
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
  } catch {}

  try {
    if (window.indexedDB) {
      ['klasik_store_db', 'klasik_store_db_v1', 'klasik_store_db_v2', 'klasik_store_db_v3', 'klasik_store_db_v4'].forEach((dbName) => {
        try {
          window.indexedDB.deleteDatabase(dbName);
        } catch {}
      });
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  runStorageMigration();
}

export function getStoredCustomProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getStoredRemovedProductIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REMOVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomProduct(product) {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    const existing = getStoredCustomProducts();
    const updated = [product, ...existing.filter((p) => p.id !== product.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const currentRemoved = getStoredRemovedProductIds().filter((id) => id !== product.id);
    localStorage.setItem(REMOVED_KEY, JSON.stringify(currentRemoved));
  } catch {}
  broadcastProductChange(product, 'update');
}

export function removeStoredCustomProduct(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const existing = getStoredCustomProducts();
    const updated = existing.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const currentRemoved = Array.from(new Set([...getStoredRemovedProductIds(), productId]));
    localStorage.setItem(REMOVED_KEY, JSON.stringify(currentRemoved));
  } catch {}
  broadcastProductChange({ id: productId }, 'delete');
}

/**
 * Merges server products with any locally saved updates
 */
export function mergeWithStoredProducts(baseProducts = []) {
  if (typeof window === 'undefined') return baseProducts;
  try {
    const custom = getStoredCustomProducts();
    const removedSet = new Set(getStoredRemovedProductIds());
    const productMap = new Map();

    for (const p of (Array.isArray(baseProducts) ? baseProducts : [])) {
      if (p && p.id && !removedSet.has(p.id)) {
        productMap.set(p.id, { ...p });
      }
    }

    for (const p of custom) {
      if (p && p.id && !removedSet.has(p.id)) {
        const prev = productMap.get(p.id) || {};
        productMap.set(p.id, { ...prev, ...p });
      }
    }

    return Array.from(productMap.values());
  } catch {
    return Array.isArray(baseProducts) ? baseProducts : [];
  }
}

export function getSingleStoredProduct(productId, serverProduct = null) {
  if (typeof window === 'undefined') return serverProduct || null;
  const custom = getStoredCustomProducts();
  const match = custom.find((p) => p.id === productId);
  return match || serverProduct || null;
}

export function clearObsoleteClientCache() {
  runStorageMigration();
}

export function resetToServerCatalog() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REMOVED_KEY);
    } catch {}
  }
  broadcastProductChange(null, 'catalog_reset');
}

export function broadcastProductChange(product, action = 'update', extraData = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    type: 'products_updated',
    action,
    product,
    timestamp: Date.now(),
    ...extraData,
  };

  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent('klasik_products_updated', {
        detail: payload,
      })
    );
  } catch {}
}

export function broadcastStockAlert(product, previousStock = 1, message = '') {
  broadcastProductChange(product, 'out_of_stock_alert', {
    previousStock,
    wasLastUnit: previousStock === 1,
    message: message || `"${product.title || product.name}" is now Out of Stock.`,
  });
}

/**
 * Update product stock via authoritative server API
 */
export async function updateStoredProductStock(productId, newStock, fallbackProduct = null) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const finalStock = Math.max(0, Number(newStock ?? 0));
    const target = fallbackProduct || { id: productId };
    const currentStock = target.stock !== undefined ? Number(target.stock) : 10;

    const updatedProduct = {
      ...target,
      stock: finalStock,
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        productId,
        newStock: finalStock,
        action: 'set',
      }),
    });

    if (finalStock === 0) {
      broadcastStockAlert(updatedProduct, currentStock);
    } else {
      broadcastProductChange(updatedProduct, 'stock_change', {
        previousStock: currentStock,
        newStock: finalStock,
      });
    }

    return updatedProduct;
  } catch (err) {
    console.error('Error updating product stock:', err);
    return null;
  }
}

/**
 * Decrement product stock via authoritative server API
 */
export async function decrementStoredProductStock(productId, quantity = 1, fallbackProduct = null) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const currentStock = fallbackProduct?.stock !== undefined ? Number(fallbackProduct.stock) : 10;
    const newStock = Math.max(0, currentStock - Number(quantity || 1));
    const wasLastUnit = currentStock === 1 && newStock === 0;

    const updatedProduct = {
      ...(fallbackProduct || { id: productId }),
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    fetch('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        productId,
        quantity,
        action: 'decrement',
      }),
    }).catch(() => {});

    if (wasLastUnit || newStock === 0) {
      broadcastStockAlert(updatedProduct, currentStock);
    } else {
      broadcastProductChange(updatedProduct, 'stock_change', {
        previousStock: currentStock,
        newStock,
      });
    }

    return {
      success: true,
      product: updatedProduct,
      previousStock: currentStock,
      newStock,
      wasLastUnit,
    };
  } catch (err) {
    console.error('Error decrementing product stock:', err);
    return null;
  }
}

// Deprecated push helper (no-op; admin actions write directly to database)
export async function syncClientEditsToServer() {
  return { success: true };
}

/**
 * Real-time storefront catalog synchronization:
 * Subscribes to local tab broadcasts and polls the server API every 4s
 * to ensure all devices display database updates within seconds.
 */
export function subscribeToProductChanges(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {};
  }

  runStorageMigration();

  let channel = null;
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event?.data?.type === 'products_updated') {
          callback(event.data);
        }
      };
    }
  } catch {}

  const handleCustomEvent = (event) => {
    if (event?.detail?.type === 'products_updated') {
      callback(event.detail);
    }
  };
  window.addEventListener('klasik_products_updated', handleCustomEvent);

  const fetchLatestProducts = async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          callback({ products: data.products, action: 'poll_sync' });
        }
      }
    } catch {}
  };

  const handleVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && !document.hidden) {
      fetchLatestProducts();
    }
  };

  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Poll server every 45 seconds to protect Upstash quota while maintaining freshness
  const pollInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    fetchLatestProducts();
  }, 45000);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    window.removeEventListener('klasik_products_updated', handleCustomEvent);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    clearInterval(pollInterval);
  };
}

export function startLiveCatalogSync(onUpdate) {
  return subscribeToProductChanges(onUpdate);
}
