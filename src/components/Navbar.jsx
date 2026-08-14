"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { KlasikLogo } from './KlasikLogo';
import { useCartStore } from '../store/cartStore';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Sparkles, Menu, X, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar({ searchQuery, setSearchQuery, setIsSizeGuideOpen }) {
  const { cartItemCount, setIsCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemCount = mounted ? cartItemCount() : 0;

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-[#121212] text-[#F9F8F6] px-4 py-2 text-center text-[10px] sm:text-xs font-sans font-medium tracking-[0.18em] uppercase flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-amber-400 hidden sm:inline" />
        <span>COMPLIMENTARY EXPRESS COURIER ACROSS NIGERIA ON ORDERS OVER ₦70,000</span>
        <Sparkles className="w-3 h-3 text-amber-400 hidden sm:inline" />
      </div>

      {/* Main Floating Header */}
      <header className={`w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#F9F8F6]/95 backdrop-blur-md shadow-sm border-b border-foreground/10 py-3' 
          : 'bg-[#F9F8F6]/90 backdrop-blur-sm border-b border-foreground/5 py-4'
      }`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo */}
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Klasik Wardrobe Home">
            <KlasikLogo height={isScrolled ? 38 : 44} className="fill-foreground transition-all duration-300" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-sans text-xs uppercase tracking-[0.18em] font-medium text-foreground">
            <Link 
              href="/" 
              className={`hover:opacity-60 transition-opacity py-1 relative ${
                pathname === '/' ? 'font-bold border-b-2 border-foreground' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              href="/catalog" 
              className={`hover:opacity-60 transition-opacity py-1 relative ${
                pathname === '/catalog' ? 'font-bold border-b-2 border-foreground' : ''
              }`}
            >
              Collection
            </Link>
            <button 
              onClick={() => setIsSizeGuideOpen && setIsSizeGuideOpen(true)}
              className="hover:opacity-60 transition-opacity flex items-center gap-1.5 cursor-pointer uppercase tracking-[0.18em]"
            >
              <Ruler className="w-3.5 h-3.5 opacity-60" />
              <span>Size Guide</span>
            </button>
          </nav>

          {/* Search Box & Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Desktop Search Input */}
            <div className="hidden lg:flex items-center bg-foreground/[0.03] border border-foreground/15 px-3.5 py-1.5 focus-within:border-foreground focus-within:bg-white transition-all w-60">
              <Search className="w-3.5 h-3.5 text-foreground/50 mr-2 shrink-0" />
              <input
                type="text"
                className="bg-transparent border-none outline-none text-xs w-full font-sans text-foreground placeholder:text-foreground/40"
                placeholder="Search heavyweight pieces..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery && setSearchQuery('')}
                  className="text-[10px] text-foreground/40 hover:text-foreground ml-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button 
              className="lg:hidden p-2 text-foreground hover:opacity-70 transition-opacity"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Bag Trigger */}
            <button 
              className="flex items-center gap-2 bg-foreground text-background px-3.5 py-2 hover:bg-neutral-800 transition-all font-sans text-xs uppercase tracking-[0.18em] font-semibold group cursor-pointer" 
              onClick={() => setIsCartOpen(true)}
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-background text-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {itemCount}
              </span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              className="md:hidden p-2 text-foreground hover:opacity-70 transition-opacity"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden px-4 pt-3 pb-2 border-t border-foreground/10 bg-background"
            >
              <div className="flex items-center bg-white border border-foreground/20 px-3 py-2">
                <Search className="w-4 h-4 text-foreground/50 mr-2" />
                <input
                  type="text"
                  className="bg-transparent border-none outline-none text-xs w-full font-sans text-foreground"
                  placeholder="Search pieces, fabrics, GSM..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-foreground/10 bg-background px-6 py-6 flex flex-col gap-4 font-sans text-sm uppercase tracking-[0.18em]"
            >
              <Link 
                href="/" 
                className="py-2 border-b border-foreground/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/catalog" 
                className="py-2 border-b border-foreground/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Full Collection
              </Link>
              <button 
                className="py-2 text-left flex items-center justify-between"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSizeGuideOpen && setIsSizeGuideOpen(true);
                }}
              >
                <span>Size Guide</span>
                <Ruler className="w-4 h-4 opacity-50" />
              </button>
              <Link 
                href="/checkout" 
                className="py-2 text-left font-bold text-amber-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Proceed to Checkout
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
