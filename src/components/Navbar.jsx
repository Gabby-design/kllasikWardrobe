"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { KlasikLogo } from './KlasikLogo';
import { useCartStore } from '../store/cartStore';
import { usePathname } from 'next/navigation';

export function Navbar({ searchQuery, setSearchQuery, setIsSizeGuideOpen }) {
  const { cartItemCount, setIsCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="fixed top-0 w-full z-50 flex flex-col">
      {/* Top Announcement Bar */}
      <div className="bg-foreground text-background px-4 py-2 text-center text-xs font-medium tracking-[0.15em] uppercase">
        FREE COMPLIMENTARY EXPRESS DELIVERY ACROSS NIGERIA ON ORDERS OVER ₦70,000
      </div>

      {/* Header & Navigation */}
      <header className="w-full bg-background/90 backdrop-blur-md border-b border-foreground/10 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="" aria-label="Klasik Wardrobe Home">
            <KlasikLogo height={44} className="fill-foreground" />
          </Link>

          {/* Search Box */}
          <div className="hidden md:flex items-center border border-foreground/20 px-3 py-1.5 focus-within:border-foreground transition-colors w-64">
            <span className="text-sm mr-2 opacity-50">🔍</span>
            <input
              type="text"
              className="bg-transparent border-none outline-none text-sm w-full font-sans"
              placeholder="Search t-shirts, fabrics..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            />
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-6">
            <Link href="/catalog" className="text-xs uppercase tracking-[0.15em] font-medium hover:opacity-70 transition-opacity">
              Catalog
            </Link>

            <button className="text-xs uppercase tracking-[0.15em] font-medium hover:opacity-70 transition-opacity" onClick={() => setIsSizeGuideOpen && setIsSizeGuideOpen(true)}>
              Size Guide
            </button>
            <button className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium hover:opacity-70 transition-opacity" onClick={() => setIsCartOpen(true)}>
              <span>BAG</span>
              <span className="bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{mounted ? cartItemCount() : 0}</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
