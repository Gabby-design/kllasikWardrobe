import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import heroTshirt from '../assets/hero-tshirt-blank.png';

export function Hero() {
  const heroRef = useRef(null);
  
  const { scrollY, scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Scale mapping for the shirt, starting larger to feel closer
  const heroScale = useTransform(scrollY, [0, 800], [1.2, 1.5]);
  
  // Parallax sway mapping based on section scroll progress
  const rotateY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [5, -5]);

  // Star rotation mapping
  const starRotate = useTransform(scrollY, [0, 1000], [0, 360]);

  return (
    <section 
      ref={heroRef} 
      className="relative w-full h-[90vh] overflow-hidden bg-background flex items-center justify-center pt-16" 
      style={{ isolation: 'isolate' }}
    >
      {/* Subtle Ambient Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

      {/* 3D Perspective Wrapper for T-Shirt */}
      <div 
        className="relative w-full max-w-3xl aspect-square flex items-center justify-center z-10"
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
        
        {/* Static Ultra-Diffused Contact Shadow on the Ground */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-3/5 h-16 bg-black/20 blur-3xl rounded-[100%] z-0 pointer-events-none" />
      </div>

      {/* Rotating 4-Point Star */}
      <motion.div
        className="absolute top-1/4 right-8 sm:right-12 md:right-32 z-20 text-foreground pointer-events-none"
        style={{ rotate: starRotate }}
      >
        <svg width="80" height="80" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 C50 30 70 50 100 50 C70 50 50 70 50 100 C50 70 30 50 0 50 C30 50 50 30 50 0 Z" />
        </svg>
      </motion.div>

      {/* Mix-Blend Text Overlay */}
      <div className="absolute bottom-12 left-6 md:bottom-20 md:left-20 z-50 text-left text-white mix-blend-difference max-w-2xl pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[clamp(3rem,7vw,6.5rem)] font-bold tracking-[-0.05em] leading-[0.9] mb-6"
        >
          Defined by details.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="font-sans text-[0.9rem] tracking-[0.25em] uppercase font-medium"
        >
          Elevated essentials crafted from premium heavyweight cotton and silk blends.
        </motion.p>
      </div>
    </section>
  );
}
