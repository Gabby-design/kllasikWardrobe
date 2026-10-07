"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { KlasikLogo } from './KlasikLogo';
import { useCartStore } from '../store/cartStore';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingBag, Sparkles, X, Ruler, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar({ searchQuery = '', setSearchQuery, setIsSizeGuideOpen }) {
  const { cartItemCount, setIsCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPhoneSearchOpen, setIsPhoneSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemCount = mounted ? cartItemCount() : 0;

  const handleFilterClick = () => {
    if (pathname === '/') {
      const el = document.getElementById('categories-section') || document.getElementById('catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    router.push('/catalog');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      
      {/* 1. Slim Announcement Bar with Purple Accent */}
      <div className="bg-[#7C3AED] text-white px-4 py-1 text-center text-[10px] sm:text-xs font-medium tracking-normal flex items-center justify-center gap-1.5 select-none">
        <Sparkles className="w-3 h-3 text-purple-200 hidden sm:inline" />
        <span>Complimentary express delivery across Nigeria on orders over ₦200,000</span>
        <Sparkles className="w-3 h-3 text-purple-200 hidden sm:inline" />
      </div>

      {/* 2. Main Sticky White Header with Soft Shadow */}
      <div className={`w-full bg-white/95 backdrop-blur-md border-b border-black/[0.04] transition-all duration-300 ${
        isScrolled ? 'shadow-[0_8px_24px_rgba(17,17,17,0.06)] py-2' : 'shadow-[0_4px_20px_rgba(17,17,17,0.04)] py-2.5 sm:py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="hover:opacity-90 transition-opacity flex items-center" aria-label="Kllasik Wardrobe Home">
                <KlasikLogo height={isScrolled ? 30 : 34} className="transition-all duration-300" />
              </Link>
            </div>

            {/* Center: Desktop Pill-shaped Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-[#F7F7F8] p-1 rounded-full border border-black/[0.04]">
              <Link 
                href="/" 
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname === '/' || pathname === '/catalog'
                    ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-xs' 
                    : 'text-[#111111]/70 hover:text-[#7C3AED]'
                }`}
              >
                Collection
              </Link>
              <button 
                type="button"
                onClick={() => setIsSizeGuideOpen && setIsSizeGuideOpen(true)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#111111]/70 hover:text-[#7C3AED] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5 opacity-70" />
                <span>Size Guide</span>
              </button>
            </nav>

            {/* Right: Search Bar & Round Bag Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Desktop / Tablet Rounded Pill Search Bar */}
              <div className="hidden sm:flex items-center bg-[#EDEDEF] hover:bg-[#E5E5E8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7C3AED]/20 border border-transparent focus-within:border-[#EDE9FE] rounded-full px-3.5 py-1.5 transition-all w-48 md:w-60 lg:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none text-xs font-sans text-[#111111] placeholder:text-gray-400"
                  placeholder="Search essentials..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery && setSearchQuery('')}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFilterClick}
                  className="w-6 h-6 rounded-full bg-white hover:bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer shadow-xs"
                  title="Filter Categories"
                  aria-label="Filter Categories"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </div>

              {/* Phone Search Trigger (Toggles expandable search bar) */}
              <button
                type="button"
                className="sm:hidden w-10 h-10 rounded-full bg-[#EDEDEF] hover:bg-[#EDE9FE] text-[#111111] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                onClick={() => setIsPhoneSearchOpen(!isPhoneSearchOpen)}
                aria-label="Toggle Search"
              >
                {isPhoneSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>

              {/* Round Bag Button with Purple Count Badge */}
              <button 
                type="button"
                className="relative w-10 h-10 rounded-full bg-[#EDEDEF] hover:bg-[#EDE9FE] text-[#111111] hover:text-[#7C3AED] flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-xs" 
                onClick={() => setIsCartOpen(true)}
                aria-label="View Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-xs">
                    {itemCount}
                  </span>
                )}
              </button>

            </div>

          </div>

          {/* Expandable Phone Search Bar */}
          <AnimatePresence>
            {isPhoneSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="sm:hidden pt-2.5 pb-1 overflow-hidden"
              >
                <div className="flex items-center bg-[#EDEDEF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7C3AED]/20 border border-transparent focus-within:border-[#EDE9FE] rounded-full px-4 py-2 transition-all">
                  <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-xs font-sans text-[#111111] placeholder:text-gray-400"
                    placeholder="Search heavyweight essentials..."
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery && setSearchQuery('')}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleFilterClick}
                    className="w-7 h-7 rounded-full bg-white text-[#7C3AED] flex items-center justify-center transition-colors flex-shrink-0 ml-1.5 shadow-xs cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </header>
  );
}
