'use client';

import { useState } from 'react';
import { useCartStore } from '../../../src/store/cartStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Zap, Plus, Minus, ShieldCheck, Ruler, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddToCartSection({ product }) {
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setIsCartOpen } = useCartStore();
  const router = useRouter();

  const sizes = product.sizes || ['S', 'M', 'L', 'XL', 'XXL'];

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, product.colors?.[0]?.name || 'Standard');
    }
    toast.success(`Added ${quantity}x "${product.title}" (${selectedSize}) to bag`);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, product.colors?.[0]?.name || 'Standard');
    }
    setIsCartOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      
      {/* Size Selection */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            Select Size: <span className="font-black text-foreground">{selectedSize}</span>
          </h3>
          <span className="font-sans text-[0.7rem] uppercase tracking-wider text-foreground/50">
            True to Dropped Silhouette
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSize(s)}
              className={`w-12 h-12 border font-sans text-xs font-bold transition-all cursor-pointer ${
                selectedSize === s
                  ? 'border-foreground bg-foreground text-background shadow-md'
                  : 'border-foreground/20 text-foreground bg-white hover:border-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Quantity Controls */}
        <div className="flex items-center border border-foreground/20 bg-white px-2 py-3 justify-between sm:w-36">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-2 text-foreground/60 hover:text-foreground cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-sans text-xs font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="px-2 text-foreground/60 hover:text-foreground cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add To Bag CTA */}
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 bg-white text-foreground border border-foreground font-sans text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add To Bag</span>
        </button>

        {/* Buy Now CTA */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 bg-foreground text-background border border-foreground font-sans text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Instant Checkout</span>
        </button>
      </div>

    </div>
  );
}
