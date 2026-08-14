"use client";
import { motion } from 'framer-motion';
import { AvantGardeButton } from './Button';

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
  return (
    <>
      {/* Filter Bar */}
      {showCategoryFilter && (
        <section id="catalog" className="scroll-mt-[100px] max-w-[1400px] mx-auto px-6 pt-12">
          <div className="flex justify-center mb-12 w-full">

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center items-center gap-6">
            <span className="font-serif text-sm tracking-[0.2em] uppercase text-foreground/50 mr-2">COLLECTION</span>
            <button
              className={`text-xs uppercase tracking-[0.1em] pb-1 border-b transition-all duration-300 ${selectedCategory === 'ALL' ? 'border-foreground text-foreground font-medium' : 'border-transparent text-foreground/70 hover:text-foreground'}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All
            </button>
            <button
              className={`text-xs uppercase tracking-[0.1em] pb-1 border-b transition-all duration-300 ${selectedCategory === 'Essential' ? 'border-foreground text-foreground font-medium' : 'border-transparent text-foreground/70 hover:text-foreground'}`}
              onClick={() => setSelectedCategory('Essential')}
            >
              Essential
            </button>
            <button
              className={`text-xs uppercase tracking-[0.1em] pb-1 border-b transition-all duration-300 ${selectedCategory === 'Signature' ? 'border-foreground text-foreground font-medium' : 'border-transparent text-foreground/70 hover:text-foreground'}`}
              onClick={() => setSelectedCategory('Signature')}
            >
              Signature
            </button>
            <button
              className={`text-xs uppercase tracking-[0.1em] pb-1 border-b transition-all duration-300 ${selectedCategory === 'Executive' ? 'border-foreground text-foreground font-medium' : 'border-transparent text-foreground/70 hover:text-foreground'}`}
              onClick={() => setSelectedCategory('Executive')}
            >
              Executive
            </button>
          </div>
        </div>
      </section>
      )}

      {/* Vertical Product Gallery */}
      <section className="relative bg-background px-6 max-w-[1400px] mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 items-stretch">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 px-5">
              <h3 className="font-serif text-2xl text-foreground font-normal">No essentials match your criteria.</h3>
              <p className="text-foreground/60 mt-3 text-sm tracking-[0.05em]">
                Please try adjusting your filter or search term.
              </p>
              <button
                className="mt-6 text-xs uppercase tracking-[0.1em] pb-1 border-b border-foreground text-foreground font-medium transition-opacity hover:opacity-70"
                onClick={() => {
                  setSelectedPrice('ALL');
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                }}
                key={product.id}
                className="relative group flex flex-col w-full h-full"
              >
                <div className="relative w-full overflow-hidden bg-transparent mb-4 shadow-premium-diffused aspect-[3/4] shrink-0">
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-background/60 z-40 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-foreground text-background px-4 py-2 font-serif uppercase tracking-[0.2em] font-medium text-sm">Sold Out</span>
                    </div>
                  )}
                  <motion.img
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    src={getCardImage(product)}
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = product.fallbackImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                    }}
                    alt={product.title}
                    className="w-full h-full object-cover origin-center"
                  />
                  <span className="absolute top-4 right-4 bg-background/90 backdrop-blur-md text-foreground px-3 py-1 font-serif text-sm tracking-[0.05em] border border-foreground/10">{formatPrice(product.price)}</span>
                  {product.tag && <span className="absolute top-4 left-4 bg-foreground text-background px-2 py-0.5 text-[0.65rem] font-sans uppercase tracking-[0.2em] font-semibold">{product.tag}</span>}

                  {/* Multi-angle Image Thumbnails */}
                  {product.gallery && product.gallery.filter(Boolean).length > 1 && (
                    <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                      {product.gallery.filter(Boolean).map((imgUrl, i) => {
                        const isActive = getCardImage(product) === imgUrl;
                        const labels = ['Front', 'Back', 'Fit'];
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`w-10 h-10 overflow-hidden border transition-all ${isActive ? 'border-foreground opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-foreground/50'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCardImage(product.id, imgUrl);
                            }}
                            title={`View ${labels[i] || 'Angle'}`}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`${labels[i]} preview`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = product.fallbackImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                    <AvantGardeButton
                      onClick={() => {
                        setQuickViewProduct(product);
                        setQuickViewActiveImg(product.image);
                        setQuickViewSize(getSelectedSize(product.id));
                        setQuickViewColor(product.colors[0]?.name || '');
                      }}
                    >
                      📷 View Gallery & Specs
                    </AvantGardeButton>
                  </div>
                </div>

                <div className="pt-2 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-foreground/60 mb-2">{product.category} Collection — {product.gsm}</div>
                    <h3 className="font-serif text-lg tracking-[0.02em] font-medium leading-snug mb-1">{product.title}</h3>
                    <p className="font-sans text-sm text-foreground/70 mb-4">{product.description}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-foreground/60">Select Size:</span>
                        <div className="flex gap-2">
                          {product.sizes.map((s) => {
                            const isSelected = getSelectedSize(product.id) === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                className={`w-8 h-8 flex items-center justify-center border font-sans text-xs transition-all ${isSelected ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-foreground border-foreground/20 hover:border-foreground'}`}
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

                      <div className="flex gap-2 self-end pb-1">
                        {product.colors.map((c) => {
                          const isSelectedColor = getSelectedColor && getSelectedColor(product) === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              className={`w-5 h-5 rounded-none border transition-all ${isSelectedColor ? 'border-foreground shadow-[0_0_0_1px_rgba(0,0,0,1)]' : 'border-foreground/20 hover:border-foreground/60'}`}
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

                  <div className="flex flex-col gap-2 mt-auto">
                    <AvantGardeButton
                      disabled={product.stock <= 0}
                      className={product.stock <= 0 ? "opacity-50 cursor-not-allowed w-full" : "w-full"}
                      onClick={() => {
                        if (product.stock <= 0) return;
                        fetch('/api/order-alert', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: product.title, price: product.price })
                        }).catch(console.error);
                        handleAddToCart(product, getSelectedSize(product.id), getSelectedColor ? getSelectedColor(product) : product.colors[0]?.name);
                      }}
                    >
                      🛒 Add to Bag
                    </AvantGardeButton>
                    <AvantGardeButton
                      disabled={product.stock <= 0}
                      className={product.stock <= 0 ? "opacity-50 cursor-not-allowed w-full" : "w-full"}
                      onClick={() => {
                        if (product.stock <= 0) return;
                        fetch('/api/order-alert', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: product.title, price: product.price })
                        }).catch(console.error);
                        handleBuyNow(product);
                      }}
                    >
                      ⚡ Buy Now
                    </AvantGardeButton>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
