import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, FileText, Sparkles, CreditCard, Truck, RefreshCw, ShieldCheck, MessageCircle, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Kllasik Wardrobe',
  description: 'Terms of service, purchasing conditions, and delivery guidelines for Kllasik Wardrobe.',
};

export default function TermsPage() {
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
              <FileText className="w-3.5 h-3.5" />
              <span>Customer Agreement</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111] mb-2">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl">
              Welcome to Kllasik Wardrobe. By accessing our platform, placing orders, and acquiring our luxury heavyweight streetwear pieces, you agree to the conditions detailed below.
            </p>
          </div>
          
          {/* Content Sections */}
          <div className="space-y-6">
            
            {/* Section 1 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  1. Authenticity & Material Integrity
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10 mb-2">
                Every Kllasik garment is constructed from 240–300 GSM combed organic cotton and mulberry silk blends engineered with custom drop-shoulder cuts.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                Transparent fixed tier pricing is strictly maintained at ₦30,000 (Essential), ₦35,000 (Signature), and ₦40,000 (Executive). No hidden charges or arbitrary markups apply.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  2. Order Fulfillment & Bank Transfers
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                Orders initiated via WhatsApp or our Direct Bank Transfer checkout are reserved immediately. Production and dispatch proceed once transfer proof is verified by our accounts concierge team (typically within 15–30 minutes during business hours).
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  3. Nationwide Delivery & Complimentary Shipping
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10 mb-2">
                Express deliveries operate across all 36 states in Nigeria. Lagos orders arrive in 24–48 hours, while interstate shipments arrive in 2–4 business days via insured express courier.
              </p>
              <div className="ml-10 p-3 rounded-[14px] bg-[#EDE9FE] border border-[#DDD6FE] text-[#7C3AED] text-xs font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 flex-shrink-0" />
                <span>Orders totaling ₦200,000 and above qualify for 100% complimentary express delivery nationwide.</span>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  4. 7-Day Exchange Policy
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                To guarantee flawless silhouette fits, unworn garments with original packaging and tags can be exchanged for alternate sizes within 7 days of delivery.
              </p>
            </div>

            {/* Concierge Assistance Card */}
            <div className="bg-[#EDE9FE]/40 rounded-[20px] p-5 sm:p-6 border border-[#DDD6FE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
              <div>
                <h3 className="text-sm font-bold text-[#111111] mb-1">
                  Questions regarding our terms?
                </h3>
                <p className="text-xs text-gray-600">
                  Contact our concierge desk for order assistance or special fulfillment requests.
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
                  href="mailto:concierge@klasic.com"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#111111] text-xs font-bold px-4 py-2 rounded-full border border-black/[0.06] transition-all"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>Email Us</span>
                </a>
              </div>
            </div>

            {/* Last Updated Timestamp */}
            <div className="pt-6 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <span>Last updated: {new Date().getFullYear()} &bull; Kllasik Wardrobe Nigeria</span>
              <span>Victoria Island, Lagos, Nigeria</span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
