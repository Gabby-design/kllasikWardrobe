import { motion } from 'framer-motion';

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
  return (
    <>
{/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={() => setQuickViewProduct(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl bg-background border border-foreground/10 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-background/50 backdrop-blur-md text-foreground font-sans text-xl border border-foreground/10 hover:bg-foreground hover:text-background transition-colors duration-300" onClick={() => setQuickViewProduct(null)}>
              ✕
            </button>
            <div className="flex w-full flex-col md:flex-row">
              <div className="w-full md:w-1/2 relative bg-foreground/5 p-4 md:p-8 flex flex-col items-center justify-center">
                <img
                  src={quickViewActiveImg || quickViewProduct.image}
                  onError={(e) => {
                    e.target.src = quickViewProduct.fallbackImage;
                  }}
                  alt={quickViewProduct.title}
                  className="w-full max-w-sm h-auto object-cover"
                />
                {quickViewProduct.gallery && (
                  <div className="flex gap-2 mt-8 justify-center">
                    {quickViewProduct.gallery.map((imgUrl, idx) => {
                      const isCurrent = (quickViewActiveImg || quickViewProduct.image) === imgUrl;
                      return (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Angle ${idx + 1}`}
                          className={`w-14 h-14 object-cover cursor-pointer transition-all ${isCurrent ? 'border border-foreground opacity-100' : 'border border-foreground/20 opacity-60 hover:opacity-100'}`}
                          onClick={() => setQuickViewActiveImg(imgUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                <div className="flex-1">
                  <span className="bg-foreground text-background font-sans text-[0.65rem] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 inline-block mb-4">{quickViewProduct.category} Collection</span>
                  <h2 className="font-serif text-3xl md:text-4xl tracking-[-0.02em] font-bold mb-2">
                    {quickViewProduct.title}
                  </h2>
                  <div className="font-sans text-lg text-foreground/80 mb-6">{formatPrice(quickViewProduct.price)}</div>
                  <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-8">
                    {quickViewProduct.description}
                  </p>

                  <div className="flex flex-col gap-3 font-sans text-xs tracking-[0.05em] text-foreground/80 mb-8 border-y border-foreground/10 py-6">
                    <div>
                      <span className="font-bold mr-2 uppercase tracking-[0.1em]">Weight:</span> {quickViewProduct.gsm}
                    </div>
                    <div>
                      <span className="font-bold mr-2 uppercase tracking-[0.1em]">Material:</span> {quickViewProduct.material}
                    </div>
                    <div>
                      <span className="font-bold mr-2 uppercase tracking-[0.1em]">Silhouette:</span> {quickViewProduct.fit}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="mb-8">
                    <label className="block font-sans text-xs font-bold uppercase tracking-[0.2em] text-foreground/60 mb-3">
                      SELECT SIZE:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {quickViewProduct.sizes.map((s) => (
                        <button
                          key={s}
                          className={`w-12 h-12 flex items-center justify-center border font-sans text-sm transition-all ${quickViewSize === s ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-foreground border-foreground/20 hover:border-foreground'}`}
                          onClick={() => setQuickViewSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={quickViewProduct.stock <= 0}
                  className={`w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] py-4 border border-foreground hover:bg-transparent hover:text-foreground transition-all duration-[700ms] ${quickViewProduct.stock <= 0 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  onClick={() => {
                    if (quickViewProduct.stock <= 0) return;
                    handleAddToCart(quickViewProduct, quickViewSize, quickViewColor);
                    setQuickViewProduct(null);
                  }}
                >
                  {quickViewProduct.stock <= 0 ? 'Sold Out' : `Add ${quickViewSize} to Bag — ${formatPrice(quickViewProduct.price)}`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
