'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../src/store/cartStore';
import { Navbar } from '../../src/components/Navbar';
import { CheckCircle2, Package, Truck, MessageCircle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Empty the cart as soon as the success page loads
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212] flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-36 pb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-xl mx-auto w-full bg-white border border-foreground/10 p-8 sm:p-12 shadow-xl"
        >
          {/* Success Check Badge */}
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 border border-emerald-200 inline-block mb-3">
            Order Successfully Placed
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-foreground">
            Thank You For Your Order
          </h1>

          <p className="font-sans text-xs sm:text-sm text-foreground/70 mb-8 leading-relaxed">
            Your luxury order record has been registered. Our concierge team is verifying your bank transfer and preparing your heavyweight pieces for dispatch.
          </p>

          {/* 3-Step Next Steps Breakdown */}
          <div className="bg-[#F9F8F6] border border-foreground/10 p-5 mb-8 text-left flex flex-col gap-4 font-sans text-xs">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-foreground block">Transfer Verification</strong>
                <span className="text-foreground/60 text-[0.75rem]">Our accounts team cross-references your transfer within 15–30 minutes.</span>
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
                <span className="text-foreground/60 text-[0.75rem]">You will receive delivery driver details and real-time tracking updates via SMS & email.</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/catalog" 
              className="flex-1 bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noreferrer"
              className="bg-white border border-foreground/20 text-foreground hover:bg-foreground/5 font-sans text-xs uppercase tracking-[0.15em] font-bold py-4 px-5 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
