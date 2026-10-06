"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, X, CheckCircle2 } from 'lucide-react';

export function SizeGuideModal({
  isSizeGuideOpen,
  setIsSizeGuideOpen
}) {
  useEffect(() => {
    if (isSizeGuideOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSizeGuideOpen]);

  if (!isSizeGuideOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex flex-col justify-start sm:justify-center items-center py-6 sm:py-10" 
        onClick={() => setIsSizeGuideOpen(false)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#F7F7F8] rounded-[24px] border border-black/[0.04] shadow-2xl p-6 sm:p-8 shrink-0 my-auto touch-pan-y"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-500 hover:text-[#111111] transition-all cursor-pointer shadow-xs border border-black/[0.04]" 
            onClick={() => setIsSizeGuideOpen(false)}
            aria-label="Close size guide"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <Ruler className="w-4 h-4 text-[#7C3AED]" />
            <span className="font-sans text-xs font-semibold text-[#7C3AED]">
              Fitting Architecture
            </span>
          </div>

          <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[#111111] mb-2">
            Klasik Silhouette Measurements
          </h2>
          
          <p className="font-sans text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
            All Klasik pieces are constructed with an intentional oversized dropped-shoulder drape. Stay true to size for a relaxed luxury streetwear fit, or size down for a more tailored silhouette.
          </p>

          {/* Sizing Matrix Table */}
          <div className="bg-white rounded-[20px] border border-black/[0.04] overflow-hidden shadow-[0_8px_24px_rgba(17,17,17,0.06)] mb-6">
            <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#EDEDEF] text-[#111111] font-sans text-xs font-bold">
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Chest (Inches)</th>
                  <th className="py-3 px-4">Length (Inches)</th>
                  <th className="py-3 px-4">Shoulder Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-gray-700 font-sans">
                <tr className="hover:bg-[#F7F7F8] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111111]">S</td>
                  <td className="py-3 px-4">40&quot; &ndash; 42&quot;</td>
                  <td className="py-3 px-4">28.5&quot;</td>
                  <td className="py-3 px-4 text-[#7C3AED] font-semibold">2.0&quot; Drop</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8] transition-colors bg-black/[0.01]">
                  <td className="py-3 px-4 font-bold text-[#111111]">M</td>
                  <td className="py-3 px-4">43&quot; &ndash; 45&quot;</td>
                  <td className="py-3 px-4">29.5&quot;</td>
                  <td className="py-3 px-4 text-[#7C3AED] font-semibold">2.2&quot; Drop</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111111]">L</td>
                  <td className="py-3 px-4">46&quot; &ndash; 48&quot;</td>
                  <td className="py-3 px-4">30.5&quot;</td>
                  <td className="py-3 px-4 text-[#7C3AED] font-semibold">2.5&quot; Drop</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8] transition-colors bg-black/[0.01]">
                  <td className="py-3 px-4 font-bold text-[#111111]">XL</td>
                  <td className="py-3 px-4">49&quot; &ndash; 51&quot;</td>
                  <td className="py-3 px-4">31.5&quot;</td>
                  <td className="py-3 px-4 text-[#7C3AED] font-semibold">2.8&quot; Drop</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#111111]">XXL</td>
                  <td className="py-3 px-4">52&quot; &ndash; 54&quot;</td>
                  <td className="py-3 px-4">32.5&quot;</td>
                  <td className="py-3 px-4 text-[#7C3AED] font-semibold">3.0&quot; Drop</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fitting Advice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-gray-600">
            <div className="p-4 bg-white rounded-[16px] border border-black/[0.04] shadow-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#111111] block mb-0.5">Oversized Drape:</strong>
                <span>Order your regular size for standard streetwear proportion.</span>
              </div>
            </div>
            <div className="p-4 bg-white rounded-[16px] border border-black/[0.04] shadow-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#111111] block mb-0.5">Tailored Silhouette:</strong>
                <span>Size down by one size for a closer, cleaner drop.</span>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
