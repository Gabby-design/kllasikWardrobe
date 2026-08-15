import { KlasikLogo } from './KlasikLogo';
import Link from 'next/link';
import { Sparkles, MessageCircle, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0C] text-[#F9F8F6] pt-24 pb-12 px-4 sm:px-6 lg:px-8 mt-24 border-t border-white/10 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 relative z-10">
        
        {/* Brand & Manifesto Column (4 Cols) */}
        <div className="md:col-span-4 flex flex-col items-start">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity" aria-label="Klasik Wardrobe Home">
            <KlasikLogo height={46} className="w-auto" fill="#F9F8F6" />
          </Link>
          <p className="font-sans text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm mb-6">
            Nigeria&apos;s premier luxury streetwear house. Dedicated to heavyweight 240–300 GSM organic cotton and mulberry silk essentials engineered with intentional drop-shoulder silhouettes.
          </p>

          <div className="flex items-center gap-2 text-xs font-sans text-amber-400/90 bg-white/5 border border-white/10 px-3.5 py-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing: ₦30k, ₦35k, ₦40k</span>
          </div>
        </div>

        {/* Collections Links (2.5 Cols) */}
        <div className="md:col-span-2 sm:col-span-4 flex flex-col gap-4">
          <h4 className="font-serif text-sm tracking-[0.15em] uppercase font-bold text-white">
            Collections
          </h4>
          <div className="flex flex-col gap-3 font-sans text-xs text-white/60">
            <Link href="/catalog?category=Essential" className="hover:text-white transition-colors">
              Essential Tier &bull; ₦30,000
            </Link>
            <Link href="/catalog?category=Signature" className="hover:text-white transition-colors">
              Signature Tier &bull; ₦35,000
            </Link>
            <Link href="/catalog?category=Executive" className="hover:text-white transition-colors">
              Executive Tier &bull; ₦40,000
            </Link>
            <Link href="/catalog" className="hover:text-white transition-colors font-bold text-white/80">
              Full Archive Drop
            </Link>
          </div>
        </div>

        {/* Client Services & Policies (2.5 Cols) */}
        <div className="md:col-span-2 sm:col-span-4 flex flex-col gap-4">
          <h4 className="font-serif text-sm tracking-[0.15em] uppercase font-bold text-white">
            Client Services
          </h4>
          <div className="flex flex-col gap-3 font-sans text-xs text-white/60">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">
              Return & 7-Day Exchange
            </Link>
            <Link href="/checkout" className="hover:text-white transition-colors">
              Order Checkout
            </Link>
          </div>
        </div>

        {/* Concierge & VIP Access (3.5 Cols) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <h4 className="font-serif text-sm tracking-[0.15em] uppercase font-bold text-white">
            Concierge & Inquiries
          </h4>
          <p className="font-sans text-xs text-white/60 leading-relaxed">
            Headquartered in Victoria Island, Lagos. For private styling, bespoke orders, or instant order assistance:
          </p>

          <a 
            href={process.env.NEXT_PUBLIC_WHATSAPP_PHONE ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}` : "https://wa.me/2347075039738"} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-xs font-bold uppercase tracking-[0.15em] px-4 py-3 transition-all self-start"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Chat WhatsApp Concierge</span>
          </a>

          <span className="font-sans text-[0.7rem] text-white/40">
            Email: <a href="mailto:concierge@klasic.com" className="text-white/60 hover:text-white transition-colors">concierge@klasic.com</a>
          </span>
        </div>

      </div>

      {/* Copyright & Security Stamp */}
      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-white/40">
        <div>
          &copy; {new Date().getFullYear()} Klasik Wardrobe Nigeria. All rights reserved. Built with precision.
        </div>
        <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-wider">
          <span className="flex items-center gap-1 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured
          </span>
          <span>&bull;</span>
          <span>Lagos, Nigeria</span>
        </div>
      </div>

    </footer>
  );
}
