import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { checkoutAction } from '../../backend/actions/paystack';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function CheckoutModal({ formatPrice, cartSubtotal, cart, setCart }) {
  const { 
    isCheckoutOpen, setIsCheckoutOpen, 
    checkoutStep, setCheckoutStep, 
    customerForm, setCustomerForm 
  } = useCartStore();

  const [loading, setLoading] = useState(false);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await checkoutAction(cart, customerForm);
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Failed to initiate checkout.');
      }
    } catch (error) {
      toast.error('Error starting checkout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isCheckoutOpen) return null;
  return (
    <>
{/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={() => setIsCheckoutOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-background border border-foreground/10 p-8 md:p-12 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-foreground font-sans text-xl hover:opacity-50 transition-opacity" onClick={() => setIsCheckoutOpen(false)}>
              ✕
            </button>

            {checkoutStep === 'FORM' ? (
              <>
                <h2 className="font-serif text-3xl font-bold tracking-[-0.02em] mb-2">
                  Klassic Order Checkout
                </h2>
                <p className="font-sans text-sm text-foreground/70 mb-8">
                  Enter your shipping address in Nigeria for express dispatch.
                </p>

                <form className="flex flex-col gap-6" onSubmit={handleCheckoutSubmit}>
                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors"
                      required
                      placeholder="e.g. Babatunde Ogunlesi"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Email Address</label>
                      <input
                        type="email"
                        className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors"
                        required
                        placeholder="yourname@gmail.com"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Phone / WhatsApp</label>
                      <input
                        type="tel"
                        className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors"
                        required
                        placeholder="+234 800 000 0000"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Delivery Address</label>
                    <input
                      type="text"
                      className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors"
                      required
                      placeholder="Street address, apartment or suite"
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">City / State</label>
                      <select
                        className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors appearance-none"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                      >
                        <option value="Lagos">Lagos State</option>
                        <option value="Abuja">Abuja FCT</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                        <option value="Ibadan">Ibadan</option>
                        <option value="Other">Other State</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Payment Method</label>
                      <select
                        className="w-full bg-foreground/5 border border-foreground/20 text-foreground font-sans px-4 py-3 focus:outline-none focus:border-foreground transition-colors appearance-none"
                        value={customerForm.paymentMethod}
                        onChange={(e) => setCustomerForm({ ...customerForm, paymentMethod: e.target.value })}
                      >
                        <option value="PAY_ON_DELIVERY">Pay on Delivery (Lagos/Abuja)</option>
                        <option value="CARD">Debit Card / Bank Transfer</option>
                        <option value="WHATSAPP">Direct WhatsApp Order</option>
                      </select>
                    </div>
                  </div>

                  <button disabled={loading} className="w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] py-4 mt-4 border border-foreground hover:bg-transparent hover:text-foreground transition-all duration-[700ms] disabled:opacity-50" type="submit">
                    {loading ? 'Processing...' : `Confirm & Place Order (${formatPrice(cartSubtotal + (cartSubtotal >= 70000 ? 0 : 2500))})`}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="font-serif text-3xl font-bold mb-4">
                  Order Confirmed!
                </h2>
                <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-8">
                  Thank you, <strong className="text-foreground">{customerForm.name}</strong>! Your order for Klassic Wardrobe t-shirts has been successfully logged. We will contact you at <strong className="text-foreground">{customerForm.phone}</strong> for dispatch confirmation.
                </p>

                <div className="bg-foreground/5 border border-foreground/10 p-6 text-left mb-8 font-sans text-sm">
                  <div className="font-bold text-xs uppercase tracking-[0.1em] mb-4">
                    ORDER RECEIPT SUMMARY:
                  </div>
                  {cart.map((i) => (
                    <div key={`${i.id}-${i.size}`} className="flex justify-between mb-2">
                      <span>
                        {i.quantity}x {i.title} ({i.size})
                      </span>
                      <span>{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-foreground/10 mt-4 pt-4 flex justify-between font-bold">
                    <span>Total Amount</span>
                    <span>{formatPrice(cartSubtotal + (cartSubtotal >= 70000 ? 0 : 2500))}</span>
                  </div>
                </div>

                <button
                  className="w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] py-4 border border-foreground hover:bg-transparent hover:text-foreground transition-all duration-[700ms]"
                  onClick={() => {
                    setCart([]);
                    setIsCheckoutOpen(false);
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
