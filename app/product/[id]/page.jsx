import { createClient } from '../../../utils/supabase/server';
import { notFound } from 'next/navigation';
import { getAllProducts } from '../../../src/data/productsManager';
import ProductPageClient from './ProductPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductPage({ params }) {
  const { id } = await params;
  let formattedProduct = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      const dbPromise = supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: 'timeout' }), 400));
      const { data: product } = await Promise.race([dbPromise, timeoutPromise]);

      if (product) {
        const staticMatch = getAllProducts().find(p => p.id === id);
        formattedProduct = {
          id: product.id,
          title: product.name,
          price: product.price,
          description: product.description,
          gsm: product.gsm || staticMatch?.gsm || '240 GSM Heavyweight',
          material: product.material || staticMatch?.material || '100% Combed Organic Cotton',
          fit: product.fit || staticMatch?.fit || 'Oversized Drop-Shoulder',
          image: product.image_url || staticMatch?.image || '/images/media__1786369656046.jpg',
          gallery: (Array.isArray(product.gallery) && product.gallery.length > 0)
            ? product.gallery
            : (staticMatch?.gallery || (product.image_url ? [product.image_url] : ['/images/media__1786369656046.jpg'])),
          category: product.category || staticMatch?.category || 'Essential',
          sizes: product.sizes || staticMatch?.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
          colors: product.color ? [{ name: product.color, hex: '#111111' }] : (staticMatch?.colors || [{ name: 'Standard', hex: '#111111' }])
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

  return <ProductPageClient initialProduct={formattedProduct} />;
}
