"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Sparkles, Layers, Feather, ShieldCheck } from 'lucide-react';

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
  if (!quickViewProduct) return null;

  const currentImage = quickViewActiveImg || quickViewProduct.image;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-md p-4 sm:p-6" 
        onClick={() => setQuickViewProduct(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-[#F9F8F6] border border-foreground/15 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md text-foreground font-sans text-lg border border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer shadow-sm" 
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Column: Multi-angle Product Gallery */}
          <div className="w-full md:w-1/2 relative bg-[#F2EFEB] p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-foreground/10 overflow-hidden">
            <div className="relative w-full max-w-sm aspect-[3/4] overflow-hidden bg-white shadow-sm border border-foreground/10">
              <img
                src={currentImage}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.src = quickViewProduct.fallbackImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                }}
                alt={quickViewProduct.title}
                className="w-full h-full object-cover"
              />

              {quickViewProduct.tag && (
                <span className="absolute top-3 left-3 bg-foreground text-background px-2.5 py-1 text-[0.65rem] font-sans uppercase tracking-[0.2em] font-bold">
                  {quickViewProduct.tag}
                </span>
              )}
            </div>

            {/* Gallery Thumbnail Strip */}
            {quickViewProduct.gallery && quickViewProduct.gallery.filter(Boolean).length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {quickViewProduct.gallery.filter(Boolean).map((imgUrl, idx) => {
                  const isCurrent = currentImage === imgUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`w-12 h-16 overflow-hidden border bg-white transition-all cursor-pointer ${
                        isCurrent 
                          ? 'border-foreground shadow-md scale-105' 
                          : 'border-foreground/15 opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setQuickViewActiveImg(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Angle ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = quickViewProduct.fallbackImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Garment Specifications & Size Picker */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-white">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-foreground text-background font-sans text-[0.65rem] uppercase tracking-[0.2em] font-bold px-2.5 py-0.5 inline-block">
                  {quickViewProduct.category} Collection
                </span>
                <span className="text-[0.65rem] font-sans uppercase tracking-[0.15em] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
                  {quickViewProduct.gsm || '240 GSM'}
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                {quickViewProduct.title}
              </h2>

              <div className="font-serif text-xl font-bold text-foreground mb-4">
                {formatPrice(quickViewProduct.price)}
              </div>

              <p className="font-sans text-xs sm:text-sm text-foreground/70 leading-relaxed mb-6">
                {quickViewProduct.description}
              </p>

              {/* Fabric Specs Grid */}
              <div className="grid grid-cols-3 gap-2 bg-foreground/[0.03] border border-foreground/10 p-3.5 mb-6 text-center font-sans text-[0.7rem]">
                <div>
                  <span className="text-foreground/50 uppercase tracking-widest block font-semibold mb-0.5">Weight</span>
                  <strong className="text-foreground">{quickViewProduct.gsm || '240 GSM'}</strong>
                </div>
                <div className="border-x border-foreground/10 px-2">
                  <span className="text-foreground/50 uppercase tracking-widest block font-semibold mb-0.5">Material</span>
                  <strong className="text-foreground truncate block">{quickViewProduct.material || 'Organic Cotton'}</strong>
                </div>
                <div>
                  <span className="text-foreground/50 uppercase tracking-widest block font-semibold mb-0.5">Silhouette</span>
                  <strong className="text-foreground">{quickViewProduct.fit || 'Drop Shoulder'}</strong>
                </div>
              </div>

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-foreground/80">
                    Select Size: <span className="text-foreground font-black">{quickViewSize}</span>
                  </label>
                  <span className="text-[0.65rem] uppercase tracking-wider text-foreground/50 font-sans">
                    True to Oversized Drape
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickViewProduct.sizes.map((s) => {
                    const isSelected = quickViewSize === s;
                    return (
                      <button
                        key={s}
                        className={`w-11 h-11 flex items-center justify-center border font-sans text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-foreground text-background border-foreground shadow-md' 
                            : 'bg-white text-foreground border-foreground/20 hover:border-foreground'
                        }`}
                        onClick={() => setQuickViewSize(s)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              disabled={quickViewProduct.stock <= 0}
              className={`w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold py-4.5 border border-foreground hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                quickViewProduct.stock <= 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
              }`}
              onClick={() => {
                if (quickViewProduct.stock <= 0) return;
                handleAddToCart(quickViewProduct, quickViewSize, quickViewColor);
                setQuickViewProduct(null);
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {quickViewProduct.stock <= 0 
                  ? 'Sold Out' 
                  : `Add Size ${quickViewSize} to Bag &bull; ${formatPrice(quickViewProduct.price)}`}
              </span>
            </button>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
