import { KlasikLogo } from './KlasikLogo';
import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#111111] text-[#F7F7F8] pt-16 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 mt-16 border-t border-white/[0.06] relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 mb-12 relative z-10">
        
        {/* Brand & Manifesto Column (4 Cols) */}
        <div className="md:col-span-4 flex flex-col items-start">
          <Link href="/" className="inline-block mb-4 hover:opacity-90 transition-opacity" aria-label="Klasik Wardrobe Home">
            <KlasikLogo height={34} className="w-auto" fill="#FFFFFF" />
          </Link>
          <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mb-4 font-normal">
            Nigeria&apos;s premier luxury streetwear house. Dedicated to heavyweight 240–300 GSM organic cotton and mulberry silk essentials engineered with intentional drop-shoulder silhouettes.
          </p>

          <div className="flex items-center gap-2 text-xs font-sans text-purple-200 bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Fixed Pricing: ₦30k, ₦35k, ₦40k</span>
          </div>
        </div>

        {/* Collections Links (2.5 Cols) */}
        <div className="md:col-span-2 sm:col-span-4 flex flex-col gap-2.5">
          <h4 className="font-sans text-xs font-bold text-white mb-1">
            Collections
          </h4>
          <div className="flex flex-col gap-2 font-sans text-xs text-gray-400">
            <Link href="/catalog?category=T-Shirts" className="hover:text-purple-300 transition-colors">
              Heavyweight T-Shirts
            </Link>
            <Link href="/catalog?category=Jeans" className="hover:text-purple-300 transition-colors">
              Luxury Denim Jeans
            </Link>
            <Link href="/catalog?category=Short+Jeans" className="hover:text-purple-300 transition-colors">
              Short Jeans &amp; Jorts
            </Link>
            <Link href="/catalog?category=Beach+Pants" className="hover:text-purple-300 transition-colors">
              Pure Linen Beach Pants
            </Link>
            <Link href="/catalog" className="hover:text-purple-300 transition-colors font-semibold text-gray-300">
              Full Archive Drop
            </Link>
          </div>
        </div>

        {/* Client Services & Policies (2.5 Cols) */}
        <div className="md:col-span-2 sm:col-span-4 flex flex-col gap-2.5">
          <h4 className="font-sans text-xs font-bold text-white mb-1">
            Client Services
          </h4>
          <div className="flex flex-col gap-2 font-sans text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-purple-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-purple-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="hover:text-purple-300 transition-colors">
              Return & Exchange
            </Link>
            <Link href="/checkout" className="hover:text-purple-300 transition-colors">
              Order Checkout
            </Link>
          </div>
        </div>

        {/* Concierge & VIP Access (4 Cols) */}
        <div className="md:col-span-4 flex flex-col gap-2.5">
          <h4 className="font-sans text-xs font-bold text-white mb-1">
            Concierge & Inquiries
          </h4>
          <p className="font-sans text-xs text-gray-400 leading-relaxed mb-1">
            Victoria Island, Lagos. For private styling, bespoke orders, or instant customer support:
          </p>

          <a 
            href={process.env.NEXT_PUBLIC_WHATSAPP_PHONE ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}` : "https://wa.me/2347075039738"} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-semibold px-4 py-2 rounded-full transition-all self-start active:scale-95 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp Concierge</span>
          </a>

          <span className="font-sans text-[11px] text-gray-500 mt-1">
            Email: <a href="mailto:concierge@klasic.com" className="text-gray-400 hover:text-white transition-colors">concierge@klasic.com</a>
          </span>
        </div>

      </div>

      {/* Copyright & Security Stamp */}
      <div className="max-w-7xl mx-auto border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs text-gray-500">
        <div>
          &copy; {new Date().getFullYear()} Klasik Wardrobe Nigeria. All rights reserved.
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured
          </span>
          <span>•</span>
          <span>Lagos, Nigeria</span>
        </div>
      </div>

    </footer>
  );
}
