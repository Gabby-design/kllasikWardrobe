"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, X, Sparkles, CheckCircle2 } from 'lucide-react';

export function SizeGuideModal({
  isSizeGuideOpen,
  setIsSizeGuideOpen
}) {
  if (!isSizeGuideOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-md p-4 sm:p-6" 
        onClick={() => setIsSizeGuideOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#F9F8F6] border border-foreground/15 shadow-2xl p-6 sm:p-10 overflow-y-auto max-h-[90vh] custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white border border-foreground/15 text-foreground font-sans text-lg hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer shadow-sm" 
            onClick={() => setIsSizeGuideOpen(false)}
            aria-label="Close size guide"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-amber-700" />
            <span className="font-sans text-[0.65rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
              Fitting Architecture
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Klasik Silhouette Measurements
          </h2>
          
          <p className="font-sans text-xs sm:text-sm text-foreground/70 leading-relaxed mb-6">
            All Klasik pieces are constructed with an intentional oversized dropped-shoulder drape. Stay true to size for a relaxed luxury streetwear fit, or size down for a more structured tailored silhouette.
          </p>

          {/* Sizing Matrix Table */}
          <div className="bg-white border border-foreground/10 overflow-hidden shadow-sm mb-6">
            <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-foreground text-background font-sans text-[0.65rem] sm:text-xs uppercase tracking-[0.15em] font-bold">
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Chest (Inches)</th>
                  <th className="py-3.5 px-4">Length (Inches)</th>
                  <th className="py-3.5 px-4">Shoulder Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10 text-foreground/80 font-sans">
                <tr className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">S</td>
                  <td className="py-3.5 px-4">40&quot; &ndash; 42&quot;</td>
                  <td className="py-3.5 px-4">28.5&quot;</td>
                  <td className="py-3.5 px-4 text-amber-800 font-medium">2.0&quot; Drop</td>
                </tr>
                <tr className="hover:bg-foreground/[0.02] transition-colors bg-foreground/[0.01]">
                  <td className="py-3.5 px-4 font-bold text-foreground">M</td>
                  <td className="py-3.5 px-4">43&quot; &ndash; 45&quot;</td>
                  <td className="py-3.5 px-4">29.5&quot;</td>
                  <td className="py-3.5 px-4 text-amber-800 font-medium">2.2&quot; Drop</td>
                </tr>
                <tr className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">L</td>
                  <td className="py-3.5 px-4">46&quot; &ndash; 48&quot;</td>
                  <td className="py-3.5 px-4">30.5&quot;</td>
                  <td className="py-3.5 px-4 text-amber-800 font-medium">2.5&quot; Drop</td>
                </tr>
                <tr className="hover:bg-foreground/[0.02] transition-colors bg-foreground/[0.01]">
                  <td className="py-3.5 px-4 font-bold text-foreground">XL</td>
                  <td className="py-3.5 px-4">49&quot; &ndash; 51&quot;</td>
                  <td className="py-3.5 px-4">31.5&quot;</td>
                  <td className="py-3.5 px-4 text-amber-800 font-medium">2.8&quot; Drop</td>
                </tr>
                <tr className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">XXL</td>
                  <td className="py-3.5 px-4">52&quot; &ndash; 54&quot;</td>
                  <td className="py-3.5 px-4">32.5&quot;</td>
                  <td className="py-3.5 px-4 text-amber-800 font-medium">3.0&quot; Drop</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fitting Advice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-foreground/70">
            <div className="p-3.5 bg-white border border-foreground/10 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Oversized Drape:</strong>
                <span>Order your regular size for classic streetwear proportion.</span>
              </div>
            </div>
            <div className="p-3.5 bg-white border border-foreground/10 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Tailored Fit:</strong>
                <span>Size down by one size for a closer silhouette.</span>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
