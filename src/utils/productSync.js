// src/utils/productSync.js
// Client-side synchronization & persistence engine for Klasik Wardrobe products

const STORAGE_KEY = 'klasik_custom_products';
const CHANNEL_NAME = 'klasik_products_channel';

export function getStoredCustomProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredCustomProduct(product) {
  if (typeof window === 'undefined' || !product || !product.id) return;
  try {
    const current = getStoredCustomProducts();
    const updated = [product, ...current.filter((p) => p.id !== product.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastProductChange(product, 'save');
  } catch (e) {
    console.warn('Could not save product to local storage:', e);
  }
}

export function removeStoredCustomProduct(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const current = getStoredCustomProducts();
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastProductChange({ id: productId }, 'delete');
  } catch (e) {}
}

export function mergeWithStoredProducts(baseProducts = []) {
  if (typeof window === 'undefined') return baseProducts;
  const stored = getStoredCustomProducts();
  if (stored.length === 0) return baseProducts;

  const storedMap = new Map(stored.map((p) => [p.id, p]));

  // In-place update of base products
  const mergedBase = baseProducts.map((p) => {
    if (storedMap.has(p.id)) {
      const override = storedMap.get(p.id);
      storedMap.delete(p.id);
      return override;
    }
    return p;
  });

  // Newly added products go to the front
  const brandNew = Array.from(storedMap.values());
  return [...brandNew, ...mergedBase];
}

export function broadcastProductChange(product, action = 'update') {
  if (typeof window === 'undefined') return;

  // 1. BroadcastChannel for cross-tab communication
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({
        type: 'products_updated',
        action,
        product,
        timestamp: Date.now(),
      });
      channel.close();
    }
  } catch (e) {}

  // 2. CustomEvent for same-tab listeners
  try {
    window.dispatchEvent(
      new CustomEvent('klasik_products_updated', {
        detail: { product, action, timestamp: Date.now() },
      })
    );
  } catch (e) {}
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
    if (e.key === STORAGE_KEY) {
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
