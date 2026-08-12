'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';

export default function SuccessPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Empty the cart as soon as the success page loads
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4 tracking-tight">Payment Successful</h1>
        <p className="font-sans text-foreground/70 mb-8 leading-relaxed">
          Thank you for your purchase. Your luxury pieces are being prepared and your receipt has been sent to your email.
        </p>
        <Link 
          href="/catalog" 
          className="inline-block bg-[#1a1a1a] text-[#f8f8f8] font-sans text-sm uppercase tracking-[0.2em] px-8 py-4 hover:bg-neutral-800 transition-all duration-500"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
