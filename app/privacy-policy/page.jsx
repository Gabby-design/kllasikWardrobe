import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Database, Eye, Bell, MessageCircle, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Klasik Wardrobe',
  description: 'Learn how Klasik Wardrobe protects your personal and order data with 256-bit SSL security.',
};

export default function PrivacyPolicyPage() {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '2347075039738';

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-gray-500 hover:text-[#7C3AED] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Collection</span>
          </Link>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 sm:p-10 md:p-12 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          
          {/* Header Pill & Title */}
          <div className="mb-8 pb-6 border-b border-black/[0.04]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold mb-3 border border-[#DDD6FE]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal & Data Protection</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111] mb-2">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl">
              At Klasik Wardrobe, we respect your confidentiality. This policy outlines how your personal details, order credentials, and delivery information are safely collected, utilized, and safeguarded.
            </p>
          </div>
          
          {/* Content Sections */}
          <div className="space-y-6">
            
            {/* Section 1 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  1. Information We Collect
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                When you browse our archive or place an order, we collect essential fulfillment data including your full name, delivery address, destination city, phone number, and email address. This enables automated invoice generation, courier routing, and real-time dispatch updates.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  2. Purpose & Use of Data
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                Your information is exclusively utilized to process orders, coordinate fast delivery through our insured Nigerian logistics partners, and communicate updates regarding your garment transit. We never sell, lease, or monetize your personal information to third-party brokers.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  3. Payment Security & Encryption
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                All client transactions, web traffic, and transfer records are transmitted across 256-bit SSL encrypted communication channels. Bank transfer verifications are validated directly with licensed financial institutions.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  4. Notifications & Order Updates
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                We send transaction confirmations, delivery dispatches, and private collection releases via SMS, email, or direct WhatsApp. You may opt out of promotional announcements at any time with a single reply.
              </p>
            </div>

            {/* Concierge Assistance Card */}
            <div className="bg-[#EDE9FE]/40 rounded-[20px] p-5 sm:p-6 border border-[#DDD6FE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
              <div>
                <h3 className="text-sm font-bold text-[#111111] mb-1">
                  Have questions about your data?
                </h3>
                <p className="text-xs text-gray-600">
                  Our VIP Concierge is available to assist with data requests or inquiries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat Concierge</span>
                </a>
                <a
                  href="mailto:concierge@klasik.com"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#111111] text-xs font-bold px-4 py-2 rounded-full border border-black/[0.06] transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>Email Us</span>
                </a>
              </div>
            </div>

            {/* Last Updated Timestamp */}
            <div className="pt-6 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <span>Last updated: {new Date().getFullYear()} &bull; Klasik Wardrobe Nigeria</span>
              <span>Victoria Island, Lagos, Nigeria</span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
