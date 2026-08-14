import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Klasik Wardrobe',
  description: 'Learn how Klasik Wardrobe protects your personal and order data.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.2em] font-bold text-foreground/50">
              Legal & Data Protection
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-8 text-foreground tracking-tight">
            Privacy Policy
          </h1>
          
          <div className="font-sans text-xs sm:text-sm text-foreground/80 space-y-6 leading-relaxed">
            <p>
              At Klasik Wardrobe, we take your privacy and data security seriously. This Privacy Policy describes how your personal information is collected, used, and protected when you browse or make a purchase from our store.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">1. Personal Information We Collect</h2>
            <p>
              When you visit or place an order, we collect specific details including your name, delivery address, phone number, and email address to process your shipment and send automated order invoices and dispatch notifications.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">2. How We Use Your Information</h2>
            <p>
              Your contact details are strictly used to fulfill your order, coordinate delivery through our insured Nigerian courier partners, and communicate updates about your order status. We do not sell or lease your personal information to third parties.
            </p>
            
            <h2 className="font-serif text-lg font-bold text-foreground mt-8 mb-2">3. Payment & Security</h2>
            <p>
              All customer transactions and direct transfer records are processed through secure 256-bit SSL encrypted channels.
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
