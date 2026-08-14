import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Return & Exchange Policy | Klasik Wardrobe',
  description: '7-day hassle-free exchange policy for Klasik Wardrobe pieces.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-20">
        
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] font-semibold text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Store</span>
          </Link>
        </div>

        <div className="bg-white border border-foreground/10 p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-emerald-700" />
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
              Guaranteed Satisfaction
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-8 text-foreground tracking-tight">
            Return & 7-Day Exchange Policy
          </h1>
          
          <div className="font-sans text-xs sm:text-sm text-foreground/80 space-y-6 leading-relaxed">
            <p>
              We want every Klasik garment to fit your silhouette flawlessly. If your piece does not meet your expectations or you require a different size, we gladly accept returns and size exchanges within <strong>7 days of delivery</strong>.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">1. Exchange Conditions</h2>
            <p>
              Garments must remain unworn, unwashed, and in their original condition with all fabric care tags and luxury matte packaging intact.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">2. How to Initiate an Exchange</h2>
            <p>
              Contact our VIP concierge team directly via WhatsApp or email at <strong className="text-foreground">concierge@klasic.com</strong> with your order ID and the new desired size. Our team will schedule courier pickup and dispatch your replacement piece promptly.
            </p>

            <p className="mt-8 pt-8 border-t border-foreground/10 text-xs text-foreground/50">
              Last updated: {new Date().getFullYear()} &bull; Klasik Wardrobe Nigeria
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
