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
  MessageCircle,
  Plus,
  Minus,
  CheckCircle2,
  Send,
  Building2
} from 'lucide-react';
import { getWhatsAppOrderLink } from '../../src/utils/whatsapp';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, customerForm, setCustomerForm, updateCartQty, clearCart, setLastOrder } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState('whatsapp'); // 'whatsapp' | 'website'
  const [orderNotes, setOrderNotes] = useState('');

  // Verified Bank details
  const bankDetails = {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'OPay / Paycom',
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'KLASIK WARDROBE',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '7075039738',
  };

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '2347075039738';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!cart || cart.length === 0)) {
      router.push('/');
    }
  }, [cart, router, isMounted]);

  const subtotal = cartSubtotal ? cartSubtotal() : 0;
  const isFreeShipping = subtotal >= 200000;
  const shippingCost = isFreeShipping ? 0 : 2500;
  const totalAmount = subtotal + shippingCost;
  const freeShippingProgress = Math.min(100, (subtotal / 200000) * 100);

  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const handleCopyAccount = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopied(true);
      toast.success('Account number copied: ' + bankDetails.accountNumber);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Option 1: Direct WhatsApp Checkout
  const handleWhatsAppCheckout = () => {
    const generatedOrderId = `KLASIK-${Date.now().toString().slice(-6)}`;
    const orderData = {
      orderId: generatedOrderId,
      items: [...cart],
      customer: {
        name: customerForm.name || 'Valued Customer',
        phone: customerForm.phone || '',
        email: customerForm.email || '',
        address: customerForm.address || '',
        city: customerForm.city || 'Lagos',
        notes: orderNotes
      },
      totalAmount,
      subtotal,
      shippingCost,
      isFreeShipping,
      bankDetails,
      orderMethod: 'whatsapp'
    };

    if (setLastOrder) {
      setLastOrder(orderData);
    }

    const waLink = getWhatsAppOrderLink(orderData, whatsappPhone);
    window.open(waLink, '_blank');
    toast.success('Opening WhatsApp with your order details...');
    if (clearCart) clearCart();
    router.push('/success?method=whatsapp');
  };

  // Option 2: Website Order Form Submission
  const handleWebsiteSubmit = async (e) => {
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

      const generatedOrderId = result.orderId || `KLASIK-${Date.now().toString().slice(-6)}`;
      const orderRecord = {
        orderId: generatedOrderId,
        items: [...cart],
        customer: { ...payloadForm },
        totalAmount,
        subtotal,
        shippingCost,
        isFreeShipping,
        bankDetails,
        createdAt: new Date().toISOString()
      };

      if (setLastOrder) {
        setLastOrder(orderRecord);
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
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] pb-24 md:pb-16 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32">
        
        {/* Navigation & Trust Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-black/[0.04]">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-gray-500 hover:text-[#7C3AED] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Collection</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-purple-700 bg-[#EDE9FE] border border-[#DDD6FE] px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> 100% Authentic Luxury
            </span>
          </div>
        </div>

        {/* Free Shipping Progress Pill Banner */}
        <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans mb-2.5">
            <span className="font-semibold text-[#111111] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#7C3AED]" />
              {isFreeShipping 
                ? 'COMPLIMENTARY EXPRESS DELIVERY unlocked across Nigeria!' 
                : `Add ${formatPrice(200000 - subtotal)} more for FREE Express Courier (Orders ₦200,000+)`}
            </span>
            <span className="font-bold text-[#7C3AED]">
              {isFreeShipping ? '100% UNLOCKED' : `${Math.round(freeShippingProgress)}% OF ₦200,000`}
            </span>
          </div>
          <div className="h-2 w-full bg-[#EDEDEF] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${freeShippingProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isFreeShipping ? 'bg-emerald-500' : 'bg-[#7C3AED]'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Two Checkout Options (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Mode Selection Tabs (Option 1 vs Option 2) */}
            <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <div className="mb-4">
                <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider block mb-1">
                  Choose Checkout Method
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                  How would you like to place your order?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1 Button Card */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('whatsapp')}
                  className={`p-4 rounded-[20px] border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    checkoutMode === 'whatsapp'
                      ? 'border-[#10B981] bg-[#ECFDF5] shadow-sm'
                      : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    {checkoutMode === 'whatsapp' && (
                      <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111111] mb-1">
                      1. Order via WhatsApp
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Chat directly with the store owner. Send order details & confirm payment in one tap.
                    </p>
                  </div>
                </button>

                {/* Option 2 Button Card */}
                <button
                  type="button"
                  onClick={() => setCheckoutMode('website')}
                  className={`p-4 rounded-[20px] border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    checkoutMode === 'website'
                      ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-sm'
                      : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {checkoutMode === 'website' && (
                      <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#111111] mb-1">
                      2. Website Order Form
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Fill out delivery details and send automatic order notification to our system.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* OPTION 1 CONTENT: DIRECT WHATSAPP CHECKOUT */}
            {checkoutMode === 'whatsapp' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Bank Details Card */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.04]">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#7C3AED]" />
                      <h3 className="font-bold text-base sm:text-lg text-[#111111]">
                        Bank Transfer Details
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
                      Step 1 of 2: Transfer
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-4">
                    Transfer the total of <strong className="text-[#111111] font-bold">{formatPrice(totalAmount)}</strong> to the account below, then tap WhatsApp below to send your order:
                  </p>

                  <div className="bg-[#F7F7F8] rounded-[20px] p-4 sm:p-5 border border-black/[0.04] flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.04]">
                      <span className="text-gray-500">Bank Name</span>
                      <span className="font-bold text-[#111111]">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.04]">
                      <span className="text-gray-500">Account Name</span>
                      <span className="font-bold text-[#111111]">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-[11px] text-gray-400 block">Account Number</span>
                        <span className="font-mono text-lg sm:text-xl font-bold text-[#7C3AED] tracking-wider">
                          {bankDetails.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 active:scale-95 text-[#111111] text-xs font-bold px-3.5 py-2 rounded-full border border-black/[0.06] shadow-xs transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Customer Info (Optional for WhatsApp message personalization) */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                  <div className="pb-3 mb-4 border-b border-black/[0.04]">
                    <h3 className="font-bold text-base text-[#111111]">
                      Your Information (Included in WhatsApp Message)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enter your name and delivery area so the owner can dispatch quickly:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tunde"
                        value={customerForm.name || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Delivery City / State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lagos (Lekki) or Abuja"
                        value={customerForm.city || ''}
                        onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                        className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Big WhatsApp CTA Button */}
                <div className="bg-[#ECFDF5] border border-emerald-200 rounded-[24px] p-6 sm:p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center mb-3 shadow-md">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-emerald-950 mb-1">
                    Ready to Confirm on WhatsApp?
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed mb-5">
                    Clicking below prepares your complete cart details, item sizes, and payment sum, opening WhatsApp directly with the owner of Klasik Wardrobe.
                  </p>

                  <button
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    className="w-full sm:w-auto min-w-[280px] bg-[#10B981] hover:bg-[#059669] text-white font-sans text-sm font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-[#10B981]" />
                    <span>Chat & Send Order on WhatsApp</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* OPTION 2 CONTENT: WEBSITE ORDER FORM */}
            {checkoutMode === 'website' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <form id="website-order-form" onSubmit={handleWebsiteSubmit} className="flex flex-col gap-6">
                  
                  {/* Customer Information Card */}
                  <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/[0.04]">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#7C3AED]" />
                        <h3 className="font-bold text-base text-[#111111]">1. Customer Details</h3>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400">Required</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tunde Adeyemi"
                          value={customerForm.name || ''}
                          onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                          className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="0801 234 5678"
                            value={customerForm.phone || ''}
                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                            className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="tunde@example.com"
                            value={customerForm.email || ''}
                            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                            className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Destination Card */}
                  <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                    <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/[0.04]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#7C3AED]" />
                        <h3 className="font-bold text-base text-[#111111]">2. Delivery Address</h3>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400">Nationwide Express</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Street Address & Landmark *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="House / Flat No, Street, Landmark"
                          value={customerForm.address || ''}
                          onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                          className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                            Destination City / State *
                          </label>
                          <select
                            value={customerForm.city || 'Lagos'}
                            onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                            className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all cursor-pointer"
                          >
                            <option value="Lagos">Lagos State (24-48h Express)</option>
                            <option value="Abuja">Abuja FCT (2-3 Business Days)</option>
                            <option value="Port Harcourt">Port Harcourt (2-4 Business Days)</option>
                            <option value="Ibadan">Ibadan (1-2 Business Days)</option>
                            <option value="Other">Other States (2-4 Business Days)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">
                            Delivery Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Call before arrival"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Details Box */}
                  <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.04]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#7C3AED]" />
                        <h3 className="font-bold text-base text-[#111111]">
                          3. Make Bank Transfer
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
                        Total: {formatPrice(totalAmount)}
                      </span>
                    </div>

                    <div className="bg-[#F7F7F8] rounded-[20px] p-4 sm:p-5 border border-black/[0.04] flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.04]">
                        <span className="text-gray-500">Bank Name</span>
                        <span className="font-bold text-[#111111]">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-black/[0.04]">
                        <span className="text-gray-500">Account Name</span>
                        <span className="font-bold text-[#111111]">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <div>
                          <span className="text-[11px] text-gray-400 block">Account Number</span>
                          <span className="font-mono text-lg sm:text-xl font-bold text-[#7C3AED] tracking-wider">
                            {bankDetails.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 active:scale-95 text-[#111111] text-xs font-bold px-3.5 py-2 rounded-full border border-black/[0.06] shadow-xs transition-all cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Web Order Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-6 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-sm font-bold py-4 px-6 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Order Notification...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>I Have Paid • Submit Order Notification</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

          </div>

          {/* Right Column: Order Summary (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
            
            <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-black/[0.04]">
                <h3 className="font-bold text-base sm:text-lg text-[#111111]">
                  Order Summary
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#EDE9FE] text-[#7C3AED] rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'Piece' : 'Pieces'}
                </span>
              </div>

              {/* Items List */}
              <div className="flex flex-col divide-y divide-black/[0.04] max-h-[320px] overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="py-3 flex gap-3.5 items-center">
                    <div className="w-16 h-18 rounded-[14px] bg-[#EDEDEF] flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-[10px]" 
                        />
                      ) : (
                        <div className="font-sans text-[10px] text-gray-400">KLASIK</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#111111] truncate mb-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="bg-[#EDEDEF] px-2 py-0.5 rounded-[8px] font-bold text-[#111111]">
                          {item.size}
                        </span>
                        <span>&bull;</span>
                        <span className="truncate">{item.color}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-[#EDEDEF] rounded-full px-2 py-0.5 gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -1)}
                            className="text-gray-600 hover:text-[#111111] p-0.5 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-3 text-center text-xs font-bold text-[#111111]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, 1)}
                            className="text-gray-600 hover:text-[#111111] p-0.5 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#111111]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-black/[0.04] pt-4 mt-4 flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-[#111111]">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-500">
                  <span>Express Delivery</span>
                  {isFreeShipping ? (
                    <span className="text-emerald-600 font-bold">FREE (Over ₦200k)</span>
                  ) : (
                    <span className="font-bold text-[#111111]">₦2,500</span>
                  )}
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Luxury Matte Dust Box</span>
                  <span className="text-emerald-600 font-semibold">COMPLIMENTARY</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-black/[0.04]">
                  <div>
                    <span className="font-bold text-sm text-[#111111] block">Total Due</span>
                    <span className="text-[10px] text-gray-400">All packaging & delivery included</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-[#7C3AED]">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

            </div>

            {/* Direct WhatsApp Concierge Help Pill */}
            <div className="bg-white rounded-[20px] p-4 border border-black/[0.04] shadow-xs flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#111111] block">Need help with your order?</span>
                  <span className="text-gray-400 text-[11px]">Direct WhatsApp support with store owner</span>
                </div>
              </div>
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#10B981] hover:underline flex-shrink-0"
              >
                Chat Now &rarr;
              </a>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
