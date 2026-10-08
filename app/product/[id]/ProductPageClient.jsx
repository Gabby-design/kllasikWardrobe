'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ShieldCheck, Truck, Package } from 'lucide-react';
import AddToCartSection from './AddToCartSection';
import ProductGallerySlider from './ProductGallerySlider';
import { Navbar } from '../../../src/components/Navbar';
import { CartDrawer } from '../../../src/components/CartDrawer';
import { getSingleStoredProduct, getStoredRemovedProductIds, subscribeToProductChanges } from '../../../src/utils/productSync';

export default function ProductPageClient({ initialProduct }) {
  const [product, setProduct] = useState(initialProduct);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    function syncProduct() {
      if (!initialProduct?.id) return;
      const removedIds = getStoredRemovedProductIds();
      if (removedIds.includes(initialProduct.id)) {
        setIsRemoved(true);
        return;
      }

      const stored = getSingleStoredProduct(initialProduct.id);
      if (stored) {
        setProduct({
          ...initialProduct,
          ...stored,
          gallery: Array.isArray(stored.gallery) && stored.gallery.length > 0
            ? stored.gallery
            : (stored.image ? [stored.image] : initialProduct.gallery)
        });
      }
    }

    syncProduct();

    const unsubscribe = subscribeToProductChanges(() => {
      syncProduct();
    });

    return () => unsubscribe();
  }, [initialProduct]);

  if (isRemoved) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] text-[#111111] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-36 text-center">
          <div className="bg-white rounded-[24px] p-8 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
            <h1 className="text-2xl font-bold mb-2">Item No Longer in Collection</h1>
            <p className="text-sm text-gray-500 mb-6">
              This piece has been removed or updated in the archive.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-full transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Collection</span>
            </Link>
          </div>
        </main>
        <CartDrawer />
      </div>
    );
  }

  const gallery = product.gallery && product.gallery.filter(Boolean).length > 0 
    ? product.gallery.filter(Boolean) 
    : [product.image];

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] flex flex-col pb-24 md:pb-12">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-gray-500 hover:text-[#7C3AED] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Collection</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Large Rounded Image Showcase (Slideable with hand, dots only, no buttons or scrollbar) */}
          <div className="lg:col-span-6">
            <ProductGallerySlider 
              gallery={gallery} 
              title={product.title} 
              tag={product.tag} 
            />
          </div>

          {/* Right Column: Garment Specs & Ordering Hub (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col bg-white rounded-[24px] border border-black/[0.04] p-6 sm:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
            
            {/* Small Grey Category Label */}
            <span className="font-sans text-xs text-gray-400 font-medium block mb-1">
              {product.category || 'Essential'} Collection
            </span>

            {/* Bold Title */}
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#111111] leading-tight mb-2">
              {product.title}
            </h1>

            {/* Brand Row: "Klasik Wardrobe" with verified tick and Following pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-sans text-xs sm:text-sm font-semibold text-[#111111]">
                Klasik Wardrobe
              </span>
              <CheckCircle className="w-4 h-4 fill-[#7C3AED] text-white" />
              <span className="bg-[#111111] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full select-none">
                Following
              </span>
            </div>

            {/* Price & Stock Indicator */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="text-2xl sm:text-3xl font-bold text-[#111111]">
                ₦{Number(product.price).toLocaleString()}
              </div>

              {product.stock === 1 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Only 1 remaining — order soon</span>
                </span>
              ) : product.stock !== undefined && product.stock > 1 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{product.stock} available in stock</span>
                </span>
              ) : product.stock === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 border border-black/[0.04] px-3 py-1 rounded-full">
                  <span>Sold Out</span>
                </span>
              ) : null}
            </div>
            
            {/* Description */}
            <p className="font-sans text-gray-600 leading-relaxed text-xs sm:text-sm mb-6 pb-6 border-b border-black/[0.04]">
              {product.description}
            </p>

            {/* Fabric Specifications Matrix */}
            <div className="grid grid-cols-3 gap-2 bg-[#EDEDEF]/50 rounded-[16px] p-3 mb-2 text-center font-sans text-xs">
              <div>
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Fabric Weight</span>
                <strong className="text-[#111111] font-semibold">{product.gsm || '240 GSM'}</strong>
              </div>
              <div className="border-x border-gray-200 px-1">
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Blend</span>
                <strong className="text-[#111111] font-semibold truncate block">{product.material || 'Organic Cotton'}</strong>
              </div>
              <div>
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Silhouette</span>
                <strong className="text-[#111111] font-semibold">{product.fit || 'Drop Shoulder'}</strong>
              </div>
            </div>

            {/* Add To Cart & Quantity Section */}
            <AddToCartSection product={product} />
            
            {/* Value Guarantees List */}
            <div className="mt-8 pt-5 border-t border-black/[0.04] flex flex-col gap-2.5 font-sans text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Complimentary Express Courier on orders over ₦200,000</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>100% Organic Heavyweight Cotton &bull; Preshrunk Double Weave</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Signature tamper-evident luxury dust packaging</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
