"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

export function BottomNav() {
  const pathname = usePathname();
  const { cartItemCount, setIsCartOpen } = useCartStore();
  const { wishlistItemCount, setIsWishlistOpen } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bagCount = mounted ? cartItemCount() : 0;
  const wishCount = mounted ? wishlistItemCount() : 0;

  const navItems = [
    { label: 'Collection', href: '/', icon: Layers },
    { label: 'Wishlist', href: '#wishlist', icon: Heart, isWishlist: true, badge: wishCount },
    { label: 'Bag', href: '#cart', icon: ShoppingBag, isCart: true, badge: bagCount },
  ];

  const handleWishlistClick = (e) => {
    e.preventDefault();
    setIsWishlistOpen(true);
  };

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto pointer-events-auto">
      <nav className="bg-white/95 backdrop-blur-md rounded-full border border-black/[0.04] shadow-[0_8px_30px_rgba(17,17,17,0.12)] p-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCart) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center p-2.5 text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
                aria-label="Open Shopping Bag"
              >
                <Icon className="w-5 h-5" />
                {bagCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#7C3AED] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {bagCount}
                  </span>
                )}
              </button>
            );
          }

          if (item.isWishlist) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={handleWishlistClick}
                className="relative flex items-center justify-center p-2.5 text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
                aria-label="View Favorites"
              >
                <Icon className="w-5 h-5" />
                {wishCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#7C3AED] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {wishCount}
                  </span>
                )}
              </button>
            );
          }

          if (isActive) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 bg-[#7C3AED] text-white px-3.5 py-2 rounded-full font-sans text-xs font-semibold shadow-xs transition-all"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-center p-2.5 text-gray-500 hover:text-[#7C3AED] transition-colors"
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
