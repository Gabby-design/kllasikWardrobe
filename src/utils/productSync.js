// src/utils/productSync.js
// Universal Live Synchronization Engine for Klasik Wardrobe
// Ensures instant cross-device synchronization between Admin, Phone, and all client devices.

const STORAGE_KEY = 'klasik_custom_products';
const REMOVED_KEY = 'klasik_removed_products';
const VERSION_KEY = 'klasik_catalog_version';
const CHANNEL_NAME = 'klasik_products_channel';
const DB_NAME = 'klasik_store_db';
const DB_STORE = 'products';

// Open IndexedDB safely
function openDB() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Client-side image compression
export function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file || !file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function getStoredRemovedProductIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REMOVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markProductRemoved(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const current = getStoredRemovedProductIds();
    if (!current.includes(productId)) {
      const updated = [...current, productId];
      localStorage.setItem(REMOVED_KEY, JSON.stringify(updated));
    }
  } catch {}
}

export function unmarkProductRemoved(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const current = getStoredRemovedProductIds();
    const updated = current.filter((id) => id !== productId);
    localStorage.setItem(REMOVED_KEY, JSON.stringify(updated));
  } catch {}
}

export function getStoredCustomProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((p) => {
      const isDeadImage = (img) => !img || typeof img !== 'string' || img.startsWith('blob:') || img.startsWith('/images/product_');
      if (isDeadImage(p.image)) {
        const safeGalleryImg = Array.isArray(p.gallery) ? p.gallery.find((g) => !isDeadImage(g)) : null;
        p.image = safeGalleryImg || (p.fallbackImage && !isDeadImage(p.fallbackImage) ? p.fallbackImage : '/images/media__1786370258071_2.jpg');
      }
      if (Array.isArray(p.gallery)) {
        p.gallery = p.gallery.filter((g) => !isDeadImage(g));
        if (p.gallery.length === 0 && p.image) {
          p.gallery = [p.image];
        }
      }
      return p;
    });
  } catch (e) {
    return [];
  }
}

export function getSingleStoredProduct(productId) {
  if (!productId) return null;
  const list = getStoredCustomProducts();
  return list.find((p) => p.id === productId) || null;
}

// Obliterates any stale local cache and synchronizes directly with fresh server catalog
export function reconcileWithServerProducts(serverProducts = []) {
  if (typeof window === 'undefined' || !Array.isArray(serverProducts) || serverProducts.length === 0) {
    return;
  }
  try {
    // 1. Save server truth to localStorage so offline fallback remains fresh
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverProducts));
    localStorage.setItem(VERSION_KEY, String(Date.now()));

    // 2. Also update IndexedDB
    openDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        serverProducts.forEach((p) => store.put(p));
      } catch {}
    }).catch(() => {});
  } catch (e) {
    console.warn('Reconcile cache notice:', e);
  }
}

// Clear obsolete client cache if requested
export function clearObsoleteClientCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMOVED_KEY);
    localStorage.removeItem(VERSION_KEY);
  } catch {}
}

export function saveStoredCustomProduct(product) {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    unmarkProductRemoved(product.id);
    const current = getStoredCustomProducts();
    const updated = [product, ...current.filter((p) => p.id !== product.id)];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('LocalStorage quota warning:', quotaErr);
    }

    openDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put(product);
      } catch {}
    }).catch(() => {});

    broadcastProductChange(product, 'save');
  } catch (e) {
    console.warn('Could not save product to local storage:', e);
  }
}

export function removeStoredCustomProduct(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    markProductRemoved(productId);
    const current = getStoredCustomProducts();
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    openDB().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.delete(productId);
      } catch {}
    }).catch(() => {});

    broadcastProductChange({ id: productId }, 'delete');
  } catch (e) {}
}

// Server-authoritative merge: Server data is ALWAYS authoritative.
// Local cache is only used as an initial instant-render placeholder before server returns.
export function mergeWithStoredProducts(baseProducts = []) {
  if (typeof window === 'undefined') return baseProducts;

  // If server provided products, the server IS the source of truth!
  if (Array.isArray(baseProducts) && baseProducts.length > 0) {
    // Reconcile and clean up stale local storage
    reconcileWithServerProducts(baseProducts);
    return baseProducts;
  }

  // If no server products yet, fall back to locally stored cache
  const stored = getStoredCustomProducts();
  const removedIds = new Set(getStoredRemovedProductIds());
  return stored.filter((p) => !removedIds.has(p.id));
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

  // Cross-tab BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch (e) {}

  // Same-tab CustomEvent
  try {
    window.dispatchEvent(
      new CustomEvent('klasik_products_updated', {
        detail: payload,
      })
    );
  } catch (e) {}
}

