'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../../../src/store/cartStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

export default function AddToCartSection({ product }) {
  const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
    ? product.sizes 
    : ['S', 'M', 'L', 'XL', 'XXL'];

  const [selectedSize, setSelectedSize] = useState(() => {
    return availableSizes.includes('L') ? 'L' : (availableSizes[0] || 'M');
  });
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setIsCartOpen } = useCartStore();

  useEffect(() => {
    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || 'M');
    }
  }, [product]);

  const totalPrice = (product.price || 0) * quantity;
  const formatPrice = (val) => `₦${Number(val || 0).toLocaleString('en-US')}`;

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, product.colors?.[0]?.name || 'Standard');
    }
    toast.success(`Added ${quantity}x "${product.title}" (${selectedSize}) to bag`);
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      
      {/* Size Selection */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="font-sans text-xs font-bold text-[#111111]">
            Select Size: <span className="text-[#7C3AED]">{selectedSize}</span>
          </h3>
          <span className="font-sans text-[11px] text-gray-400">
            True to Dropped Silhouette
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => {
            const isAvailable = availableSizes.includes(s);
            const isSelected = selectedSize === s && isAvailable;

            if (!isAvailable) {
              return (
                <span
                  key={s}
                  title={`${s} (Unavailable)`}
                  className="w-10 h-10 rounded-[12px] font-sans text-xs font-semibold bg-gray-100 text-gray-300 border border-black/[0.04] line-through cursor-not-allowed select-none opacity-40 flex items-center justify-center pointer-events-none"
                >
                  {s}
                </span>
              );
            }

            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`w-10 h-10 rounded-[12px] font-sans text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity Stepper in a Rounded Container */}
      <div className="flex items-center gap-4">
        <span className="font-sans text-xs font-bold text-[#111111]">Quantity:</span>
        <div className="flex items-center bg-[#EDEDEF] rounded-full px-3 py-1.5 gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#111111] cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-sans text-xs font-bold min-w-[16px] text-center text-[#111111]">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#111111] cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop Add to Cart Button */}
      <div className="hidden md:block pt-2">
        <button
          type="button"
          onClick={handleAdd}
          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-sm font-bold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Bag • {formatPrice(totalPrice)}</span>
        </button>
      </div>

      {/* Phone Sticky Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(17,17,17,0.15)] border border-black/[0.04] p-2 px-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium leading-none">Total price</span>
          <span className="text-sm font-bold text-[#111111] mt-0.5">{formatPrice(totalPrice)}</span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-full font-sans text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

    </div>
  );
}
