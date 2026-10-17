"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import { Heart, X, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export function WishlistDrawer() {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, wishlistItemCount } = useWishlistStore();
  const { addToCart, setIsCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isWishlistOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isWishlistOpen]);

  const count = mounted ? wishlistItemCount() : 0;
  const items = mounted ? wishlist : [];

  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString('en-US')}`;

  const handleMoveToBag = (item) => {
    const defaultSize = Array.isArray(item.sizes) && item.sizes.length > 0 
      ? (item.sizes.includes('L') ? 'L' : item.sizes[0]) 
      : 'L';
    const defaultColor = item.colors?.[0]?.name || (typeof item.colors?.[0] === 'string' ? item.colors[0] : null) || 'Standard';

    addToCart(item, defaultSize, defaultColor);
    toast.success(`Moved "${item.title}" to your shopping bag!`);
  };

  const handleMoveAllToBag = () => {
    if (!items || items.length === 0) return;
    items.forEach((item) => {
      const defaultSize = Array.isArray(item.sizes) && item.sizes.length > 0 
        ? (item.sizes.includes('L') ? 'L' : item.sizes[0]) 
        : 'L';
      const defaultColor = item.colors?.[0]?.name || (typeof item.colors?.[0] === 'string' ? item.colors[0] : null) || 'Standard';
      addToCart(item, defaultSize, defaultColor);
    });
    toast.success(`Added all ${items.length} saved pieces to your bag!`);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleItemClick = (productId) => {
    setIsWishlistOpen(false);
    router.push(`/product/${productId}`);
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setIsWishlistOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-[#F7F7F8] border-l border-black/[0.04] h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-black/[0.04] bg-white z-10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-[#7C3AED] text-[#7C3AED]" />
                <h3 className="font-sans text-sm font-bold text-[#111111]">
                  Saved Pieces ({count})
                </h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#111111] hover:bg-[#EDEDEF] transition-colors cursor-pointer"
                onClick={() => setIsWishlistOpen(false)}
                aria-label="Close wishlist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-banner: Personal Luxury Wardrobe */}
            <div className="px-6 py-2.5 bg-[#EDE9FE]/50 border-b border-purple-100 flex items-center justify-between text-[11px] font-semibold text-[#7C3AED]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Your Curated Favorites</span>
              </span>
              <span>Available to Order</span>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col divide-y divide-black/[0.04] custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-[#EDE9FE] flex items-center justify-center mb-4">
                    <Heart className="w-7 h-7 text-[#7C3AED]" />
                  </div>
                  <h4 className="font-sans text-lg font-bold text-[#111111] mb-2">Your Wishlist is Empty</h4>
                  <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-xs mb-6">
                    Tap the love icon on any garment across the collection to save your favorite luxury essentials here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWishlistOpen(false);
                      router.push('/');
                    }}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-semibold px-6 py-3 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const isSoldOut = item.stock !== undefined && Number(item.stock) <= 0;
                  return (
                    <div key={item.id} className="py-4 flex gap-4 items-center">
                      {/* Thumbnail */}
                      <button
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        className="w-20 h-24 flex-shrink-0 bg-[#EDEDEF] rounded-[16px] overflow-hidden p-1 relative group text-left cursor-pointer"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-[12px] group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-sans text-xs text-gray-400">
                            KLASIK
                          </div>
                        )}
                        {item.tag && (
                          <span className="absolute top-2 left-2 bg-[#111111] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none">
                            {item.tag}
                          </span>
                        )}
                      </button>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <button
                              type="button"
                              onClick={() => handleItemClick(item.id)}
                              className="font-sans text-xs sm:text-sm font-bold text-[#111111] hover:text-[#7C3AED] transition-colors truncate block text-left cursor-pointer"
                            >
                              {item.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeFromWishlist(item.id);
                                toast.success(`Removed "${item.title}" from favorites`);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer flex-shrink-0"
                              title="Remove from favorites"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-sans text-[11px] text-gray-400 block mt-0.5">
                            {item.category || 'Essential'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="font-sans text-xs sm:text-sm font-bold text-[#111111]">
                            {formatPrice(item.price)}
                          </span>

                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => handleMoveToBag(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{isSoldOut ? 'Sold Out' : 'Add to Bag'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Move All to Bag Action */}
            {items.length > 0 && (
              <div className="p-5 border-t border-black/[0.04] bg-white flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleMoveAllToBag}
                  className="w-full py-3 rounded-full bg-[#111111] hover:bg-black text-white font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4 text-purple-300" />
                  <span>Move All ({items.length}) to Shopping Bag</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-full py-2.5 rounded-full text-gray-500 hover:text-[#111111] font-sans text-xs font-semibold transition-colors cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
