"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const slides = [
    {
      tag: 'Heavyweight T-Shirts',
      headline: 'Defined by details.',
      subtext: 'Heavyweight 240–300 GSM organic cotton essentials engineered for effortless drape and permanence.',
      cta: 'Shop T-Shirts',
      href: '/catalog?category=T-Shirts',
      image: '/images/hero-tee-black.png',
      alt: 'Klasik Heavyweight Black Tee',
    },
    {
      tag: 'Luxury Denim & Jorts',
      headline: 'Substance over hype.',
      subtext: '14.5oz shuttle-loom Japanese selvedge denim and vintage cutoff jorts tailored for a clean streetwear silhouette.',
      cta: 'Explore Denim',
      href: '/catalog?category=Jeans',
      image: '/images/jeans-raw-indigo.jpg',
      alt: 'Klasik Raw Indigo Selvedge Denim',
    },
    {
      tag: 'Pure European Linen',
      headline: 'Effortless coastal drape.',
      subtext: '240 GSM breathable European flax linen beach pants with braided drawstring waist and wide-leg flow.',
      cta: 'Shop Beach Pants',
      href: '/catalog?category=Beach+Pants',
      image: '/images/beach-pants-linen.jpg',
      alt: 'Klasik Pure Linen Beach Pants',
    }
  ];

  // Auto-slide every 5 seconds (5000ms)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDirection(1);
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSlide, slides.length]);

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setDirection(1);
        setActiveSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
  };

  const handleManualSlide = (targetIdx) => {
    setDirection(targetIdx > activeSlide ? 1 : -1);
    setActiveSlide(targetIdx);
    resetTimer();
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    const { offset, velocity } = info;

    if (offset.x < -swipeThreshold || velocity.x < -400) {
      // Swiped left -> next slide
      setDirection(1);
      setActiveSlide((prev) => (prev + 1) % slides.length);
      resetTimer();
    } else if (offset.x > swipeThreshold || velocity.x > 400) {
      // Swiped right -> prev slide
      setDirection(-1);
      setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
      resetTimer();
    }
  };

  const current = slides[activeSlide];

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-4 sm:pb-6 select-none">
      <div className="max-w-7xl mx-auto">
        
        {/* Rounded Promo Banner Card with Drag / Swipe support */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
          className="relative rounded-[24px] overflow-hidden bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] text-white shadow-[0_8px_24px_rgba(17,17,17,0.06)] min-h-[320px] sm:min-h-[360px] md:min-h-[400px] flex items-center cursor-grab active:cursor-grabbing touch-pan-y"
        >
          
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#5B21B6]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Inner Grid: Side-by-side on tablet/desktop, cleanly stacked on mobile */}
          <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-12 items-center p-6 sm:p-10 md:p-12 lg:p-14 gap-6 sm:gap-8">
            
            {/* Left Column: Promo Details */}
            <div className="md:col-span-7 flex flex-col items-start justify-center max-w-xl pointer-events-auto">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${activeSlide}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-start"
                >
                  {/* Small Black "New Drop" Pill Tag */}
                  <span className="bg-[#111111] text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-3.5 shadow-xs select-none">
                    {current.tag}
                  </span>

                  {/* Headline: Sentence Case, 600-700 Weight, Normal Tracking */}
                  <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-2.5 sm:mb-3">
                    {current.headline}
                  </h1>

                  {/* Subtext in Normal Case */}
                  <p className="font-sans text-xs sm:text-sm lg:text-base text-purple-100/95 leading-relaxed font-normal mb-5 sm:mb-6 max-w-md">
                    {current.subtext}
                  </p>

                  {/* Black "Shop Now" Pill Button with Circular White Arrow Icon */}
                  <Link
                    href={current.href}
                    className="group inline-flex items-center gap-3 bg-[#111111] hover:bg-black text-white active:scale-95 pl-5 pr-2 py-2 rounded-full font-sans text-xs sm:text-sm font-semibold shadow-md transition-all duration-300"
                  >
                    <span>{current.cta}</span>
                    <span className="w-8 h-8 rounded-full bg-white text-[#111111] flex items-center justify-center transition-transform group-hover:rotate-45 duration-300">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </Link>
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Right Column: T-Shirt Visual (Guaranteed Zero Overlap) */}
            <div className="md:col-span-5 flex items-center justify-center relative pointer-events-none">
              <div className="relative w-44 sm:w-60 md:w-72 lg:w-84 aspect-square flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`img-${activeSlide}`}
                    src={current.image}
                    alt={current.alt}
                    initial={{ opacity: 0, scale: 0.9, x: direction * 25 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: direction * -25 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.3)] select-none"
                  />
                </AnimatePresence>
              </div>
            </div>

          </div>

        </motion.div>

        {/* Carousel Dots Below Card ONLY - No Next/Prev buttons */}
        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-5">
          {slides.map((_, idx) => {
            const isActive = activeSlide === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleManualSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 h-2 bg-[#7C3AED] rounded-full'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400 rounded-full'
                }`}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
}
