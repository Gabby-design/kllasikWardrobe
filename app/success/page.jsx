'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../src/store/cartStore';
import { Navbar } from '../../src/components/Navbar';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MessageCircle, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  CreditCard, 
  MapPin, 
  User, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getWhatsAppOrderLink, formatWhatsAppOrderMessage } from '../../src/utils/whatsapp';

export default function SuccessPage() {
  const { clearCart, lastOrder } = useCartStore();
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Clear active shopping cart now that order is placed
    clearCart();
  }, [clearCart]);

  const orderData = isMounted && lastOrder ? lastOrder : {
    orderId: 'KLASIK-RECEIPT',
    items: [],
    customer: { name: 'Customer', city: 'Lagos' },
    totalAmount: 0,
    subtotal: 0,
    shippingCost: 0,
    isFreeShipping: false,
    bankDetails: {
      bankName: 'OPay / Paycom',
      accountName: 'KLASIK WARDROBE',
      accountNumber: '7075039738'
    },
    createdAt: ''
  };

  const whatsAppUrl = getWhatsAppOrderLink(orderData);

  const handleCopyMessage = () => {
    const text = formatWhatsAppOrderMessage(orderData);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsg(true);
      toast.success('Order summary copied to clipboard! You can paste it on WhatsApp.');
      setTimeout(() => setCopiedMsg(false), 2500);
    }
  };

  const formatPrice = (amt) => `₦${Number(amt || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-24">
        
        {/* Success Header Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center bg-white border border-foreground/10 p-6 sm:p-10 shadow-xl mb-8"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 border border-emerald-200 inline-block mb-3">
            Order Confirmed &bull; Reference #{orderData.orderId}
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-foreground">
            Thank You For Your Order
          </h1>

          <p className="font-sans text-xs sm:text-sm text-foreground/70 max-w-xl mx-auto leading-relaxed mb-6">
            Your order record has been registered. Send a quick WhatsApp confirmation to our concierge team with your transfer proof for instant dispatch priority.
          </p>

          {/* Primary WhatsApp Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-sans text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg group cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Send Order To WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full sm:w-auto bg-[#F9F8F6] hover:bg-foreground/5 border border-foreground/20 text-foreground font-sans text-xs uppercase tracking-[0.15em] font-bold py-4 px-5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-foreground/60" />
                  <span>Copy Details</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Detailed Order Breakdown & Bank Transfer Record */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Purchased Items (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Products Card */}
            <div className="bg-white border border-foreground/10 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-foreground/10">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <Package className="w-4 h-4 text-foreground/70" />
                  <span>Items Ordered ({orderData.items?.length || 0})</span>
                </h3>
                <span className="font-sans text-xs text-foreground/60 font-semibold">
                  Reference: #{orderData.orderId}
                </span>
              </div>

              {orderData.items && orderData.items.length > 0 ? (
                <div className="flex flex-col divide-y divide-foreground/10">
                  {orderData.items.map((item, idx) => (
                    <div key={idx} className="py-4 flex gap-4 items-center">
                      <div className="w-16 h-20 bg-[#F2EFEB] border border-foreground/10 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground/40 font-bold">
                            KLASIK
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-serif text-sm font-bold text-foreground leading-snug">
                          {item.title || item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-sans text-foreground/60 mt-1">
                          <span className="bg-foreground/5 px-1.5 py-0.5 border border-foreground/10 font-bold text-foreground">
                            Size: {item.size}
                          </span>
                          <span>&bull;</span>
                          <span>{item.color}</span>
                          <span>&bull;</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-sans text-sm font-bold text-foreground">
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-sans text-foreground/60 py-4">
                  Order registered with concierge records.
                </p>
              )}

              {/* Total Summary */}
              <div className="border-t border-foreground/10 pt-4 mt-2 flex flex-col gap-2 font-sans text-xs">
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(orderData.subtotal || orderData.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-foreground/70">
                  <span>Express Courier</span>
                  <span className="font-semibold text-foreground">
                    {orderData.isFreeShipping || orderData.shippingCost === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatPrice(orderData.shippingCost || 2500)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-foreground font-bold text-base pt-3 border-t border-foreground/10">
                  <span className="font-serif">Total Amount Paid</span>
                  <span className="font-serif text-xl">{formatPrice(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white border border-foreground/10 p-6 shadow-sm font-sans text-xs">
              <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2 mb-4 pb-3 border-b border-foreground/10">
                <MapPin className="w-4 h-4 text-foreground/70" />
                <span>Shipping & Recipient Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-foreground/50 uppercase tracking-wider text-[0.65rem] block mb-1">
                    Recipient Name
                  </span>
                  <strong className="text-foreground text-sm font-serif">
                    {orderData.customer?.name || 'Valued Customer'}
                  </strong>
                </div>

                <div>
                  <span className="text-foreground/50 uppercase tracking-wider text-[0.65rem] block mb-1">
                    Contact Phone
                  </span>
                  <span className="text-foreground font-semibold">
                    {orderData.customer?.phone || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-foreground/50 uppercase tracking-wider text-[0.65rem] block mb-1">
                    Email Address
                  </span>
                  <span className="text-foreground font-semibold truncate block">
                    {orderData.customer?.email || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-foreground/50 uppercase tracking-wider text-[0.65rem] block mb-1">
                    City / Region
                  </span>
                  <span className="text-foreground font-semibold">
                    {orderData.customer?.city || 'Lagos'}, Nigeria
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-foreground/10">
                <span className="text-foreground/50 uppercase tracking-wider text-[0.65rem] block mb-1">
                  Delivery Address
                </span>
                <p className="text-foreground/80 leading-relaxed">
                  {orderData.customer?.address || 'Standard Delivery Address'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Bank Details & Dispatch Steps (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Obsidian Bank Details Card */}
            <div className="bg-[#111111] text-[#F9F8F6] p-6 border border-neutral-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] font-bold text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Bank Transfer Receipt
                </span>
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 border border-emerald-500/30 font-bold">
                  VERIFIED
                </span>
              </div>

              <div className="bg-black/70 border border-white/15 p-4 mb-4 flex flex-col gap-2.5 font-sans text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50 uppercase text-[0.65rem]">Bank Name</span>
                  <span className="text-white font-bold">{orderData.bankDetails?.bankName || 'OPay / Paycom'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50 uppercase text-[0.65rem]">Account Name</span>
                  <span className="text-white font-bold">{orderData.bankDetails?.accountName || 'KLASIK WARDROBE'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-white/50 uppercase text-[0.65rem]">Account Number</span>
                  <span className="font-mono text-lg font-bold text-amber-300 tracking-wider">
                    {orderData.bankDetails?.accountNumber || '7075039738'}
                  </span>
                </div>
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs uppercase tracking-[0.18em] font-bold py-3.5 px-4 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm Payment On WhatsApp</span>
              </a>
            </div>

            {/* Next Steps Card */}
            <div className="bg-white border border-foreground/10 p-6 shadow-sm font-sans text-xs">
              <h4 className="font-serif text-sm font-bold text-foreground mb-4 pb-2 border-b border-foreground/10 uppercase tracking-wide">
                What Happens Next?
              </h4>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-foreground block">Transfer Verification</strong>
                    <span className="text-foreground/60 text-[0.75rem]">Our accounts desk confirms your bank payment within 15–30 minutes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-foreground block">Luxury Dust Packaging</strong>
                    <span className="text-foreground/60 text-[0.75rem]">Garments are inspected, ironed, and wrapped in matte-black protective packaging.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-foreground block">Express Courier Dispatch</strong>
                    <span className="text-foreground/60 text-[0.75rem]">You will receive delivery driver details and real-time tracking updates via SMS & WhatsApp.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-foreground/10">
                <Link 
                  href="/catalog" 
                  className="w-full bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold py-3.5 px-4 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Return to Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
