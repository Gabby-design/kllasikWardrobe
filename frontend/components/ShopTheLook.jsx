import { motion } from 'framer-motion';
import { AvantGardeButton } from './Button';

export function ShopTheLook() {
  return (
    <>
      {/* Shop the Look Editorial Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-24 border-t border-foreground/10 flex flex-col md:flex-row gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 relative"
        >
          <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop" alt="Shop the look editorial" className="w-full h-[80vh] object-cover" />
          <div className="absolute -bottom-6 -right-6 md:-right-12 bg-background p-4 border border-foreground/10 shadow-sm z-10 font-serif text-lg tracking-[0.02em]">Look 01 — The Essential Utility</div>
        </motion.div>

        <div className="w-full md:w-1/2 flex flex-col gap-12 md:pl-10">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-[-0.05em] leading-[0.9]">Shop The Look</h2>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            viewport={{ once: true }}
            className="flex items-center gap-6 group"
          >
            <div className="w-32 h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop" alt="T-Shirt" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="font-serif text-xl tracking-[0.02em]">Essential 240 GSM Noir</h3>
              <span className="font-sans text-sm tracking-[0.1em] text-foreground/60">₦30,000</span>
              <AvantGardeButton className="self-start mt-2">Add to Bag</AvantGardeButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center gap-6 group md:ml-12"
          >
            <div className="w-32 h-40 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop" alt="Pants" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h3 className="font-serif text-xl tracking-[0.02em]">Executive Cotton-Silk</h3>
              <span className="font-sans text-sm tracking-[0.1em] text-foreground/60">₦40,000</span>
              <AvantGardeButton className="self-start mt-2">Add to Bag</AvantGardeButton>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
