"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { checkoutAction } from '../../backend/actions/paystack';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateCartQty, cartSubtotal, cartItemCount } = useCartStore();
  const [loading, setLoading] = useState(false);

  const subtotal = cartSubtotal();
  const formatPrice = (amount) => `₦${amount.toLocaleString()}`;

  const handleCheckout = () => {
    setIsCartOpen(false);
    useCartStore.getState().setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-background border-l border-foreground/10 h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-foreground/10 bg-background z-10">
              <h3 className="font-serif text-lg tracking-[-0.02em] font-semibold">YOUR SHOPPING BAG ({cartItemCount()})</h3>
              <button
                className="text-foreground hover:opacity-50 transition-opacity font-sans text-xl"
                onClick={() => setIsCartOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center mt-20">
                  <div className="text-5xl mb-4">🛍️</div>
                  <h4 className="font-serif text-xl mb-2">Your Bag is Currently Empty</h4>
                  <p className="font-sans text-sm text-foreground/60 leading-relaxed">
                    Add one of our ₦30,000, ₦35,000, or ₦40,000 heavyweight t-shirts to proceed.
                  </p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 border-b border-foreground/5 pb-6">
                    <div className="w-24 h-32 flex-shrink-0 bg-foreground/5">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="font-serif text-base font-semibold leading-tight mb-1">{item.title}</div>
                        <div className="font-sans text-[0.7rem] uppercase tracking-[0.1em] text-foreground/60">
                          Size: <strong className="text-foreground">{item.size}</strong> | Color: {item.color}
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div className="font-sans text-sm font-medium">{formatPrice(item.price * item.quantity)}</div>
                        <div className="flex items-center gap-3 border border-foreground/20 px-2 py-1">
                          <button className="text-foreground/50 hover:text-foreground transition-colors px-1" onClick={() => updateCartQty(idx, -1)}>
                            -
                          </button>
                          <span className="font-sans text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button className="text-foreground/50 hover:text-foreground transition-colors px-1" onClick={() => updateCartQty(idx, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-6 border-t border-foreground/10 bg-background/90 backdrop-blur-md">
                <div className="mb-6">
                  <div className="flex justify-between font-sans text-[0.7rem] uppercase tracking-[0.1em] font-semibold mb-2">
                    <span>
                      {subtotal >= 70000
                        ? '🎉 You unlocked Free Express Delivery!'
                        : `Add ${formatPrice(70000 - subtotal)} more for Free Express Delivery`}
                    </span>
                  </div>
                  <div className="h-1 bg-foreground/10 w-full overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / 70000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-6 font-sans text-sm">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Estimated Shipping</span>
                    <span>{subtotal >= 70000 ? 'FREE' : '₦2,500'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-foreground/10">
                    <span>Total Due</span>
                    <span>{formatPrice(subtotal + (subtotal >= 70000 ? 0 : 2500))}</span>
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-[#1a1a1a] text-[#f8f8f8] font-sans text-xs uppercase tracking-[0.2em] py-4 hover:bg-neutral-800 transition-all duration-[700ms] disabled:opacity-50"
                  onClick={handleCheckout}
                >
                  {loading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
