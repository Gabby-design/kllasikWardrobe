import { motion } from 'framer-motion';

export function SizeGuideModal({
  isSizeGuideOpen,
  setIsSizeGuideOpen
}) {
  if (!isSizeGuideOpen) return null;
  return (
    <>
{/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={() => setIsSizeGuideOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-background border border-foreground/10 p-8 md:p-12 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-foreground font-sans text-xl hover:opacity-50 transition-opacity" onClick={() => setIsSizeGuideOpen(false)}>
              ✕
            </button>
            <h2 className="font-serif text-3xl font-bold tracking-[-0.02em] mb-3">
              Klassic Size Architecture
            </h2>
            <p className="font-sans text-sm text-foreground/70 leading-relaxed mb-8">
              Our t-shirts are tailored with an intentional oversized dropped-shoulder silhouette. Choose your exact size for a relaxed streetwear drape, or size down for a slim fit.
            </p>

            <table className="w-full text-left font-sans text-sm border-collapse">
              <thead>
                <tr className="border-b border-foreground/20 text-foreground/60 uppercase tracking-[0.1em] text-xs">
                  <th className="py-4 font-semibold">Size</th>
                  <th className="py-4 font-semibold">Chest (Inches)</th>
                  <th className="py-4 font-semibold">Length (Inches)</th>
                  <th className="py-4 font-semibold">Shoulder Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10 text-foreground/80">
                <tr className="hover:bg-foreground/5 transition-colors">
                  <td className="py-4 font-bold text-foreground">S</td>
                  <td className="py-4">40" - 42"</td>
                  <td className="py-4">28.5"</td>
                  <td className="py-4">2.0" Drop</td>
                </tr>
                <tr className="hover:bg-foreground/5 transition-colors">
                  <td className="py-4 font-bold text-foreground">M</td>
                  <td className="py-4">43" - 45"</td>
                  <td className="py-4">29.5"</td>
                  <td className="py-4">2.2" Drop</td>
                </tr>
                <tr className="hover:bg-foreground/5 transition-colors">
                  <td className="py-4 font-bold text-foreground">L</td>
                  <td className="py-4">46" - 48"</td>
                  <td className="py-4">30.5"</td>
                  <td className="py-4">2.5" Drop</td>
                </tr>
                <tr className="hover:bg-foreground/5 transition-colors">
                  <td className="py-4 font-bold text-foreground">XL</td>
                  <td className="py-4">49" - 51"</td>
                  <td className="py-4">31.5"</td>
                  <td className="py-4">2.8" Drop</td>
                </tr>
                <tr className="hover:bg-foreground/5 transition-colors">
                  <td className="py-4 font-bold text-foreground">XXL</td>
                  <td className="py-4">52" - 54"</td>
                  <td className="py-4">32.5"</td>
                  <td className="py-4">3.0" Drop</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>
      )}
    </>
  );
}
