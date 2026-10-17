import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      isWishlistOpen: false,

      setIsWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),

      toggleWishlist: (product) => {
        if (!product || !product.id) return false;
        
        const { wishlist } = get();
        const exists = wishlist.some((item) => item.id === product.id);

        if (exists) {
          set({ wishlist: wishlist.filter((item) => item.id !== product.id) });
          return false; // Removed
        }

        const normalizedItem = {
          id: product.id,
          title: product.title || product.name || 'Essential Garment',
          price: Number(product.price || 0),
          image: product.image || product.image_url || '/images/media__1786369656046.jpg',
          category: product.category || 'Essential',
          stock: product.stock !== undefined ? Number(product.stock) : 10,
          colors: Array.isArray(product.colors) ? product.colors : [],
          sizes: Array.isArray(product.sizes) && product.sizes.length > 0 
            ? product.sizes 
            : ['S', 'M', 'L', 'XL', 'XXL'],
          tag: product.tag || null,
        };

        set({ wishlist: [normalizedItem, ...wishlist] });
        return true; // Added
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        }));
      },

      clearWishlist: () => set({ wishlist: [] }),

      isInWishlist: (productId) => {
        const { wishlist } = get();
        return wishlist.some((item) => item.id === productId);
      },

      wishlistItemCount: () => {
        const { wishlist } = get();
        return Array.isArray(wishlist) ? wishlist.length : 0;
      },
    }),
    {
      name: 'klasik-wishlist-storage',
    }
  )
);
