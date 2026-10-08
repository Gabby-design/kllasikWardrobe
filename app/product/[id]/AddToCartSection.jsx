'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../../../src/store/cartStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { decrementStoredProductStock } from '../../../src/utils/productSync';

export default function AddToCartSection({ 
  product, 
  selectedColor, 
  setSelectedColor, 
  onSelectImage, 
  onStockClaimed 
}) {
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

  const currentStock = product.stock !== undefined ? Number(product.stock) : 10;
  const isSoldOut = currentStock <= 0;
  const isLastPiece = currentStock === 1;

  const totalPrice = (product.price || 0) * quantity;
  const formatPrice = (val) => `₦${Number(val || 0).toLocaleString('en-US')}`;

  const handleAdd = () => {
    if (isSoldOut) {
      toast.error(
        `Sorry! "${product.title}" is already out of stock. It had 1 remaining a few minutes ago, but another customer just ordered it.`,
        { duration: 5000, id: `oos-attempt-${product.id}` }
      );
      return;
    }

    const colorToUse = selectedColor || product.colors?.[0]?.name || product.colors?.[0] || 'Standard';

    // If only 1 unit remains, immediately claim it and alert other users
    if (isLastPiece) {
      decrementStoredProductStock(product.id, 1, product);
      if (onStockClaimed) onStockClaimed();
      addToCart(product, selectedSize, colorToUse);
      toast.success(`You claimed the last remaining unit of "${product.title}" (${selectedSize})!`, { duration: 4500 });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, colorToUse);
    }
    toast.success(`Added ${quantity}x "${product.title}" (${selectedSize}) to bag`);
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      
      {/* Available Colors Selection */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="font-sans text-xs font-bold text-[#111111]">
              Available Color: <span className="text-[#7C3AED]">{selectedColor || product.colors[0]?.name || 'Standard'}</span>
            </h3>
            <span className="font-sans text-[11px] text-gray-400">
              Curated Pigment
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {product.colors.map((colorObj, idx) => {
              const cName = typeof colorObj === 'string' ? colorObj : (colorObj.name || `Color ${idx + 1}`);
              const cHex = typeof colorObj === 'string' ? '#111111' : (colorObj.hex || '#111111');
              const cImg = typeof colorObj === 'object' ? colorObj.image : null;
              const isSelected = (selectedColor || product.colors[0]?.name) === cName;

              return (
                <button
                  key={cName + idx}
                  type="button"
                  onClick={() => {
                    if (setSelectedColor) setSelectedColor(cName);
                    if (cImg && onSelectImage) onSelectImage(cImg);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-sans text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#7C3AED] bg-purple-50 text-[#7C3AED] font-bold shadow-xs ring-1 ring-[#7C3AED]'
                      : 'border-black/[0.08] bg-[#EDEDEF]/60 text-gray-700 hover:border-gray-300 hover:bg-[#EDEDEF]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: cHex }}
                  />
                  <span>{cName}</span>
                  {cImg && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" title="Includes linked photo angle" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
        <div className={`flex items-center bg-[#EDEDEF] rounded-full px-3 py-1.5 gap-3 ${isSoldOut ? 'opacity-40 pointer-events-none' : ''}`}>
          <button
            type="button"
            disabled={isSoldOut}
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
            disabled={isSoldOut}
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
          disabled={isSoldOut}
          onClick={handleAdd}
          className={`w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-sm font-bold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer ${
            isSoldOut ? 'opacity-50 cursor-not-allowed pointer-events-none bg-gray-400 hover:bg-gray-400' : ''
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {isSoldOut 
              ? 'Sold Out' 
              : isLastPiece 
              ? `Claim Last Piece • ${formatPrice(totalPrice)}` 
              : `Add to Bag • ${formatPrice(totalPrice)}`}
          </span>
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
          disabled={isSoldOut}
          onClick={handleAdd}
          className={`bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-full font-sans text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
            isSoldOut ? 'opacity-50 cursor-not-allowed pointer-events-none bg-gray-400' : ''
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isSoldOut ? 'Sold Out' : (isLastPiece ? 'Claim Last Unit' : 'Add to Cart')}</span>
        </button>
      </div>

    </div>
  );
}
