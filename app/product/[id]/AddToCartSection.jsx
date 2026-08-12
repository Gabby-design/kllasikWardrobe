'use client';

import { useState } from 'react';
import { useCartStore } from '../../../store/cartStore';
import toast from 'react-hot-toast';

export default function AddToCartSection({ product }) {
  const [selectedSize, setSelectedSize] = useState('L');
  const { addToCart } = useCartStore();
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleAdd = () => {
    addToCart(product, selectedSize, 'Standard');
    toast.success(`Added ${product.title} (${selectedSize}) to bag`);
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div>
        <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-[#1a1a1a] mb-3">
          Select Size
        </h3>
        <div className="flex flex-wrap gap-3">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`w-14 h-14 border ${
                selectedSize === s
                  ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#f8f8f8]'
                  : 'border-neutral-300 text-[#1a1a1a] hover:border-[#1a1a1a]'
              } flex items-center justify-center font-sans font-medium transition-colors`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleAdd}
        className="w-full bg-[#1a1a1a] text-[#f8f8f8] font-sans font-bold uppercase tracking-[0.2em] py-5 hover:bg-neutral-800 transition-colors"
      >
        Add To Bag
      </button>
    </div>
  );
}
