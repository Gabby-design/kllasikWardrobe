import { createClient } from '../../../utils/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartSection from './AddToCartSection';
import { Navbar } from '../../../src/components/Navbar';
import { CartDrawer } from '../../../src/components/CartDrawer';
import { getAllProducts } from '../../../src/data/productsManager';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ShieldCheck, Truck, Package } from 'lucide-react';

export default async function ProductPage({ params }) {
  const { id } = await params;
  let formattedProduct = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (product) {
        formattedProduct = {
          id: product.id,
          title: product.name,
          price: product.price,
          description: product.description,
          gsm: product.gsm || '240 GSM Heavyweight',
          material: product.material || '100% Combed Organic Cotton',
          fit: product.fit || 'Oversized Drop-Shoulder',
          image: product.image_url || '/images/media__1786369656046.jpg',
          gallery: product.image_url ? [product.image_url] : ['/images/media__1786369656046.jpg'],
          category: product.category || 'Essential',
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: [{ name: product.color || 'Standard', hex: '#111111' }]
        };
      }
    }
  } catch (err) {
    // fallback
  }

  if (!formattedProduct) {
    const staticMatch = getAllProducts().find(p => p.id === id);
    if (staticMatch) {
      formattedProduct = staticMatch;
    }
  }

  if (!formattedProduct) {
    notFound();
  }

  const gallery = formattedProduct.gallery && formattedProduct.gallery.filter(Boolean).length > 0 
    ? formattedProduct.gallery.filter(Boolean) 
    : [formattedProduct.image];

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
          
          {/* Left Column: Large Rounded Image Showcase (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full bg-[#EDEDEF] aspect-[4/5] rounded-[24px] overflow-hidden p-3 sm:p-4 shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative group flex items-center justify-center touch-pan-y">
              <img 
                src={formattedProduct.image} 
                alt={formattedProduct.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[20px] pointer-events-none select-none"
                draggable={false}
              />

              {formattedProduct.tag && (
                <span className="absolute top-4 left-4 bg-[#111111] text-white px-3 py-1 text-xs font-sans font-semibold rounded-full shadow-xs">
                  {formattedProduct.tag}
                </span>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-4">
                {gallery.map((imgUrl, i) => (
                  <div key={i} className="w-14 h-16 rounded-[12px] bg-[#EDEDEF] p-1 overflow-hidden border border-black/[0.04]">
                    <img 
                      src={imgUrl} 
                      alt={`View ${i + 1}`} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-[8px]" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Garment Specs & Ordering Hub (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col bg-white rounded-[24px] border border-black/[0.04] p-6 sm:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
            
            {/* Small Grey Category Label */}
            <span className="font-sans text-xs text-gray-400 font-medium block mb-1">
              {formattedProduct.category || 'Essential'} Collection
            </span>

            {/* Bold Title */}
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#111111] leading-tight mb-2">
              {formattedProduct.title}
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

            {/* Price */}
            <div className="text-2xl sm:text-3xl font-bold text-[#111111] mb-4">
              ₦{Number(formattedProduct.price).toLocaleString()}
            </div>
            
            {/* Description */}
            <p className="font-sans text-gray-600 leading-relaxed text-xs sm:text-sm mb-6 pb-6 border-b border-black/[0.04]">
              {formattedProduct.description}
            </p>

            {/* Fabric Specifications Matrix */}
            <div className="grid grid-cols-3 gap-2 bg-[#EDEDEF]/50 rounded-[16px] p-3 mb-2 text-center font-sans text-xs">
              <div>
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Fabric Weight</span>
                <strong className="text-[#111111] font-semibold">{formattedProduct.gsm || '240 GSM'}</strong>
              </div>
              <div className="border-x border-gray-200 px-1">
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Blend</span>
                <strong className="text-[#111111] font-semibold truncate block">{formattedProduct.material || 'Organic Cotton'}</strong>
              </div>
              <div>
                <span className="text-gray-400 block font-medium text-[11px] mb-0.5">Silhouette</span>
                <strong className="text-[#111111] font-semibold">{formattedProduct.fit || 'Drop Shoulder'}</strong>
              </div>
            </div>

            {/* Add To Cart & Quantity Section */}
            <AddToCartSection product={formattedProduct} />
            
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
