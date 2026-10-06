import { NextResponse } from 'next/server';
import { PRODUCTS } from '../../../src/data/catalog';
import { createAdminClient } from '../../../utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let products = PRODUCTS;

    // Attempt to fetch from Supabase with timeout safeguard
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase query timed out')), 2500)
        );

        const fetchPromise = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result || {};

        if (!error && data && data.length > 0) {
          products = data.map((p, idx) => {
            const fallback = PRODUCTS[idx % PRODUCTS.length];
            return {
              id: p.id || fallback.id,
              name: p.name || fallback.title,
              title: p.name || fallback.title,
              price: Number(p.price || fallback.price),
              description: p.description || fallback.description,
              stock: p.stock !== undefined ? p.stock : fallback.stock || 10,
              image: p.image_url || fallback.image,
              fallbackImage: fallback.fallbackImage || fallback.image,
              gallery: p.image_url ? [p.image_url] : fallback.gallery,
              brand: p.brand || 'Klasik Wardrobe',
              category: p.category || fallback.category,
              gsm: p.gsm || fallback.gsm,
              material: p.material || fallback.material,
              fit: p.fit || fallback.fit,
              sizes: fallback.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
              colors: p.color ? [{ name: p.color, hex: '#1a1a1a' }] : fallback.colors,
              tag: fallback.tag
            };
          });
        }
      }
    } catch (dbError) {
      // Supabase is paused or unreachable; fallback directly to local verified catalog
      console.warn('Backend products query notice (using local catalog):', dbError.message);
    }

    if (category && category !== 'ALL' && category !== 'All') {
      products = products.filter(
        p => p.category && p.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('API /api/products error:', error);
    return NextResponse.json(
      { success: false, products: PRODUCTS, error: error.message },
      { status: 500 }
    );
  }
}
