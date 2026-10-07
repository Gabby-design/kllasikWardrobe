"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Sparkles, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function ShopTheLook() {
  const { addToCart } = useCartStore();
  const [selectedLookIdx, setSelectedLookIdx] = useState(0);

  const lookItems = [
    {
      id: 'kwt-01',
      title: 'Klasik Never Heavyweight Noir',
      tag: 'Noir Edition',
      price: 30000,
      image: '/images/hero-tee-black.png',
      gsm: '240 GSM Combed Cotton',
      fit: 'Oversized Drop-Shoulder',
      desc: 'Deep obsidian black combed cotton with preshrunk double-layer ribbed collar.'
    },
    {
      id: 'kwt-02',
      title: 'Klasik Signature Heavyweight Purple',
      tag: 'Purple Edition',
      price: 35000,
      image: '/images/hero-tee-purple.png',
      gsm: '260 GSM Heavy Organic Cotton',
      fit: 'Structured Boxy Fit',
      desc: 'Rich royal purple heavyweight wash engineered for a clean structured boxy drape.'
    },
    {
      id: 'kwt-03',
      title: 'Klasik Executive Silk-Cotton White',
      tag: 'Silk Edition',
      price: 40000,
      image: '/images/hero-tee-white.png',
      gsm: '300 GSM Silk-Cotton Blend',
      fit: 'Tailored Luxury Fit',
      desc: 'Peruvian Pima and mulberry silk infusion with an ultra-soft cool handfeel.'
    }
  ];

  const currentLook = lookItems[selectedLookIdx];

  const handleAddLookItem = (item, e) => {
    if (e) e.stopPropagation();
    addToCart(item, 'L', 'Standard');
    toast.success(`Added ${item.title} to your bag!`);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
        <div>
          <span className="font-sans text-xs font-semibold text-[#7C3AED] flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Pairings
          </span>
          <h2 className="font-sans text-xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            Shop The Look
          </h2>
        </div>

        <Link 
          href="/catalog" 
          className="inline-flex items-center gap-1.5 font-sans text-xs sm:text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
        >
          <span>View full lookbook</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Featured Showcase Card - Rhymes with Hero Card (7 Cols) */}
        <div className="lg:col-span-7 relative rounded-[24px] overflow-hidden bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] text-white shadow-[0_8px_24px_rgba(17,17,17,0.06)] p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[380px] sm:min-h-[420px]">
          
          {/* Subtle Ambient Decorative Circles matching Hero */}
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#5B21B6]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Tag & Price Row */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="bg-[#111111] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs select-none">
              {currentLook.tag}
            </span>
            <span className="font-sans text-sm sm:text-base font-bold text-white bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
              ₦{currentLook.price.toLocaleString()}
            </span>
          </div>

          {/* Center: Cutout T-Shirt without background */}
          <div className="relative z-10 my-4 flex items-center justify-center">
            <div className="relative w-52 sm:w-68 md:w-80 aspect-square flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentLook.id}
                  src={currentLook.image} 
                  alt={currentLook.title} 
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)] select-none pointer-events-none" 
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Headline, Subtext & Black CTA Button matching Hero */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-white/15">
            <div className="max-w-md">
              <span className="font-sans text-[11px] font-semibold text-purple-200 block mb-0.5">
                {currentLook.gsm} • {currentLook.fit}
              </span>
              <h3 className="font-sans text-lg sm:text-xl font-bold leading-tight">
                {currentLook.title}
              </h3>
              <p className="font-sans text-xs text-purple-100/90 leading-relaxed mt-1 hidden sm:block">
                {currentLook.desc}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => handleAddLookItem(currentLook, e)}
              className="group inline-flex items-center gap-3 bg-[#111111] hover:bg-black text-white active:scale-95 pl-5 pr-2 py-2 rounded-full font-sans text-xs sm:text-sm font-semibold shadow-md transition-all self-start sm:self-end flex-shrink-0 cursor-pointer"
            >
              <span>Add To Bag</span>
              <span className="w-8 h-8 rounded-full bg-white text-[#111111] flex items-center justify-center transition-transform group-hover:rotate-45 duration-300">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>
          </div>

        </div>

        {/* Coordinated Pieces Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-gray-500">
              Select Colorway Look
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              3 Signature Cuts
            </span>
          </div>

          {lookItems.map((item, idx) => {
            const isSelected = selectedLookIdx === idx;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedLookIdx(idx)}
                className={`bg-white rounded-[24px] border p-3.5 sm:p-4 transition-all duration-300 flex gap-4 items-center cursor-pointer select-none ${
                  isSelected
                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-[0_12px_32px_rgba(124,58,237,0.12)]'
                    : 'border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] hover:border-[#EDE9FE] hover:-translate-y-0.5'
                }`}
              >
                {/* T-shirt without background in grey rounded box */}
                <div className="w-20 h-22 sm:w-22 sm:h-24 rounded-[16px] bg-[#EDEDEF] overflow-hidden flex-shrink-0 p-1.5 flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105" 
                  />
                </div>

                <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
                  <div>
                    <span className="font-sans text-[11px] text-gray-400 font-medium block leading-none">
                      {item.gsm}
                    </span>
                    <h4 className="font-sans text-xs sm:text-sm font-bold text-[#111111] leading-snug truncate mt-1">
                      {item.title}
                    </h4>
                    <div className="font-sans text-xs sm:text-sm font-bold text-[#111111] mt-1 mb-2">
                      ₦{item.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#EDE9FE] text-[#7C3AED]' : 'bg-[#EDEDEF] text-gray-500'
                    }`}>
                      {isSelected ? 'Active Preview' : 'Tap to Preview'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleAddLookItem(item, e)}
                      className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Guarantee Note */}
          <div className="p-3.5 bg-[#EDE9FE]/50 border border-[#EDE9FE] rounded-[20px] font-sans text-xs text-[#7C3AED] flex items-center justify-between">
            <span>Complimentary Express Courier on orders over ₦200,000</span>
            <span className="font-bold">Free Delivery</span>
          </div>

        </div>

      </div>

    </section>
  );
}
