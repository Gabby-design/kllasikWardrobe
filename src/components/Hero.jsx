import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import heroTshirt from '../assets/hero-tshirt-blank.png';
import { ArrowDown, Sparkles, Shield, Truck } from 'lucide-react';

export function Hero() {
  const heroRef = useRef(null);
  
  const { scrollY, scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Scale and sway mapping
  const heroScale = useTransform(scrollY, [0, 800], [1.15, 1.45]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [6, -6]);
  const starRotate = useTransform(scrollY, [0, 1000], [0, 360]);

  return (
    <section 
      ref={heroRef} 
      className="relative w-full min-h-[92vh] overflow-hidden bg-[#F9F8F6] flex flex-col justify-between pt-28 pb-12 px-4 sm:px-6 lg:px-8" 
      style={{ isolation: 'isolate' }}
    >
      {/* Background Ambience & Fine Grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />
      
      {/* Rotating 4-Point Luxury Star Insignia */}
      <motion.div
        className="absolute top-32 right-6 md:right-24 z-20 text-foreground/80 pointer-events-none"
        style={{ rotate: starRotate }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 C50 30 70 50 100 50 C70 50 50 70 50 100 C50 70 30 50 0 50 C30 50 50 30 50 0 Z" />
        </svg>
      </motion.div>

      {/* Main Hero Center 3D Showcase */}
      <div className="relative flex-1 flex items-center justify-center my-auto">
        <div 
          className="relative w-full max-w-2xl aspect-square flex items-center justify-center z-10"
          style={{ perspective: '1200px' }}
        >
          <motion.img
            src={heroTshirt.src}
            alt="Klasik Heavyweight T-Shirt"
            style={{ 
              rotateY, 
              rotateX,
              scale: heroScale
            }}
            className="relative z-10 w-full h-full object-contain pointer-events-none mix-blend-multiply scale-110 drop-shadow-2xl"
          />
          
          {/* Diffused Luxury Ground Shadow */}
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-4/5 h-20 bg-black/25 blur-3xl rounded-[100%] z-0 pointer-events-none" />
        </div>
      </div>

      {/* Hero Bottom Editorial Content */}
      <div className="relative z-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        
        {/* Left Column: Manifesto Heading */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-foreground text-background text-[10px] font-sans font-bold uppercase tracking-[0.25em] mb-4">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Heavyweight Luxury &bull; 240–300 GSM
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] leading-[0.92] text-foreground mb-4">
              Defined by details. <br />
              <span className="italic font-normal font-serif text-foreground/80">Engineered to drape.</span>
            </h1>

            <p className="font-sans text-xs sm:text-sm tracking-[0.1em] text-foreground/70 uppercase max-w-xl leading-relaxed">
              Nigeria&apos;s premier heavyweight streetwear essentials. Crafted with combed organic cotton and mulberry silk blends with drop-shoulder silhouettes.
            </p>
          </motion.div>
        </div>

        {/* Right Column: Quick Collection Tiers & CTA */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-5">
          
          {/* Quick Collection Tiers Pills */}
          <div className="flex flex-wrap gap-2 font-sans text-xs">
            <a 
              href="#catalog"
              className="bg-white/90 hover:bg-foreground hover:text-background border border-foreground/15 px-3.5 py-2 transition-all duration-300 shadow-sm"
            >
              <strong className="font-bold">Essential</strong> &bull; ₦30,000
            </a>
            <a 
              href="#catalog"
              className="bg-white/90 hover:bg-foreground hover:text-background border border-foreground/15 px-3.5 py-2 transition-all duration-300 shadow-sm"
            >
              <strong className="font-bold">Signature</strong> &bull; ₦35,000
            </a>
            <a 
              href="#catalog"
              className="bg-white/90 hover:bg-foreground hover:text-background border border-foreground/15 px-3.5 py-2 transition-all duration-300 shadow-sm"
            >
              <strong className="font-bold">Executive</strong> &bull; ₦40,000
            </a>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link
              href="/catalog"
              className="w-full sm:w-auto bg-foreground text-background hover:bg-neutral-800 font-sans text-xs uppercase tracking-[0.2em] font-bold px-8 py-4 text-center transition-all duration-300 shadow-md"
            >
              Explore Collection
            </Link>

            <a
              href="#catalog"
              className="p-4 border border-foreground/20 hover:border-foreground hover:bg-foreground/5 transition-all text-foreground"
              aria-label="Scroll to catalog"
            >
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>

        </div>

      </div>

      {/* Bottom Features Strip */}
      <div className="mt-8 pt-6 border-t border-foreground/10 max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs text-foreground/70">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-foreground/80 shrink-0" />
          <span><strong>100% Organic Cotton:</strong> 240–300 GSM Preshrunk</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-foreground/80 shrink-0" />
          <span><strong>Lagos 24–48h Dispatch:</strong> Nationwide delivery</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-foreground/80 shrink-0" />
          <span><strong>Transparent Luxury:</strong> Fixed ₦30k, ₦35k, ₦40k</span>
        </div>
      </div>
    </section>
  );
}
