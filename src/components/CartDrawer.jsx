"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X, Plus, Minus, ArrowRight, Truck, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateCartQty, cartSubtotal, cartItemCount } = useCartStore();
  const router = useRouter();

  const subtotal = cartSubtotal ? cartSubtotal() : 0;
  const isFreeShipping = subtotal >= 70000;
  const shippingProgress = Math.min(100, (subtotal / 70000) * 100);
  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-foreground/40 backdrop-blur-sm" 
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-[#F9F8F6] border-l border-foreground/10 h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-foreground/10 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-foreground" />
                <h3 className="font-serif text-base font-bold tracking-tight">
                  SHOPPING BAG ({cartItemCount ? cartItemCount() : 0})
                </h3>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free Shipping Milestone Progress */}
            <div className="px-6 py-3.5 bg-foreground/[0.03] border-b border-foreground/10">
              <div className="flex justify-between font-sans text-[0.7rem] uppercase tracking-[0.1em] font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground/80">
                  <Truck className="w-3.5 h-3.5" />
                  {isFreeShipping
                    ? '🎉 Complimentary Delivery Unlocked!'
                    : `Add ${formatPrice(70000 - subtotal)} for Free Express Delivery`}
                </span>
                <span className="font-bold text-foreground">
                  {isFreeShipping ? 'FREE' : `${Math.round(shippingProgress)}%`}
                </span>
              </div>
              <div className="h-1 bg-foreground/10 w-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shippingProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${isFreeShipping ? 'bg-emerald-600' : 'bg-foreground'}`}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col divide-y divide-foreground/5 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-6 h-6 text-foreground/40" />
                  </div>
                  <h4 className="font-serif text-xl font-bold mb-2">Your Bag is Empty</h4>
                  <p className="font-sans text-xs text-foreground/60 leading-relaxed max-w-xs mb-6">
                    Explore our ₦30k, ₦35k, and ₦40k heavyweight drops to add luxury pieces to your wardrobe.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/catalog');
                    }}
                    className="bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold px-6 py-3.5 hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    View Catalog
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                    <div className="w-20 h-24 flex-shrink-0 bg-foreground/5 border border-foreground/10 overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-xs opacity-40">
                          KLASIK
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="font-serif text-sm font-bold text-foreground leading-snug truncate">
                          {item.title}
                        </div>
                        <div className="font-sans text-[0.7rem] uppercase tracking-wider text-foreground/60 mt-1 flex items-center gap-2">
                          <span className="bg-foreground/5 px-1.5 py-0.5 border border-foreground/10 font-bold text-foreground">
                            {item.size}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{item.color}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-foreground/20 bg-white">
                          <button 
                            className="text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors px-2 py-1 cursor-pointer text-xs" 
                            onClick={() => updateCartQty(idx, -1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-sans text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button 
                            className="text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors px-2 py-1 cursor-pointer text-xs" 
                            onClick={() => updateCartQty(idx, 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-sans text-sm font-bold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout Trigger */}
            {cart.length > 0 && (
              <div className="px-6 py-6 border-t border-foreground/10 bg-white shadow-lg">
                <div className="flex flex-col gap-2 mb-5 font-sans text-xs">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Estimated Shipping</span>
                    <span className="font-semibold text-foreground">
                      {isFreeShipping ? <strong className="text-emerald-700">FREE</strong> : '₦2,500'}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-foreground/10 text-foreground">
                    <span className="font-serif">Total Due</span>
                    <span className="font-serif text-lg">{formatPrice(subtotal + (isFreeShipping ? 0 : 2500))}</span>
                  </div>
                </div>

                <button
                  className="w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold py-4.5 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer group"
                  onClick={handleCheckout}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 mt-3 font-sans text-[0.65rem] text-foreground/50 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>256-Bit Encrypted &bull; Direct Bank Transfer</span>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
