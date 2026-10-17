// src/utils/productSync.js
// Client-side synchronization engine for Klasik Wardrobe.
// Server/Database is the single authoritative source of truth.
// LocalStorage caching of products is strictly removed to prevent device-specific state.

export const CHANNEL_NAME = 'klasik_products_channel_v5';

/**
 * One-time cleanup: deletes every klasik_* key from localStorage and IndexedDB.
 */
export function runStorageMigration() {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('klasik_')) {
        keysToRemove.push(key);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {}

  try {
    if (window.indexedDB && window.indexedDB.databases) {
      window.indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name && db.name.startsWith('klasik_')) {
            try {
              window.indexedDB.deleteDatabase(db.name);
            } catch {}
          }
        });
      }).catch(() => {});
    } else if (window.indexedDB) {
      const knownDbs = [
        'klasik_store_db',
        'klasik_store_db_v1',
        'klasik_store_db_v2',
        'klasik_store_db_v3',
        'klasik_store_db_v4',
        'klasik_store_db_v5',
      ];
      for (const name of knownDbs) {
        try {
          window.indexedDB.deleteDatabase(name);
        } catch {}
      }
    }
  } catch {}
}

if (typeof window !== 'undefined') {
  runStorageMigration();
}

/**
 * Returns server list unchanged. Local storage overrides are disallowed.
 */
export function mergeWithStoredProducts(baseProducts = []) {
  return Array.isArray(baseProducts) ? baseProducts : [];
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
    message: message || `"${product?.title || product?.name || 'Product'}" is now Out of Stock.`,
  });
}

/**
 * Update product stock via authoritative server API.
 * Uses server response exclusively.
 */
export async function updateStoredProductStock(productId, newStock) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const finalStock = Math.max(0, Number(newStock ?? 0));
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

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.product) {
      throw new Error(data.error || 'Stock update failed');
    }

    const updatedProduct = data.product;
    if (data.newStock === 0) {
      broadcastStockAlert(updatedProduct, data.previousStock);
    } else {
      broadcastProductChange(updatedProduct, 'stock_change', {
        previousStock: data.previousStock,
        newStock: data.newStock,
      });
    }

    return updatedProduct;
  } catch (err) {
    console.error('Error updating product stock:', err);
    return null;
  }
}

/**
 * Decrement product stock via authoritative server API.
 * Uses server response exclusively.
 */
export async function decrementStoredProductStock(productId, quantity = 1) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const res = await fetch('/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        productId,
        quantity: Number(quantity || 1),
        action: 'decrement',
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success || !data.product) {
      throw new Error(data.error || 'Stock decrement failed');
    }

    const updatedProduct = data.product;
    if (data.wasLastUnit || data.newStock === 0) {
      broadcastStockAlert(updatedProduct, data.previousStock);
    } else {
      broadcastProductChange(updatedProduct, 'stock_change', {
        previousStock: data.previousStock,
        newStock: data.newStock,
      });
    }

    return {
      success: true,
      product: updatedProduct,
      previousStock: data.previousStock,
      newStock: data.newStock,
      wasLastUnit: Boolean(data.wasLastUnit),
    };
  } catch (err) {
    console.error('Error decrementing product stock:', err);
    return null;
  }
}

/**
 * Real-time storefront catalog synchronization:
 * Subscribes to local tab broadcasts and polls the server API every 30s
 * to ensure all devices display database updates within seconds.
 * Polling replaces state directly with the server result.
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

  const pollInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    fetchLatestProducts();
  }, 30000);

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
