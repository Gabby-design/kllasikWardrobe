"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function ProductGrid({
  filteredProducts,
  selectedCategory,
  setSelectedCategory,
  setSelectedPrice,
  setSearchQuery,
  getCardImage,
  formatPrice,
  handleSelectCardImage,
  setQuickViewProduct,
  setQuickViewActiveImg,
  setQuickViewSize,
  setQuickViewColor,
  getSelectedSize,
  handleSelectCardSize,
  getSelectedColor,
  handleSelectCardColor,
  handleAddToCart,
  handleBuyNow,
  showCategoryFilter = true
}) {
  const [wishlist, setWishlist] = useState({});

  const toggleWishlist = (productId, e) => {
    e.stopPropagation();
    setWishlist(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const categoryCards = [
    { 
      label: "Essential", 
      value: "Essential", 
      desc: "240 GSM • ₦30k", 
      image: "/images/media__1786369656046.jpg" 
    },
    { 
      label: "Signature", 
      value: "Signature", 
      desc: "260 GSM • ₦35k", 
      image: "/images/media__1786370258071_2.jpg" 
    },
    { 
      label: "Executive", 
      value: "Executive", 
      desc: "300 GSM • ₦40k", 
      image: "/images/media__1786370258071.jpg" 
    },
    { 
      label: "New Arrival", 
      value: "ALL", 
      desc: "Latest Archive", 
      image: "/images/media__1786369661997.jpg" 
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      
      {/* 1. Categories Row with "See all" link in purple */}
      {showCategoryFilter && (
        <section className="pt-2 pb-8 sm:pb-10" id="categories-section">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="font-sans text-lg sm:text-xl font-bold text-[#111111] tracking-tight">
              Categories
            </h2>
            <Link 
              href="/catalog" 
              className="font-sans text-xs sm:text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors flex items-center gap-1"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 to 4 Rounded Category Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categoryCards.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setSelectedCategory && setSelectedCategory(cat.value)}
                  className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[24px] bg-white border transition-all duration-300 cursor-pointer text-left shadow-[0_8px_24px_rgba(17,17,17,0.06)] hover:-translate-y-0.5 ${
                    isActive
                      ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 bg-[#EDE9FE]/20'
                      : 'border-black/[0.04] hover:border-[#EDE9FE]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block font-sans text-xs sm:text-sm font-bold text-[#111111] truncate">
                      {cat.label}
                    </span>
                    <span className="block font-sans text-[10px] sm:text-[11px] text-gray-500 truncate mt-0.5">
                      {cat.desc}
                    </span>
                  </div>

                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] overflow-hidden bg-[#EDEDEF] flex-shrink-0">
                    <img 
                      src={cat.image} 
                      alt={cat.label}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. "New Arrival" Section with "See all" link */}
      <section id="catalog" className="scroll-mt-24 pt-2">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-baseline gap-2">
            <h2 className="font-sans text-lg sm:text-xl font-bold text-[#111111] tracking-tight">
              New Arrival
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              ({filteredProducts.length} pieces)
            </span>
          </div>

          <Link 
            href="/catalog" 
            className="font-sans text-xs sm:text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors flex items-center gap-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white rounded-[24px] border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] my-6">
            <div className="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-sans text-lg font-bold text-[#111111] mb-2">No matching pieces found</h3>
            <p className="font-sans text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
              We couldn&apos;t find any pieces matching your current filters. Try resetting to view all heavyweight t-shirts.
            </p>
            <button
              type="button"
              className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-full text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              onClick={() => {
                if (setSelectedPrice) setSelectedPrice('ALL');
                if (setSelectedCategory) setSelectedCategory('ALL');
                if (setSearchQuery) setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Product Grid: 2-column phone (<640px), 3-column tablet (640-1024px), 4-column desktop (>1024px) */
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const currentImage = getCardImage ? getCardImage(product) : product.image;
              const currentSize = getSelectedSize ? getSelectedSize(product.id) : (product.sizes?.[1] || 'L');
              const currentColor = getSelectedColor ? getSelectedColor(product) : product.colors?.[0]?.name;
              const isFavorited = Boolean(wishlist[product.id]);
              const tagText = product.tag || (product.category === 'Executive' ? 'Exclusive' : 'New Arrival');

              const handleOpenDetails = () => {
                if (setQuickViewProduct) {
                  setQuickViewProduct(product);
                  if (setQuickViewActiveImg) setQuickViewActiveImg(currentImage || product.image);
                  if (setQuickViewSize) setQuickViewSize(currentSize);
                  if (setQuickViewColor) setQuickViewColor(currentColor || product.colors?.[0]?.name || '');
                }
              };

              return (
                <div
                  key={product.id}
                  onClick={handleOpenDetails}
                  className="bg-white rounded-[24px] p-3 sm:p-3.5 shadow-[0_8px_24px_rgba(17,17,17,0.06)] hover:shadow-[0_12px_32px_rgba(17,17,17,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group touch-pan-y"
                >
                  
                  {/* Top: Image sits in a grey (#EDEDEF) rounded box with 20px radius, aspect ratio ~4:5 */}
                  <div>
                    <div className="relative w-full aspect-[4/5] rounded-[20px] bg-[#EDEDEF] overflow-hidden flex items-center justify-center">
                      
                      {/* Top-Left: Small tag pill (New Arrival / Trending / Exclusive) */}
                      <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[#111111] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs z-10 select-none">
                        {tagText}
                      </span>

                      {/* Top-Right: Circular white heart (wishlist) button with soft shadow */}
                      <button
                        type="button"
                        aria-label="Save to Wishlist"
                        onClick={(e) => toggleWishlist(product.id, e)}
                        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-400 hover:text-[#7C3AED] active:scale-90 transition-all z-20 cursor-pointer"
                      >
                        <Heart 
                          className={`w-4 h-4 transition-colors ${
                            isFavorited ? 'fill-[#7C3AED] text-[#7C3AED]' : 'text-gray-400'
                          }`} 
                        />
                      </button>

                      {/* Out of Stock Overlay */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <span className="bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                            Sold Out
                          </span>
                        </div>
                      )}

                      {/* Product Image: 4:5 aspect ratio, object-fit cover, subtle hover zoom */}
                      <img
                        src={currentImage}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                      />
                    </div>

                    {/* Below the image in this exact order: */}
                    <div className="mt-3 flex flex-col">
                      
                      {/* 1. Small grey category label */}
                      <span className="font-sans text-[11px] text-gray-400 font-medium leading-none truncate">
                        {product.category || 'Essential'} Collection
                      </span>

                      {/* 2. Product name in bold (max 2 lines) */}
                      <h3 className="font-sans text-xs sm:text-sm font-bold text-[#111111] leading-snug mt-1.5 line-clamp-2 group-hover:text-[#7C3AED] transition-colors">
                        {product.title}
                      </h3>

                      {/* 3. One-line GSM/fabric chip or text */}
                      <span className="font-sans text-[11px] text-gray-500 font-medium mt-1 truncate">
                        {product.gsm ? product.gsm.replace(' Heavyweight', '') : '240 GSM'} • {product.material ? product.material.replace('100% Combed ', '') : 'Organic Cotton'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Area: Size Chips, Colors, Price and Round Purple + Button */}
                  <div className="mt-3 pt-2.5 border-t border-black/[0.04]">
                    
                    {/* Size Chips & Colour Swatches Row */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      
                      {/* Size Chips (M, L, XL, XXL) as 12px rounded squares */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {(product.sizes || ['M', 'L', 'XL', 'XXL']).slice(0, 4).map((size) => {
                          const isSelected = currentSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (handleSelectCardSize) handleSelectCardSize(product.id, size);
                              }}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[12px] flex items-center justify-center font-sans text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#7C3AED] text-white shadow-xs'
                                  : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>

                      {/* Colour Swatches with purple ring when selected */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {product.colors.map((color) => {
                            const isSelected = currentColor === color.name;
                            return (
                              <button
                                key={color.name}
                                type="button"
                                title={color.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (handleSelectCardColor) handleSelectCardColor(product.id, color.name);
                                }}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-200 transition-all cursor-pointer ${
                                  isSelected ? 'ring-2 ring-[#7C3AED] ring-offset-1' : 'opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: color.hex || '#111111' }}
                              />
                            );
                          })}
                        </div>
                      )}

                    </div>

                    {/* Row with Price in bold on the left and Small Round Purple "+" Add-to-Bag Button on the right */}
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm sm:text-base font-bold text-[#111111]">
                        {formatPrice(product.price)}
                      </span>

                      <button
                        type="button"
                        aria-label="Add to Bag"
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.stock <= 0) return;
                          handleAddToCart(product, currentSize, currentColor);
                        }}
                        className="w-8 h-8 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
