"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, CheckCircle, Plus, Minus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { subscribeToProductChanges } from '../utils/productSync';

export function QuickViewModal({
  quickViewProduct,
  setQuickViewProduct,
  quickViewActiveImg,
  setQuickViewActiveImg,
  quickViewSize,
  setQuickViewSize,
  quickViewColor,
  setQuickViewColor,
  formatPrice,
  handleAddToCart
}) {
  const [quantity, setQuantity] = useState(1);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const galleryScrollRef = useRef(null);

  const gallery = quickViewProduct?.gallery && quickViewProduct.gallery.filter(Boolean).length > 0 
    ? quickViewProduct.gallery.filter(Boolean) 
    : (quickViewProduct?.image ? [quickViewProduct.image] : []);

  useEffect(() => {
    setQuantity(1);
    setActiveSlideIdx(0);
    if (galleryScrollRef.current) {
      galleryScrollRef.current.scrollLeft = 0;
    }
    if (quickViewProduct) {
      const available = quickViewProduct.available_sizes || quickViewProduct.sizes || ['M', 'L', 'XL'];
      if (!available.includes(quickViewSize)) {
        setQuickViewSize(available[0] || 'M');
      }
      if (setQuickViewColor && quickViewProduct.colors && quickViewProduct.colors.length > 0) {
        const firstColor = quickViewProduct.colors[0]?.name || quickViewProduct.colors[0];
        if (firstColor && (!quickViewColor || !quickViewProduct.colors.some(c => (c.name || c) === quickViewColor))) {
          setQuickViewColor(firstColor);
        }
      }
    }
  }, [quickViewProduct]);

  // Subscribe to real-time product updates (out of stock broadcast from other tabs)
  useEffect(() => {
    if (!quickViewProduct?.id) return;
    const unsubscribe = subscribeToProductChanges((event) => {
      if (event?.productId === quickViewProduct.id) {
        if (event?.type === 'out_of_stock_alert') {
          setQuickViewProduct((prev) => (prev ? { ...prev, stock: 0 } : null));
        } else if (event?.extra?.newStock !== undefined) {
          setQuickViewProduct((prev) => (prev ? { ...prev, stock: event.extra.newStock } : null));
        }
      }
    });
    return () => unsubscribe();
  }, [quickViewProduct?.id]);

  // Lock body scroll when modal is open so 100% of gestures scroll the modal
  useEffect(() => {
    if (quickViewProduct) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [quickViewProduct]);

  // Slideable gallery swipe on mobile
  const handleGalleryScroll = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    const width = el.offsetWidth || 1;
    const idx = Math.round(el.scrollLeft / width);
    if (idx !== activeSlideIdx && idx >= 0 && idx < gallery.length) {
      setActiveSlideIdx(idx);
      if (setQuickViewActiveImg && gallery[idx]) {
        setQuickViewActiveImg(gallery[idx]);
      }
    }
  };

  const scrollToSlide = (idx) => {
    if (galleryScrollRef.current) {
      const width = galleryScrollRef.current.offsetWidth;
      galleryScrollRef.current.scrollTo({
        left: idx * width,
        behavior: 'smooth'
      });
      setActiveSlideIdx(idx);
      if (setQuickViewActiveImg && gallery[idx]) {
        setQuickViewActiveImg(gallery[idx]);
      }
    }
  };

  if (!quickViewProduct) return null;

  const totalPrice = (quickViewProduct.price || 0) * quantity;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto overscroll-y-contain flex flex-col justify-start sm:justify-center items-center p-3 sm:p-6 py-6 sm:py-10" 
        onClick={() => setQuickViewProduct(null)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-[24px] border border-black/[0.04] shadow-2xl flex flex-col md:flex-row my-auto shrink-0 touch-pan-y"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            className="absolute top-3.5 right-3.5 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 text-gray-600 hover:text-[#111111] shadow-md border border-black/[0.06] transition-all cursor-pointer active:scale-95" 
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top/Left Column: Slideable Image Gallery with hand-swipe support, dots only, no prev/next button, no scrollbar */}
          <div className="w-full md:w-1/2 relative bg-[#EDEDEF] p-5 sm:p-7 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/[0.04] flex-shrink-0">
            
            {/* Main Image Box: 20px radius, horizontal snap */}
            <div className="relative w-full max-w-xs aspect-[4/5] rounded-[20px] overflow-hidden bg-white shadow-soft flex items-center justify-center p-2">
              
              {/* Touch-swipeable Gallery */}
              <div
                ref={galleryScrollRef}
                onScroll={handleGalleryScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none overscroll-x-contain touch-pan-x"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center snap-always relative overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={imgUrl}
                      referrerPolicy="no-referrer"
                      alt={`${quickViewProduct.title} - angle ${idx + 1}`}
                      className="w-full h-full object-cover rounded-[18px] pointer-events-none select-none"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Tag pill */}
              {quickViewProduct.tag && (
                <span className="absolute top-3 left-3 bg-[#111111] text-white px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-xs pointer-events-none z-20">
                  {quickViewProduct.tag}
                </span>
              )}
            </div>

            {/* Carousel Dots Below Image ONLY (No prev/next buttons, no scrollbar) */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-1.5 mt-4 z-10">
                {gallery.map((_, idx) => {
                  const isActive = activeSlideIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Image slide ${idx + 1}`}
                      className={`transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'w-6 h-2 bg-[#7C3AED] rounded-full'
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full'
                      }`}
                      onClick={() => scrollToSlide(idx)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column: Garment Specs, Size Chips, Stepper & Add to Bag */}
          <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col justify-between">
            <div>
              
              {/* Category Label & View Full Page Link */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-gray-400 font-medium">
                  {quickViewProduct.category || 'Essential'} Tier
                </span>
                <Link
                  href={`/product/${quickViewProduct.id}`}
                  onClick={() => setQuickViewProduct(null)}
                  className="font-sans text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-0.5"
                >
                  <span>Full page</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Bold Product Title */}
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#111111] leading-tight mb-2">
                {quickViewProduct.title}
              </h2>

              {/* Brand Row: "Klasik Wardrobe" with verified tick */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-sans text-xs sm:text-sm font-semibold text-[#111111]">
                  Klasik Wardrobe
                </span>
                <CheckCircle className="w-4 h-4 fill-[#7C3AED] text-white" />
                <span className="bg-[#111111] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full select-none">
                  Heavyweight
                </span>
              </div>

              {/* Price & Stock Row */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="text-xl sm:text-2xl font-bold text-[#111111]">
                  {formatPrice(quickViewProduct.price)}
                </div>

                {/* Stock Remaining Badge */}
                {quickViewProduct.stock === 1 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Only 1 remaining — order soon</span>
                  </span>
                ) : quickViewProduct.stock !== undefined && quickViewProduct.stock > 1 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{quickViewProduct.stock} available in stock</span>
                  </span>
                ) : quickViewProduct.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 border border-black/[0.04] px-3 py-1 rounded-full">
                    <span>Sold Out</span>
                  </span>
                ) : null}
              </div>

              {/* Description */}
              <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed mb-5">
                {quickViewProduct.description}
              </p>

              {/* Available Colors Swatches */}
              {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-sans text-xs font-bold text-[#111111]">
                      Available Color: <span className="text-[#7C3AED]">{quickViewColor || quickViewProduct.colors[0]?.name || 'Standard'}</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-sans">
                      Verified Dye
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {quickViewProduct.colors.map((colorObj, idx) => {
                      const cName = typeof colorObj === 'string' ? colorObj : (colorObj.name || `Color ${idx + 1}`);
                      const cHex = typeof colorObj === 'string' ? '#111111' : (colorObj.hex || '#111111');
                      const cImg = typeof colorObj === 'object' ? colorObj.image : null;
                      const activeColor = quickViewColor || quickViewProduct.colors[0]?.name || quickViewProduct.colors[0];
                      const isSelected = activeColor === cName;

                      return (
                        <button
                          key={cName + idx}
                          type="button"
                          onClick={() => {
                            if (setQuickViewColor) setQuickViewColor(cName);
                            if (cImg) {
                              const imgIdx = gallery.findIndex((g) => g === cImg);
                              if (imgIdx !== -1) {
                                scrollToSlide(imgIdx);
                              } else if (setQuickViewActiveImg) {
                                setQuickViewActiveImg(cImg);
                              }
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-sans text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] font-bold shadow-xs ring-1 ring-[#7C3AED]'
                              : 'border-black/[0.08] bg-[#EDEDEF]/60 text-gray-700 hover:border-gray-300 hover:bg-[#EDEDEF]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: cHex }}
                          />
                          <span>{cName}</span>
                          {cImg && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" title="Includes photo angle" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Chips: 12px rounded squares */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-sans text-xs font-bold text-[#111111]">
                    Size: <span className="text-[#7C3AED]">{quickViewSize}</span>
                  </label>
                  <span className="text-[11px] text-gray-400 font-sans">
                    True to Oversized Drape
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                    const availableSizes = quickViewProduct.available_sizes || quickViewProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                    const isAvailable = availableSizes.includes(s);
                    const isSelected = quickViewSize === s && isAvailable;

                    if (!isAvailable) {
                      return (
                        <span
                          key={s}
                          title={`${s} (Unavailable)`}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] flex items-center justify-center font-sans text-xs font-semibold bg-gray-100 text-gray-300 border border-black/[0.04] line-through cursor-not-allowed select-none opacity-40 pointer-events-none"
                        >
                          {s}
                        </span>
                      );
                    }

                    return (
                      <button
                        key={s}
                        type="button"
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] flex items-center justify-center font-sans text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#7C3AED] text-white shadow-xs' 
                            : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setQuickViewSize(s)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper in a Rounded Container */}
              <div className="mb-6 flex items-center gap-4">
                <span className="font-sans text-xs font-bold text-[#111111]">Quantity:</span>
                <div className="flex items-center bg-[#EDEDEF] rounded-full px-3 py-1.5 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#111111] cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-sans text-xs font-bold min-w-[16px] text-center text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#111111] cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Add to Cart Button (In-flow, scrolls naturally with the card) */}
            <div className="pt-2">
              <button
                type="button"
                disabled={quickViewProduct.stock <= 0}
                className={`w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-sm font-bold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer ${
                  quickViewProduct.stock <= 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
                onClick={() => {
                  if (quickViewProduct.stock <= 0) return;
                  for (let i = 0; i < quantity; i++) {
                    handleAddToCart(quickViewProduct, quickViewSize, quickViewColor);
                  }
                  setQuickViewProduct(null);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {quickViewProduct.stock <= 0 
                    ? 'Sold Out' 
                    : `Add to Cart • ${formatPrice(totalPrice)}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="w-full mt-2.5 py-2 text-center font-sans text-xs font-semibold text-gray-500 hover:text-[#111111] transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
