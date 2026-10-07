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
  ExternalLink
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
    clearCart();
  }, [clearCart]);

  const orderData = isMounted && lastOrder ? lastOrder : {
    orderId: 'KLLASIK-RECEIPT',
    items: [],
    customer: { name: 'Customer', city: 'Lagos' },
    totalAmount: 0,
    subtotal: 0,
    shippingCost: 0,
    isFreeShipping: false,
    bankDetails: {
      bankName: 'OPay / Paycom',
      accountName: 'KLLASIK WARDROBE',
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
      toast.success('Order summary copied to clipboard!');
      setTimeout(() => setCopiedMsg(false), 2500);
    }
  };

  const formatPrice = (amt) => `₦${Number(amt || 0).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] flex flex-col font-sans pb-24 md:pb-16">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36">
        
        {/* Success Header Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center bg-white rounded-[24px] border border-black/[0.04] p-6 sm:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.06)] mb-8"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <span className="font-sans text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 inline-block mb-3">
            Order Confirmed &bull; Reference #{orderData.orderId}
          </span>

          <h1 className="font-sans text-2xl sm:text-4xl font-bold mb-2 tracking-tight text-[#111111]">
            {orderData.orderMethod === 'whatsapp' ? 'Thank You For Ordering via WhatsApp' : 'Thank You For Your Order'}
          </h1>

          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed mb-6">
            {orderData.orderMethod === 'whatsapp'
              ? 'Your order details, item sizes, and payment sum are prepared for the store owner. You can chat directly via WhatsApp below anytime.'
              : 'Your order has been registered in our system. Send a quick WhatsApp confirmation to our team with your transfer proof for instant priority packaging & dispatch.'}
          </p>

          {/* Primary WhatsApp Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-sans text-xs font-bold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Confirm on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="w-full sm:w-auto bg-[#EDEDEF] hover:bg-[#E5E5E8] active:scale-95 text-[#111111] font-sans text-xs font-bold py-3.5 px-5 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span>Copy Details</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Detailed Order Breakdown & Bank Transfer Record */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Purchased Items (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Products Card */}
            <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.04]">
                <h3 className="font-sans text-base font-bold text-[#111111] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#7C3AED]" />
                  <span>Items Ordered ({orderData.items?.length || 0})</span>
                </h3>
                <span className="text-xs text-gray-400 font-semibold">
                  Ref: #{orderData.orderId}
                </span>
              </div>

              {orderData.items && orderData.items.length > 0 ? (
                <div className="flex flex-col divide-y divide-black/[0.04]">
                  {orderData.items.map((item, idx) => (
                    <div key={idx} className="py-3.5 flex gap-3.5 items-center">
                      <div className="w-14 h-16 bg-[#EDEDEF] rounded-[12px] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-[8px]"
                          />
                        ) : (
                          <div className="text-[10px] text-gray-400 font-bold">
                            KLLASIK
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-xs sm:text-sm font-bold text-[#111111] truncate">
                          {item.title || item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                          <span className="bg-[#EDEDEF] px-1.5 py-0.5 rounded-[6px] font-bold text-[#111111]">
                            Size: {item.size}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{item.color}</span>
                          <span>&bull;</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-sans text-xs sm:text-sm font-bold text-[#111111]">
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-sans text-gray-500 py-4">
                  Order registered with concierge records.
                </p>
              )}

              {/* Total Summary */}
              <div className="border-t border-black/[0.04] pt-4 mt-2 flex flex-col gap-2 font-sans text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#111111]">{formatPrice(orderData.subtotal || orderData.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Express Courier</span>
                  <span className="font-semibold text-[#111111]">
                    {orderData.isFreeShipping || orderData.shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      formatPrice(orderData.shippingCost || 2500)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[#111111] font-bold text-sm pt-3 border-t border-black/[0.04]">
                  <span>Total Amount Paid</span>
                  <span className="text-lg text-[#7C3AED]">{formatPrice(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] font-sans text-xs">
              <h3 className="font-sans text-base font-bold text-[#111111] flex items-center gap-2 mb-4 pb-3 border-b border-black/[0.04]">
                <MapPin className="w-4 h-4 text-[#7C3AED]" />
                <span>Recipient & Shipping Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                    Recipient Name
                  </span>
                  <strong className="text-[#111111] text-xs sm:text-sm">
                    {orderData.customer?.name || 'Valued Customer'}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                    Phone Number
                  </span>
                  <span className="text-[#111111] font-semibold">
                    {orderData.customer?.phone || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                    Email Address
                  </span>
                  <span className="text-[#111111] font-semibold truncate block">
                    {orderData.customer?.email || 'Not Specified'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                    City / State
                  </span>
                  <span className="text-[#111111] font-semibold">
                    {orderData.customer?.city || 'Lagos'}, Nigeria
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.04]">
                <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">
                  Delivery Address
                </span>
                <p className="text-gray-700 leading-relaxed">
                  {orderData.customer?.address || 'Standard Delivery Address'}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Bank Details & Next Steps (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Bank Card */}
            <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-black/[0.04]">
                <span className="font-sans text-xs font-bold text-[#7C3AED] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Bank Transfer Reference
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  VERIFIED
                </span>
              </div>

              <div className="bg-[#F7F7F8] rounded-[16px] p-4 mb-4 flex flex-col gap-2 font-sans text-xs border border-black/[0.04]">
                <div className="flex justify-between border-b border-black/[0.04] pb-2">
                  <span className="text-gray-400">Bank</span>
                  <span className="font-bold text-[#111111]">{orderData.bankDetails?.bankName || 'OPay / Paycom'}</span>
                </div>
                <div className="flex justify-between border-b border-black/[0.04] pb-2">
                  <span className="text-gray-400">Account Name</span>
                  <span className="font-bold text-[#111111]">{orderData.bankDetails?.accountName || 'KLLASIK WARDROBE'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400">Account No.</span>
                  <span className="font-mono text-base font-bold text-[#7C3AED]">
                    {orderData.bankDetails?.accountNumber || '7075039738'}
                  </span>
                </div>
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-sans text-xs font-bold py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Confirm Payment on WhatsApp</span>
              </a>
            </div>

            {/* Next Steps Card */}
            <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] font-sans text-xs">
              <h4 className="font-bold text-sm text-[#111111] mb-4 pb-2 border-b border-black/[0.04]">
                What Happens Next?
              </h4>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-[#111111] block">Payment Verification</strong>
                    <span className="text-gray-500 text-[11px]">Accounts confirms your transfer within 15–30 minutes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-[#111111] block">Luxury Dust Packaging</strong>
                    <span className="text-gray-500 text-[11px]">Garments are inspected, steamed, and packed in luxury dust packaging.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-[#111111] block">Express Courier Dispatch</strong>
                    <span className="text-gray-500 text-[11px]">Courier dispatch info and tracking updates sent via SMS & WhatsApp.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/[0.04]">
                <Link 
                  href="/" 
                  className="w-full bg-[#111111] hover:bg-black text-white font-sans text-xs font-bold py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Return to Collection</span>
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
