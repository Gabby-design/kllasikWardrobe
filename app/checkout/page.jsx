'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../src/store/cartStore';
import { submitManualOrder } from '../actions/checkout';
import { Navbar } from '../../src/components/Navbar';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  Truck, 
  Lock, 
  Copy, 
  Check, 
  ArrowLeft, 
  CreditCard, 
  Sparkles, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  HelpCircle,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerForm, setCustomerForm, updateCartQty, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('express');
  const [orderNotes, setOrderNotes] = useState('');

  // Bank details
  const bankDetails = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'OPay / Paycom',
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'KLASIK WARDROBE',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '8030000000',
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!cart || cart.length === 0)) {
      router.push('/catalog');
    }
  }, [cart, router, isMounted]);

  const subtotal = cartSubtotal ? cartSubtotal() : 0;
  const isFreeShipping = subtotal >= 70000;
  const shippingCost = isFreeShipping ? 0 : 2500;
  const totalAmount = subtotal + shippingCost;
  const freeShippingProgress = Math.min(100, (subtotal / 70000) * 100);

  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopied(true);
      toast.success('Account number copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadForm = {
        ...customerForm,
        notes: orderNotes
      };
      
      const result = await submitManualOrder(cart, payloadForm, totalAmount);
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

  if (!isMounted || !cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getCityDeliveryEstimate = (city) => {
    switch (city) {
      case 'Lagos':
        return 'Express 24–48 Hours Delivery';
      case 'Abuja':
        return '2–3 Business Days Delivery';
      case 'Port Harcourt':
        return '2–4 Business Days Delivery';
      case 'Ibadan':
        return '1–2 Business Days Delivery';
      default:
        return '2–4 Business Days Nationwide Delivery';
    }
  };

  return (
    <>
      <Navbar />
      <main className="w-full pt-28 md:pt-36 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen bg-[#F9F8F6] text-[#121212]">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumbs & Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-foreground/10">
            <Link 
              href="/catalog" 
              className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.18em] font-semibold text-foreground/70 hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Collection</span>
            </Link>

            <div className="flex items-center gap-3 text-xs font-sans font-medium text-foreground/60">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 border border-emerald-200">
                <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-foreground/70 bg-foreground/5 px-3 py-1 border border-foreground/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 100% Authentic Luxury
              </span>
            </div>
          </div>

          {/* Stepper Progress Banner */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
                  Klasik Wardrobe &bull; Order Checkout
                </span>
                <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mt-1 text-foreground">
                  Finalize Your Order
                </h1>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 font-sans text-xs uppercase tracking-[0.15em]">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">1</span>
                  <span>Details</span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30" />
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">2</span>
                  <span>Payment</span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/30" />
                <div className="flex items-center gap-2 text-foreground/40">
                  <span className="w-6 h-6 rounded-full border border-foreground/30 flex items-center justify-center text-[10px]">3</span>
                  <span>Dispatch</span>
                </div>
              </div>
            </div>

            {/* Complimentary Shipping Progress Banner */}
            <div className="p-4 bg-foreground/[0.03] border border-foreground/10 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans mb-2">
                <span className="font-semibold tracking-wide flex items-center gap-2">
                  <Truck className="w-4 h-4 text-foreground/80" />
                  {isFreeShipping 
                    ? '🎉 You have unlocked COMPLIMENTARY EXPRESS DELIVERY across Nigeria!'
                    : `Add ${formatPrice(70000 - subtotal)} more to unlock FREE Express Delivery (Orders ₦70k+)`}
                </span>
                <span className="font-bold text-foreground/70">
                  {isFreeShipping ? '100% UNLOCKED' : `${Math.round(freeShippingProgress)}% OF ₦70,000`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-foreground/10 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${freeShippingProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${isFreeShipping ? 'bg-emerald-600' : 'bg-foreground'}`}
                />
              </div>
            </div>
          </div>

          {/* Main Content: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* Left Column: Form Details (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                
                {/* 1. Contact Information Card */}
                <div className="bg-white border border-foreground/10 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/10">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center font-serif text-sm font-bold">
                        01
                      </span>
                      <h2 className="font-serif text-xl font-bold tracking-tight">Customer Information</h2>
                    </div>
                    <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
                      Required
                    </span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-foreground/50" /> Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans px-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                        required
                        placeholder="e.g. Tunde Adeyemi"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Email Address */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-foreground/50" /> Email Address *
                        </label>
                        <input
                          type="email"
                          className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans px-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                          required
                          placeholder="tunde@example.com"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        />
                        <span className="text-[0.7rem] text-foreground/50 font-sans">
                          Order receipt & dispatch tracking will be sent here.
                        </span>
                      </div>

                      {/* Phone Number */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-foreground/50" /> Phone Number *
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 flex items-center gap-1 font-sans text-xs font-bold text-foreground/70 pointer-events-none">
                            <span>🇳🇬</span> +234
                          </div>
                          <input
                            type="tel"
                            className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans pl-20 pr-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                            required
                            placeholder="801 234 5678"
                            value={customerForm.phone}
                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          />
                        </div>
                        <span className="text-[0.7rem] text-foreground/50 font-sans">
                          For delivery dispatch notification & updates.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Address Card */}
                <div className="bg-white border border-foreground/10 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/10">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center font-serif text-sm font-bold">
                        02
                      </span>
                      <h2 className="font-serif text-xl font-bold tracking-tight">Delivery Destination</h2>
                    </div>
                    <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
                      Nationwide
                    </span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Street Address */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-foreground/50" /> Street Address & Landmark *
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans px-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                        required
                        placeholder="House / Flat No, Street Name, Landmark (e.g. Lekki Phase 1)"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* State / City Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80">
                          State / Destination City *
                        </label>
                        <select
                          className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans px-4 py-3.5 text-sm focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all cursor-pointer"
                          value={customerForm.city}
                          onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                        >
                          <option value="Lagos">Lagos State (24-48h Express)</option>
                          <option value="Abuja">Abuja FCT (2-3 Business Days)</option>
                          <option value="Port Harcourt">Port Harcourt (2-4 Business Days)</option>
                          <option value="Ibadan">Ibadan (1-2 Business Days)</option>
                          <option value="Other">Other State (2-4 Business Days)</option>
                        </select>
                      </div>

                      {/* Estimated Delivery Window info badge */}
                      <div className="flex flex-col justify-center bg-foreground/[0.03] border border-foreground/10 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-sans font-semibold text-foreground">
                          <Clock className="w-4 h-4 text-amber-700" />
                          <span>Estimated Timeframe</span>
                        </div>
                        <p className="font-sans text-xs text-foreground/70 mt-1">
                          {getCityDeliveryEstimate(customerForm.city)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Instructions (Optional) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-foreground/80">
                        Special Delivery Notes <span className="text-foreground/40 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#F9F8F6] border border-foreground/20 text-foreground font-sans px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-all"
                        placeholder="e.g. Leave package with front desk security"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Delivery Method Selection */}
                <div className="bg-white border border-foreground/10 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-foreground/10">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center font-serif text-sm font-bold">
                        03
                      </span>
                      <h2 className="font-serif text-xl font-bold tracking-tight">Delivery Tier</h2>
                    </div>
                    <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
                      Tracked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <label 
                      onClick={() => setDeliveryOption('express')}
                      className={`flex items-start justify-between p-4 border cursor-pointer transition-all ${
                        deliveryOption === 'express' 
                          ? 'border-foreground bg-foreground/[0.02] shadow-sm' 
                          : 'border-foreground/10 hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5">
                          <input 
                            type="radio" 
                            name="deliveryOption" 
                            checked={deliveryOption === 'express'} 
                            onChange={() => setDeliveryOption('express')} 
                            className="accent-foreground"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base font-bold">Klasik Signature Express Courier</span>
                            {isFreeShipping && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold px-2 py-0.5 uppercase tracking-wider">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-xs text-foreground/60 mt-1 leading-relaxed">
                            Insured, door-to-door direct courier with tamper-evident luxury matte-black dust packaging.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-sans text-sm font-bold">
                          {isFreeShipping ? '₦0' : '₦2,500'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

              </form>
            </div>

            {/* Right Column: Sticky Order Summary & Bank Transfer Card (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
              
              {/* Order Summary Box */}
              <div className="bg-white border border-foreground/10 p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-foreground/10">
                  <h3 className="font-serif text-lg font-bold tracking-tight">Order Summary</h3>
                  <span className="font-sans text-xs font-semibold px-2.5 py-1 bg-foreground/5 border border-foreground/10">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'Piece' : 'Pieces'}
                  </span>
                </div>

                {/* Items List */}
                <div className="flex flex-col divide-y divide-foreground/5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="py-3.5 flex gap-4 items-center">
                      <div className="w-16 h-20 bg-foreground/5 border border-foreground/10 flex-shrink-0 relative overflow-hidden group">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-serif text-xs opacity-40">
                            KLASIK
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5">
                          x{item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm font-semibold truncate text-foreground mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 font-sans text-[0.7rem] uppercase tracking-wider text-foreground/60">
                          <span className="bg-foreground/5 px-1.5 py-0.5 border border-foreground/10 font-bold text-foreground">
                            {item.size}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{item.color}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-foreground/20">
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, -1)}
                              className="px-2 py-0.5 text-xs hover:bg-foreground/10 transition-colors text-foreground/70"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold font-sans">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(idx, 1)}
                              className="px-2 py-0.5 text-xs hover:bg-foreground/10 transition-colors text-foreground/70"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-sans text-sm font-bold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Breakdown */}
                <div className="border-t border-foreground/10 pt-4 mt-4 flex flex-col gap-2.5 font-sans text-xs">
                  <div className="flex justify-between text-foreground/70">
                    <span>Item Subtotal</span>
                    <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-foreground/70">
                    <span>Express Delivery</span>
                    {isFreeShipping ? (
                      <span className="text-emerald-700 font-bold uppercase tracking-wider">FREE (Over ₦70,000)</span>
                    ) : (
                      <span className="font-semibold text-foreground">₦2,500</span>
                    )}
                  </div>

                  <div className="flex justify-between text-foreground/70">
                    <span>Luxury Dust Box & Packaging</span>
                    <span className="text-emerald-700 font-semibold uppercase tracking-wider">COMPLIMENTARY</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-foreground/10">
                    <div>
                      <span className="font-serif text-base font-bold text-foreground uppercase tracking-tight block">
                        Total Amount Due
                      </span>
                      <span className="font-sans text-[0.65rem] text-foreground/50 uppercase tracking-widest">
                        Including all packaging & courier
                      </span>
                    </div>
                    <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Obsidian Luxury Payment Instructions Card */}
              <div className="bg-[#111111] text-[#F9F8F6] p-6 md:p-8 border border-neutral-800 shadow-2xl relative overflow-hidden">
                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] font-bold text-amber-400/90 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Instant Bank Transfer
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/10 text-white/80 border border-white/10">
                      Step 2 of 2
                    </span>
                  </div>

                  <h3 className="font-serif text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                    Bank Transfer Details
                  </h3>
                  <p className="font-sans text-xs text-white/70 leading-relaxed mb-6">
                    Please transfer the exact total of <strong className="text-white font-bold">{formatPrice(totalAmount)}</strong> to the verified business account below:
                  </p>

                  {/* High Contrast Account Details Box */}
                  <div className="bg-black/80 border border-white/15 p-5 mb-6 flex flex-col gap-3.5 shadow-inner">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-white/50">Bank Name</span>
                      <span className="font-sans text-sm font-bold text-white tracking-wide">{bankDetails.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-white/50">Account Name</span>
                      <span className="font-sans text-sm font-bold text-white tracking-wide">{bankDetails.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="font-sans text-[0.7rem] uppercase tracking-[0.15em] text-white/50 block">
                          Account Number
                        </span>
                        <span className="font-mono text-xl md:text-2xl font-bold text-amber-300 tracking-wider">
                          {bankDetails.accountNumber}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-sans text-xs font-semibold px-3.5 py-2 border border-white/20 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submission CTA */}
                  <button
                    form="checkout-form"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#F9F8F6] text-[#111111] hover:bg-white active:scale-[0.99] font-sans text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 border border-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg cursor-pointer group"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                        <span>Securing & Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                        <span>I Have Made The Transfer &bull; Place Order</span>
                      </>
                    )}
                  </button>

                  <p className="font-sans text-[0.7rem] text-center text-white/50 mt-4 leading-relaxed">
                    By clicking above, your order will be registered in our system and you will receive an automatic email confirmation.
                  </p>
                </div>
              </div>

              {/* Guarantees & Support Badges */}
              <div className="grid grid-cols-2 gap-3 font-sans text-xs text-foreground/70">
                <div className="p-3.5 bg-white border border-foreground/10 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-foreground/80 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-foreground">Heavyweight Guarantee</strong>
                    <span className="text-[0.68rem] text-foreground/60">240-300 GSM Organic Cotton</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-foreground/10 flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-foreground/80 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-foreground">Discreet Packaging</strong>
                    <span className="text-[0.68rem] text-foreground/60">Tamper-evident luxury finish</span>
                  </div>
                </div>
              </div>

              {/* Concierge Support Link */}
              <div className="text-center font-sans text-xs text-foreground/60 pt-2">
                Questions or special inquiries?{' '}
                <a 
                  href="https://wa.me/2348000000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="font-semibold text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  Contact WhatsApp Concierge
                </a>
              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
}
