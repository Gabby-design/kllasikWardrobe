import { createClient } from '../../../utils/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartSection from './AddToCartSection';
import { Navbar } from '../../../src/components/Navbar';
import { CartDrawer } from '../../../src/components/CartDrawer';

export default async function ProductPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    notFound();
  }

  const formattedProduct = {
    id: product.id,
    title: product.name,
    price: product.price,
    description: product.description,
    image: product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    colors: [{ name: 'Standard', hex: '#1a1a1a' }]
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          {/* Left Column: Image */}
          <div className="w-full bg-neutral-100 aspect-[3/4] overflow-hidden">
            <img 
              src={formattedProduct.image} 
              alt={formattedProduct.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col justify-center">
            <h1 className="font-['Syne'] text-4xl lg:text-5xl font-bold text-[#1a1a1a] leading-tight mb-4">
              {formattedProduct.title}
            </h1>
            <p className="font-['DM_Sans'] text-xl font-medium text-[#1a1a1a] mb-8">
              ₦{Number(formattedProduct.price).toLocaleString()}
            </p>
            
            <div className="prose prose-neutral">
              <p className="font-['DM_Sans'] text-neutral-600 leading-relaxed text-lg">
                {formattedProduct.description}
              </p>
            </div>

            <AddToCartSection product={formattedProduct} />
            
            <div className="mt-12 pt-8 border-t border-neutral-200">
              <ul className="font-['DM_Sans'] text-sm text-neutral-500 space-y-2">
                <li>• Free complimentary delivery on orders over ₦70,000</li>
                <li>• 100% premium organic materials</li>
                <li>• Designed in Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