export function broadcastStockAlert(product, previousStock = 1, message = '') {
  broadcastProductChange(product, 'out_of_stock_alert', {
    previousStock,
    wasLastUnit: previousStock === 1,
    message: message || `"${product.title || product.name}" is now Out of Stock.`,
  });
}

// Quick inline stock updater & live server persistence
export async function updateStoredProductStock(productId, newStock, fallbackProduct = null) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const finalStock = Math.max(0, Number(newStock ?? 0));
    const stored = getSingleStoredProduct(productId);
    const target = stored || fallbackProduct || { id: productId };
    const currentStock = target.stock !== undefined ? Number(target.stock) : 10;

    const updatedProduct = {
      ...target,
      stock: finalStock,
      updatedAt: new Date().toISOString(),
    };

    saveStoredCustomProduct(updatedProduct);

    // Call server API immediately with no-store
    try {
      const stockPayload = JSON.stringify({
        productId,
        newStock: finalStock,
        action: 'set',
      });

      await fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: stockPayload,
      });

      // If running on localhost, also push stock to Live Host in background
      if (typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      )) {
        fetch('https://kllasik-wardrobe.vercel.app/api/products/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: stockPayload,
        }).catch(() => {});
      }
    } catch {}

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

export async function decrementStoredProductStock(productId, quantity = 1, fallbackProduct = null) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const stored = getSingleStoredProduct(productId);
    const target = stored || fallbackProduct;
    if (!target) return null;

    const currentStock = target.stock !== undefined ? Number(target.stock) : 10;
    const newStock = Math.max(0, currentStock - Number(quantity || 1));
    const wasLastUnit = currentStock === 1 && newStock === 0;

    const updatedProduct = {
      ...target,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    saveStoredCustomProduct(updatedProduct);

    try {
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
    } catch {}

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

// Push local edits from this browser to the backend server (and live host if running on localhost)
export async function syncClientEditsToServer(products) {
  if (typeof window === 'undefined') return { success: false, error: 'SSR' };
  try {
    const toSend = Array.isArray(products) && products.length > 0 
      ? products 
      : getStoredCustomProducts();

    if (!toSend || toSend.length === 0) {
      return { success: false, error: 'No custom products in local storage to sync' };
    }

    const removedIds = getStoredRemovedProductIds();
    const payload = JSON.stringify({
      products: toSend,
      removedIds,
    });

    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.')
    );

    // 1. Primary sync to current host API
    const res = await fetch('/api/admin/sync-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: payload,
    });

    // 2. If running locally, automatically sync to live production host in parallel
    if (isLocalhost) {
      fetch('https://kllasik-wardrobe.vercel.app/api/admin/sync-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: payload,
      }).catch(() => {});
    }

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return { success: false, error: `Server error: ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// UNIVERSAL LIVE SYNC: Continuously keeps any client (phone, tablet, laptop)
// 100% in sync with the backend server via lightweight polling (every 3.5s)
// plus immediate sync on tab focus or visibility change.
export function startLiveCatalogSync(onUpdate, intervalMs = 3500) {
  if (typeof window === 'undefined' || typeof onUpdate !== 'function') {
    return () => {};
  }

  let isPolling = false;
  let lastKnownHash = '';

  const computeQuickHash = (items = []) => {
    return items.map((p) => `${p.id}:${p.title}:${p.stock}:${p.price}`).join('|');
  };

  const executeSync = async () => {
    if (isPolling) return;
    if (document.hidden) return; // Save mobile battery when screen is locked or tab backgrounded

    isPolling = true;
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          const currentHash = computeQuickHash(data.products);
          if (currentHash !== lastKnownHash) {
            lastKnownHash = currentHash;
            // Server truth supersedes local cache
            reconcileWithServerProducts(data.products);
            onUpdate(data.products);
          }
        }
      }
    } catch (err) {
      // Network hiccup - ignore silently
    } finally {
      isPolling = false;
    }
  };

  // 1. Initial sync immediately
  executeSync();

  // 2. Poll every intervalMs
  const timer = setInterval(executeSync, intervalMs);

  // 3. Immediate sync on visibility change (e.g. mobile owner unlocks phone or opens tab)
  const handleVisibility = () => {
    if (!document.hidden) {
      executeSync();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // 4. Immediate sync on window focus
  window.addEventListener('focus', executeSync);

  // 5. Cross-tab channel listener
  let channel = null;
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'products_updated') {
          executeSync();
        }
      };
    }
  } catch (e) {}

  // 6. Return comprehensive cleanup function
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', executeSync);
    if (channel) {
      try {
        channel.close();
      } catch (e) {}
    }
  };
}

// Backward compatible alias
export function subscribeToProductChanges(onUpdate) {
  return startLiveCatalogSync((products) => {
    onUpdate({ type: 'products_updated', products });
  });
}
