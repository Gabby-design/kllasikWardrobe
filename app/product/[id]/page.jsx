import { createClient } from '../../../utils/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartSection from './AddToCartSection';
import { Navbar } from '../../../src/components/Navbar';
import { CartDrawer } from '../../../src/components/CartDrawer';
import { PRODUCTS } from '../../../src/data/catalog';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Truck, Sparkles, Layers, Package } from 'lucide-react';

export default async function ProductPage({ params }) {
  const { id } = await params;
  let formattedProduct = null;

  try {
    const supabase = await createClient();
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
        image: product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
        gallery: [product.image_url],
        category: product.category || 'Essential',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Standard', hex: '#1a1a1a' }]
      };
    }
  } catch (err) {
    // ignore
  }

  // Fallback to static catalog if not found in database
  if (!formattedProduct) {
    const staticMatch = PRODUCTS.find(p => p.id === id);
    if (staticMatch) {
      formattedProduct = staticMatch;
    }
  }

  if (!formattedProduct) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-20">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] font-semibold text-foreground/70 hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Collection</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Product Image Showcase (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="w-full bg-[#F2EFEB] aspect-[3/4] overflow-hidden border border-foreground/10 shadow-lg relative group">
              <img 
                src={formattedProduct.image} 
                alt={formattedProduct.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {formattedProduct.tag && (
                <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-xs font-sans uppercase tracking-[0.2em] font-bold shadow-md">
                  {formattedProduct.tag}
                </span>
              )}
            </div>

            {/* Gallery Thumbnails if available */}
            {formattedProduct.gallery && formattedProduct.gallery.filter(Boolean).length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {formattedProduct.gallery.filter(Boolean).map((imgUrl, i) => (
                  <div key={i} className="aspect-[3/4] bg-foreground/5 border border-foreground/10 overflow-hidden">
                    <img src={imgUrl} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Garment Specs & Ordering Hub (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col bg-white border border-foreground/10 p-8 sm:p-12 shadow-sm">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-foreground text-background font-sans text-[0.65rem] uppercase tracking-[0.2em] font-bold px-2.5 py-0.5">
                {formattedProduct.category || 'Essential'} Collection
              </span>
              <span className="text-[0.65rem] font-sans uppercase tracking-[0.15em] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
                {formattedProduct.gsm || '240 GSM'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-3 tracking-tight">
              {formattedProduct.title}
            </h1>

            <div className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-6">
              ₦{Number(formattedProduct.price).toLocaleString()}
            </div>
            
            <p className="font-sans text-foreground/70 leading-relaxed text-sm mb-8 pb-8 border-b border-foreground/10">
              {formattedProduct.description}
            </p>

            {/* Fabric Specifications Matrix */}
            <div className="grid grid-cols-3 gap-3 bg-foreground/[0.03] border border-foreground/10 p-4 mb-2 text-center font-sans text-xs">
              <div>
                <span className="text-foreground/50 uppercase tracking-widest block font-semibold text-[0.65rem] mb-1">Fabric Weight</span>
                <strong className="text-foreground">{formattedProduct.gsm || '240 GSM'}</strong>
              </div>
              <div className="border-x border-foreground/10 px-2">
                <span className="text-foreground/50 uppercase tracking-widest block font-semibold text-[0.65rem] mb-1">Blend</span>
                <strong className="text-foreground truncate block">{formattedProduct.material || 'Organic Cotton'}</strong>
              </div>
              <div>
                <span className="text-foreground/50 uppercase tracking-widest block font-semibold text-[0.65rem] mb-1">Silhouette</span>
                <strong className="text-foreground">{formattedProduct.fit || 'Drop Shoulder'}</strong>
              </div>
            </div>

            {/* Add To Cart & Quantity Section */}
            <AddToCartSection product={formattedProduct} />
            
            {/* Value Guarantees List */}
            <div className="mt-10 pt-6 border-t border-foreground/10 flex flex-col gap-3 font-sans text-xs text-foreground/70">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-foreground/80 shrink-0" />
                <span>Complimentary Express Courier on orders over ₦70,000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-foreground/80 shrink-0" />
                <span>100% Organic Heavyweight Cotton &bull; Preshrunk Double Weave</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-foreground/80 shrink-0" />
                <span>Signature tamper-evident luxury matte-black dust packaging</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
