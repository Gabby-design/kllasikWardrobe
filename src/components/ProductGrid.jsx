"use client";
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Eye, Sparkles } from 'lucide-react';

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
  const categories = [
    { label: 'All Collections', value: 'ALL' },
    { label: 'Essential (₦30k)', value: 'Essential' },
    { label: 'Signature (₦35k)', value: 'Signature' },
    { label: 'Executive (₦40k)', value: 'Executive' },
  ];

  return (
    <>
      {/* Category Filter Bar */}
      {showCategoryFilter && (
        <section id="catalog" className="scroll-mt-[120px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-foreground/10">
            
            <div>
              <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
                Curated Heavyweight Drops
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
                The Collections
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`font-sans text-xs uppercase tracking-[0.15em] px-4 py-2.5 transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-foreground text-background font-bold shadow-md' 
                        : 'bg-white/80 hover:bg-white text-foreground/70 hover:text-foreground border border-foreground/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* Product Grid */}
      <section className="relative bg-background px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 lg:gap-x-10 items-stretch">
          
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 px-6 bg-white border border-foreground/10">
              <div className="text-4xl mb-3">🏷️</div>
              <h3 className="font-serif text-2xl text-foreground font-bold mb-2">No matching pieces found</h3>
              <p className="font-sans text-foreground/60 text-sm max-w-md mx-auto mb-6">
                We couldn&apos;t find any pieces matching your current filters. Try resetting to view all heavyweight t-shirts.
              </p>
              <button
                className="bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold px-6 py-3 hover:bg-neutral-800 transition-colors"
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
            filteredProducts.map((product) => {
              const currentImage = getCardImage(product);
              const currentSize = getSelectedSize(product.id);
              const currentColor = getSelectedColor ? getSelectedColor(product) : product.colors[0]?.name;

              return (
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  key={product.id}
                  className="group flex flex-col bg-white border border-foreground/10 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
                >
                  
                  {/* Image Showcase Container */}
                  <div className="relative w-full aspect-[3/4] bg-[#F2EFEB] overflow-hidden">
                    
                    {/* Out of Stock Overlay */}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-background/70 z-40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-foreground text-background px-4 py-2 font-serif uppercase tracking-[0.2em] font-bold text-xs">
                          Sold Out
                        </span>
                      </div>
                    )}

                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      src={currentImage}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = product.fallbackImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                      }}
                      alt={product.title}
                      className="w-full h-full object-cover origin-center"
                    />

                    {/* Price Badge */}
                    <span className="absolute top-4 right-4 bg-background/95 backdrop-blur-md text-foreground px-3.5 py-1.5 font-serif text-sm font-bold tracking-[0.05em] border border-foreground/10 shadow-sm z-10">
                      {formatPrice(product.price)}
                    </span>

                    {/* Tag / Category Badge */}
                    {product.tag && (
                      <span className="absolute top-4 left-4 bg-foreground text-background px-2.5 py-1 text-[0.65rem] font-sans uppercase tracking-[0.2em] font-bold shadow-sm z-10">
                        {product.tag}
                      </span>
                    )}

                    {/* Multi-angle Thumbnails */}
                    {product.gallery && product.gallery.filter(Boolean).length > 1 && (
                      <div className="absolute bottom-4 left-4 flex gap-1.5 z-20">
                        {product.gallery.filter(Boolean).map((imgUrl, i) => {
                          const isActive = currentImage === imgUrl;
                          const labels = ['Front', 'Back', 'Detail'];
                          return (
                            <button
                              key={i}
                              type="button"
                              className={`w-9 h-11 overflow-hidden border bg-white transition-all cursor-pointer ${
                                isActive 
                                  ? 'border-foreground shadow-md opacity-100 scale-105' 
                                  : 'border-white/50 opacity-70 hover:opacity-100 hover:border-foreground/60'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCardImage(product.id, imgUrl);
                              }}
                              title={`View ${labels[i] || 'Angle'}`}
                            >
                              <img 
                                src={imgUrl} 
                                alt={`${labels[i]} preview`} 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick View Button Hover Overlay */}
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                      <button
                        onClick={() => {
                          setQuickViewProduct(product);
                          setQuickViewActiveImg(product.image);
                          setQuickViewSize(currentSize);
                          setQuickViewColor(product.colors[0]?.name || '');
                        }}
                        className="bg-background text-foreground font-sans text-xs uppercase tracking-[0.2em] font-bold px-6 py-3 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300 flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Specs & Gallery</span>
                      </button>
                    </div>

                  </div>

                  {/* Card Content & Selectors */}
                  <div className="p-6 flex flex-col flex-grow justify-between bg-white">
                    <div>
                      <div className="flex items-center justify-between text-[0.65rem] font-sans uppercase tracking-[0.2em] text-foreground/60 mb-2">
                        <span className="font-bold text-foreground/80">{product.category} Collection</span>
                        <span className="bg-foreground/5 px-2 py-0.5 border border-foreground/10">{product.gsm || '240 GSM'}</span>
                      </div>

                      <h3 className="font-serif text-lg tracking-tight font-bold text-foreground leading-snug mb-2 group-hover:text-amber-900 transition-colors">
                        {product.title}
                      </h3>
                      
                      <p className="font-sans text-xs text-foreground/70 mb-5 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Size & Color Selector Row */}
                      <div className="flex items-center justify-between mb-6 pt-4 border-t border-foreground/10">
                        
                        {/* Sizes */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-foreground/60 font-semibold">
                            Size: <strong className="text-foreground">{currentSize}</strong>
                          </span>
                          <div className="flex gap-1.5">
                            {product.sizes.map((s) => {
                              const isSelected = currentSize === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  className={`w-7 h-7 flex items-center justify-center border font-sans text-xs font-semibold transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-foreground text-background border-foreground font-bold shadow-sm' 
                                      : 'bg-transparent text-foreground border-foreground/20 hover:border-foreground/60'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectCardSize(product.id, s);
                                  }}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Colors */}
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-foreground/60 font-semibold">
                            Color
                          </span>
                          <div className="flex gap-1.5">
                            {product.colors.map((c) => {
                              const isSelectedColor = currentColor === c.name;
                              return (
                                <button
                                  key={c.name}
                                  type="button"
                                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                    isSelectedColor 
                                      ? 'ring-2 ring-foreground ring-offset-1 scale-110' 
                                      : 'border-foreground/30 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (handleSelectCardColor) handleSelectCardColor(product.id, c.name);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                      <button
                        disabled={product.stock <= 0}
                        className={`w-full bg-white text-foreground hover:bg-foreground hover:text-background border border-foreground font-sans text-[0.7rem] uppercase tracking-[0.18em] font-bold py-3 transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                          product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => {
                          if (product.stock <= 0) return;
                          handleAddToCart(product, currentSize, currentColor);
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Bag</span>
                      </button>

                      <button
                        disabled={product.stock <= 0}
                        className={`w-full bg-foreground text-background hover:bg-neutral-800 border border-foreground font-sans text-[0.7rem] uppercase tracking-[0.18em] font-bold py-3 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                          product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => {
                          if (product.stock <= 0) return;
                          handleBuyNow(product);
                        }}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Buy Now</span>
                      </button>
                    </div>

                  </div>

                </motion.div>
              );
            })
          )}

        </div>
      </section>
    </>
  );
}
