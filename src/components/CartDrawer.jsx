"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X, Plus, Minus, ArrowRight, Truck, ShieldCheck } from 'lucide-react';

export function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateCartQty, cartSubtotal, cartItemCount } = useCartStore();
  const router = useRouter();

  const subtotal = cartSubtotal ? cartSubtotal() : 0;
  const isFreeShipping = subtotal >= 70000;
  const shippingProgress = Math.min(100, (subtotal / 70000) * 100);
  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString('en-US')}`;

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm" 
          onClick={() => setIsCartOpen(false)}
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
                <ShoppingBag className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-sans text-sm font-bold text-[#111111]">
                  Shopping Bag ({cartItemCount ? cartItemCount() : 0})
                </h3>
              </div>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#111111] hover:bg-[#EDEDEF] transition-colors cursor-pointer"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free Shipping Milestone Progress */}
            <div className="px-6 py-3 bg-white border-b border-black/[0.04]">
              <div className="flex justify-between font-sans text-xs font-semibold mb-1.5 text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#7C3AED]" />
                  {isFreeShipping
                    ? 'Complimentary Express Delivery Unlocked'
                    : `Add ${formatPrice(70000 - subtotal)} for Free Express Delivery`}
                </span>
                <span className="font-bold text-[#7C3AED]">
                  {isFreeShipping ? 'FREE' : `${Math.round(shippingProgress)}%`}
                </span>
              </div>
              <div className="h-1.5 bg-[#EDEDEF] w-full rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shippingProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${isFreeShipping ? 'bg-emerald-500' : 'bg-[#7C3AED]'}`}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col divide-y divide-black/[0.04] custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-[#EDEDEF] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <h4 className="font-sans text-lg font-bold text-[#111111] mb-2">Your Bag is Empty</h4>
                  <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-xs mb-6">
                    Explore our ₦30k, ₦35k, and ₦40k heavyweight drops to add luxury pieces to your wardrobe.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/catalog');
                    }}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-semibold px-6 py-3 rounded-full transition-all cursor-pointer shadow-sm"
                  >
                    View Catalog
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                    <div className="w-20 h-24 flex-shrink-0 bg-[#EDEDEF] rounded-[16px] overflow-hidden p-1">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-[12px]" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-sans text-xs text-gray-400">
                          KLASIK
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="font-sans text-xs sm:text-sm font-bold text-[#111111] leading-snug truncate">
                          {item.title}
                        </div>
                        <div className="font-sans text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                          <span className="bg-[#EDEDEF] px-2 py-0.5 rounded-[8px] font-bold text-[#111111]">
                            {item.size}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{item.color}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-[#EDEDEF] rounded-full px-2 py-1 gap-2">
                          <button 
                            className="text-gray-600 hover:text-[#111111] transition-colors p-1 cursor-pointer" 
                            onClick={() => updateCartQty(idx, -1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-sans text-xs font-bold w-4 text-center text-[#111111]">{item.quantity}</span>
                          <button 
                            className="text-gray-600 hover:text-[#111111] transition-colors p-1 cursor-pointer" 
                            onClick={() => updateCartQty(idx, 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-sans text-sm font-bold text-[#111111]">
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
              <div className="px-6 py-5 border-t border-black/[0.04] bg-white shadow-lg">
                <div className="flex flex-col gap-2 mb-4 font-sans text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#111111]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Shipping</span>
                    <span className="font-semibold text-[#111111]">
                      {isFreeShipping ? <strong className="text-emerald-600">FREE</strong> : '₦2,500'}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-black/[0.04] text-[#111111]">
                    <span>Total Due</span>
                    <span className="text-base text-[#7C3AED]">{formatPrice(subtotal + (isFreeShipping ? 0 : 2500))}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs sm:text-sm font-bold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer group"
                  onClick={handleCheckout}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 mt-3 font-sans text-[11px] text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
