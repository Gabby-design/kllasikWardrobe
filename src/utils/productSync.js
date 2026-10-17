// src/utils/productSync.js
// Client-side synchronization engine for Klasik Wardrobe.
// Server/Database is the sole authority; local storage is NOT a source of truth.

export const STORAGE_KEY = 'klasik_custom_products_v4';
export const REMOVED_KEY = 'klasik_removed_products_v4';
export const VERSION_KEY = 'klasik_catalog_version_v4';
export const CHANNEL_NAME = 'klasik_products_channel_v4';

// One-time client cleanup: purges all legacy klasik_* keys from localStorage & IndexedDB
export function runStorageMigration() {
  if (typeof window === 'undefined') return;

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('klasik_')) {
        localStorage.removeItem(key);
      }
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

/**
 * Server is single source of truth.
 * Products loaded from server are returned directly.
 */
export function mergeWithStoredProducts(baseProducts = []) {
  if (typeof window === 'undefined') return baseProducts;
  runStorageMigration();
  return Array.isArray(baseProducts) ? baseProducts : [];
}

export function getSingleStoredProduct(productId, serverProduct = null) {
  if (typeof window !== 'undefined') runStorageMigration();
  return serverProduct || null;
}

export function getStoredCustomProducts() {
  return [];
}

export function getStoredRemovedProductIds() {
  return [];
}

export function saveStoredCustomProduct(product) {
  // Local storage does not store product data.
  broadcastProductChange(product, 'update');
}

export function removeStoredCustomProduct(productId) {
  // Local storage does not store product data.
  broadcastProductChange({ id: productId }, 'delete');
}

export function clearObsoleteClientCache() {
  runStorageMigration();
}

export function resetToServerCatalog() {
  runStorageMigration();
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

  // Poll server every 4 seconds to sync remote changes from other devices
  let pollInterval = setInterval(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          callback({ products: data.products, action: 'poll_sync' });
        }
      }
    } catch {}
  }, 4000);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    window.removeEventListener('klasik_products_updated', handleCustomEvent);
    clearInterval(pollInterval);
  };
}

export function startLiveCatalogSync(onUpdate) {
  return subscribeToProductChanges(onUpdate);
}
