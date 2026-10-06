import { Navbar } from '../../src/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck, MessageCircle, Mail, Package, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Return & Exchange Policy | Klasik Wardrobe',
  description: '7-day hassle-free size exchange and satisfaction guarantee for Klasik Wardrobe luxury streetwear.',
};

export default function RefundPolicyPage() {
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3 border border-emerald-200">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Guaranteed Satisfaction &bull; 7-Day Window</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#111111] mb-2">
              Return & Exchange Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl">
              We engineer each Klasik piece to fit your silhouette flawlessly. If your piece does not meet your expectations or you need a different size, our concierge handles exchanges promptly.
            </p>
          </div>
          
          {/* Content Sections */}
          <div className="space-y-6">
            
            {/* Section 1 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  1. 7-Day Exchange Window
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                You have <strong>7 full days from the date of courier delivery</strong> to inspect your garments and request a size exchange. We want you completely satisfied with your drop-shoulder drape and fit.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  2. Garment Condition Requirements
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10 mb-3">
                To qualify for an exchange, garments must meet the following standard luxury conditions:
              </p>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-2 pl-10 list-disc list-inside">
                <li>Unworn, unwashed, and free of fragrances or alterations.</li>
                <li>Original fabric care tags and neck labels attached and unaltered.</li>
                <li>Returned inside the original luxury matte dust packaging.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  3. How to Initiate an Exchange
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10 mb-2">
                Initiating an exchange is straightforward:
              </p>
              <ol className="text-xs sm:text-sm text-gray-600 space-y-2 pl-10 list-decimal list-inside">
                <li>Message our VIP Concierge directly on WhatsApp or email <strong className="text-[#111111]">concierge@klasic.com</strong>.</li>
                <li>Provide your Order Reference (e.g., #KLASIK-XXXXXX) and your desired replacement size.</li>
                <li>Our dispatch team will schedule a courier pickup or swap at your location.</li>
              </ol>
            </div>

            {/* Section 4 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  4. Defective or Incorrect Items
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                In the rare instance of a craftsmanship defect or if the wrong piece/size is delivered, Klasik Wardrobe covers 100% of the return courier fees and expedites an immediate replacement at zero additional cost.
              </p>
            </div>

            {/* Section 5 */}
            <div className="bg-[#F7F7F8] rounded-[20px] p-5 sm:p-6 border border-black/[0.04]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#111111]">
                  5. Store Credit & Small-Batch Policy
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-10">
                Because our heavyweight collection pieces are produced in limited capsule drops, cash refunds are issued as store credit vouchers or direct size swaps when preferred sizes remain in stock.
              </p>
            </div>

            {/* Interactive WhatsApp Exchange CTA */}
            <div className="bg-[#ECFDF5] border border-emerald-200 rounded-[20px] p-6 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center mb-2 shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-emerald-950 mb-1">
                Need to swap sizes right now?
              </h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed mb-4">
                Chat directly with the store owner or concierge desk on WhatsApp for instant assistance.
              </p>
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-6 py-3 rounded-full transition-all active:scale-95 shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Start Exchange on WhatsApp</span>
              </a>
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
