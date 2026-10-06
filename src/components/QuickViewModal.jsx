"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, CheckCircle, Plus, Minus } from 'lucide-react';

export function QuickViewModal({
  quickViewProduct,
  setQuickViewProduct,
  quickViewActiveImg,
  setQuickViewActiveImg,
  quickViewSize,
  setQuickViewSize,
  quickViewColor,
  formatPrice,
  handleAddToCart
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const currentImage = quickViewActiveImg || quickViewProduct.image;
  const gallery = quickViewProduct.gallery && quickViewProduct.gallery.filter(Boolean).length > 0 
    ? quickViewProduct.gallery.filter(Boolean) 
    : [quickViewProduct.image];

  const activeIndex = gallery.indexOf(currentImage) >= 0 ? gallery.indexOf(currentImage) : 0;
  const totalPrice = (quickViewProduct.price || 0) * quantity;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6" 
        onClick={() => setQuickViewProduct(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-[24px] border border-black/[0.04] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 text-gray-500 hover:text-[#111111] shadow-sm border border-black/[0.04] transition-all cursor-pointer" 
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: Large Rounded Image with Carousel Dots */}
          <div className="w-full md:w-1/2 relative bg-[#EDEDEF] p-5 sm:p-7 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/[0.04]">
            
            {/* Main Image Box: 20px radius */}
            <div className="relative w-full max-w-xs aspect-[4/5] rounded-[20px] overflow-hidden bg-white shadow-soft flex items-center justify-center p-2">
              <img
                src={currentImage}
                referrerPolicy="no-referrer"
                alt={quickViewProduct.title}
                className="w-full h-full object-cover rounded-[18px]"
              />

              {quickViewProduct.tag && (
                <span className="absolute top-3 left-3 bg-[#111111] text-white px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-xs">
                  {quickViewProduct.tag}
                </span>
              )}
            </div>

            {/* Carousel Dots Below Image */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-1.5 mt-4 z-10">
                {gallery.map((img, idx) => {
                  const isActive = activeIndex === idx;
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
                      onClick={() => setQuickViewActiveImg(img)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Garment Specs, Brand Row, Stepper & Add to Bag */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto pb-24 md:pb-8">
            <div>
              
              {/* Small Grey Category Label */}
              <span className="font-sans text-xs text-gray-400 font-medium block mb-1">
                {quickViewProduct.category || 'Essential'} Collection
              </span>

              {/* Bold Product Title */}
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-[#111111] leading-tight mb-2">
                {quickViewProduct.title}
              </h2>

              {/* Brand Row: "Klasik Wardrobe" with verified tick and a "Following" pill */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-sans text-xs sm:text-sm font-semibold text-[#111111]">
                  Klasik Wardrobe
                </span>
                <CheckCircle className="w-4 h-4 fill-[#7C3AED] text-white" />
                <span className="bg-[#111111] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full select-none">
                  Following
                </span>
              </div>

              {/* Price */}
              <div className="text-xl sm:text-2xl font-bold text-[#111111] mb-3">
                {formatPrice(quickViewProduct.price)}
              </div>

              {/* Description */}
              <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed mb-5">
                {quickViewProduct.description}
              </p>

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
                  {(quickViewProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((s) => {
                    const isSelected = quickViewSize === s;
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

            {/* Desktop Add to Cart Button */}
            <div className="hidden md:block">
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
            </div>

          </div>

          {/* On Phone: Sticky Floating Bottom Bar (white pill, soft shadow) */}
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(17,17,17,0.15)] border border-black/[0.04] p-2 px-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium leading-none">Total price</span>
              <span className="text-sm font-bold text-[#111111] mt-0.5">{formatPrice(totalPrice)}</span>
            </div>

            <button
              type="button"
              disabled={quickViewProduct.stock <= 0}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-full font-sans text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              onClick={() => {
                if (quickViewProduct.stock <= 0) return;
                for (let i = 0; i < quantity; i++) {
                  handleAddToCart(quickViewProduct, quickViewSize, quickViewColor);
                }
                setQuickViewProduct(null);
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
