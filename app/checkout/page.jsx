'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../src/store/cartStore';
import { submitManualOrder } from '../actions/checkout';
import { Navbar } from '../../src/components/Navbar';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerForm, setCustomerForm } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If cart is empty, redirect back to catalog
    if (isMounted && (!cart || cart.length === 0)) {
      router.push('/catalog');
    }
  }, [cart, router, isMounted]);

  const subtotal = cartSubtotal ? cartSubtotal() : 0;
  const shippingCost = subtotal >= 70000 ? 0 : 2500;
  const totalAmount = subtotal + shippingCost;
  const formatPrice = (amount) => `₦${amount.toLocaleString()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitManualOrder(cart, customerForm, totalAmount);
      if (!result || !result.success) {
        toast.error(result?.error || 'Failed to place order.');
        setLoading(false);
        return;
      }
      toast.success('Order placed successfully!');
      router.push('/success');
    } catch (error) {
      toast.error(error.message || 'Failed to place order.');
      setLoading(false);
    }
  };

  if (!isMounted || !cart || cart.length === 0) return null;

  return (
    <>
      <Navbar />
      <main className="w-full pt-32 pb-24 px-4 min-h-screen bg-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-12">Checkout</h1>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Form */}
            <div className="w-full lg:w-1/2 flex flex-col gap-8">
              <div>
                <h2 className="font-sans text-sm uppercase tracking-[0.2em] font-semibold mb-6">1. Customer Information</h2>
                <form id="checkout-form" className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
                      <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60">Phone Number</label>
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
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Summary & Payment Info */}
            <div className="w-full lg:w-1/2 flex flex-col gap-8">
              <div className="bg-foreground/5 border border-foreground/10 p-8">
                <h2 className="font-sans text-sm uppercase tracking-[0.2em] font-semibold mb-6 border-b border-foreground/10 pb-4">2. Order Summary</h2>
                
                <div className="flex flex-col gap-1 mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between items-start p-4 border-b border-foreground/5 hover:bg-foreground/[0.02] transition-colors last:border-0">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-serif text-base font-semibold leading-tight">{item.title}</div>
                        <div className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-foreground/50">
                          Size: <span className="text-foreground font-medium">{item.size}</span> &nbsp;&bull;&nbsp; Color: <span className="text-foreground font-medium">{item.color}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 text-right">
                        <div className="font-sans text-sm font-bold tracking-wide">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <div className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-foreground/50">
                          Qty: <span className="text-foreground font-bold">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-foreground/10 pt-4 flex flex-col gap-2 text-sm font-sans">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>Estimated Shipping</span>
                    <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-foreground/10">
                    <span>Total Due</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] text-[#f8f8f8] p-8 md:p-10 border border-neutral-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                <h2 className="font-serif text-2xl mb-2 text-[#ffffff]">Payment Instructions</h2>
                <p className="font-sans text-sm mb-8 text-[#a0a0a0] leading-relaxed">
                  To complete your order, please securely transfer the exact total amount to the designated account below.
                </p>
                <div className="bg-black/60 p-6 border border-white/10 font-sans text-sm flex flex-col gap-4 mb-10 relative z-10 shadow-inner">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[#888888] text-xs uppercase tracking-[0.1em]">Bank Name</span>
                    <span className="font-bold tracking-wide text-white">OPay</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[#888888] text-xs uppercase tracking-[0.1em]">Account Name</span>
                    <span className="font-bold tracking-wide text-white">Klasik Wardrobe</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#888888] text-xs uppercase tracking-[0.1em]">Account Number</span>
                    <span className="font-mono font-bold tracking-widest text-xl text-white">[Insert Number]</span>
                  </div>
                </div>
                
                <button 
                  form="checkout-form"
                  type="submit"
                  disabled={loading} 
                  className="relative z-10 w-full bg-[#f8f8f8] text-[#1a1a1a] font-sans text-sm uppercase tracking-[0.2em] py-5 font-bold hover:bg-neutral-300 transition-all duration-500 disabled:opacity-50 flex justify-center items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : 'I Have Made The Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
