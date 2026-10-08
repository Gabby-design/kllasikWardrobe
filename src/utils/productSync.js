// src/utils/productSync.js
// Client-side synchronization & persistence engine for Klasik Wardrobe products

const STORAGE_KEY = 'klasik_custom_products';
const REMOVED_KEY = 'klasik_removed_products';
const CHANNEL_NAME = 'klasik_products_channel';
const DB_NAME = 'klasik_store_db';
const DB_STORE = 'products';

// Open IndexedDB safely for limitless storage
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

// Client-side image compression: prevents quota limits and ensures lightning-fast loading
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
      // Discard dead blob URLs or non-existent ephemeral runtime /images/product_ paths
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

export function saveStoredCustomProduct(product) {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    unmarkProductRemoved(product.id);
    const current = getStoredCustomProducts();
    const updated = [product, ...current.filter((p) => p.id !== product.id)];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('LocalStorage quota warning. Relying on IndexedDB:', quotaErr);
    }

    // Also persist into IndexedDB for limitless capacity
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

    // Remove from IndexedDB
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

export function mergeWithStoredProducts(baseProducts = []) {
  if (typeof window === 'undefined') return baseProducts;
  const removedIds = new Set(getStoredRemovedProductIds());
  const stored = getStoredCustomProducts();

  // 1. Filter out deleted products from base catalog
  const activeBase = baseProducts.filter((p) => !removedIds.has(p.id));

  if (stored.length === 0) return activeBase;

  const storedMap = new Map();
  stored.forEach((p) => {
    if (!removedIds.has(p.id)) {
      storedMap.set(p.id, p);
    }
  });

  // 2. In-place replace of edited products with new images & details
  const mergedBase = activeBase.map((p) => {
    if (storedMap.has(p.id)) {
      const override = storedMap.get(p.id);
      storedMap.delete(p.id);
      return override;
    }
    return p;
  });

  // 3. Brand new custom products added to the top
  const brandNew = Array.from(storedMap.values());
  return [...brandNew, ...mergedBase];
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

  // 1. BroadcastChannel for cross-tab communication
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch (e) {}

  // 2. CustomEvent for same-tab listeners
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
    message: message || `"${product.title || product.name}" (which had only 1 remaining a moment ago) was just claimed and is now Out of Stock.`,
  });
}

export function decrementStoredProductStock(productId, quantity = 1, fallbackProduct = null) {
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

    // Call server API in background to persist
    try {
      fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    console.error('Error decrementing stored product stock:', err);
    return null;
  }
}

export function updateStoredProductStock(productId, newStock, fallbackProduct = null) {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const stored = getSingleStoredProduct(productId);
    const target = stored || fallbackProduct;
    if (!target) return null;

    const currentStock = target.stock !== undefined ? Number(target.stock) : 10;
    const finalStock = Math.max(0, Number(newStock ?? 0));

    const updatedProduct = {
      ...target,
      stock: finalStock,
      updatedAt: new Date().toISOString(),
    };

    saveStoredCustomProduct(updatedProduct);

    try {
      fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          newStock: finalStock,
          action: 'set',
        }),
      }).catch(() => {});
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

export function subscribeToProductChanges(onUpdate) {
  if (typeof window === 'undefined' || typeof onUpdate !== 'function') {
    return () => {};
  }

  // BroadcastChannel listener
  let channel = null;
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'products_updated') {
          onUpdate(event.data);
        }
      };
    }
  } catch (e) {}

  // Cross-tab storage listener
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === REMOVED_KEY) {
      onUpdate({ type: 'products_updated', action: 'storage' });
    }
  };
  window.addEventListener('storage', handleStorage);

  // Same-tab CustomEvent listener
  const handleCustom = (e) => {
    onUpdate(e.detail || { type: 'products_updated', action: 'custom' });
  };
  window.addEventListener('klasik_products_updated', handleCustom);

  // Window focus listener (sync immediately when switching to website tab)
  const handleFocus = () => {
    onUpdate({ type: 'products_updated', action: 'focus' });
  };
  window.addEventListener('focus', handleFocus);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch (e) {}
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('klasik_products_updated', handleCustom);
    window.removeEventListener('focus', handleFocus);
  };
}
