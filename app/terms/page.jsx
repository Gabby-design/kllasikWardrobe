import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Klasik Wardrobe',
  description: 'Terms of service and customer conditions for Klasik Wardrobe.',
};

export default function TermsPage() {
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
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.2em] font-bold text-foreground/50">
              Customer Agreement
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-8 text-foreground tracking-tight">
            Terms of Service
          </h1>
          
          <div className="font-sans text-xs sm:text-sm text-foreground/80 space-y-6 leading-relaxed">
            <p>
              Welcome to Klasik Wardrobe. By accessing our platform and placing orders for our heavyweight luxury streetwear pieces, you agree to the following terms and conditions.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">1. Authenticity & Material Integrity</h2>
            <p>
              All Klasik pieces are guaranteed 100% authentic, constructed from combed organic cotton and mulberry silk blends. Fixed transparent pricing is maintained at ₦30,000 (Essential), ₦35,000 (Signature), and ₦40,000 (Executive).
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">2. Order Fulfillment & Bank Transfers</h2>
            <p>
              Orders placed via Direct Bank Transfer are reserved upon checkout and processed once the transaction confirmation is matched by our accounts concierge team.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">3. Nationwide Delivery</h2>
            <p>
              Express delivery timelines vary by city (24–48 hours for Lagos, 2–4 business days for other states across Nigeria). Orders exceeding ₦70,000 qualify for complimentary insured shipping.
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
