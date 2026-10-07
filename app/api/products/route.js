import { NextResponse } from 'next/server';
import { getAllProducts, saveCustomProduct, removeCustomProduct } from '../../../src/data/productsManager';
import { createAdminClient } from '../../../utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let products = getAllProducts();

    // Attempt to fetch from Supabase if connected
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase query timed out')), 2000)
        );

        const fetchPromise = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result || {};

        if (!error && data && data.length > 0) {
          // Merge supabase products if any exist
          const dbItems = data.map((p) => {
            const staticMatch = products.find(sp => sp.id === p.id);
            return {
              id: p.id,
              name: p.name || p.title || staticMatch?.title,
              title: p.name || p.title || staticMatch?.title,
              price: Number(p.price || staticMatch?.price || 0),
              description: p.description || staticMatch?.description,
              stock: p.stock !== undefined ? p.stock : (staticMatch?.stock ?? 10),
              image: p.image_url || staticMatch?.image || '/images/media__1786369656046.jpg',
              fallbackImage: p.image_url || staticMatch?.fallbackImage || '/images/media__1786369656046.jpg',
              gallery: (Array.isArray(p.gallery) && p.gallery.length > 0)
                ? p.gallery 
                : (staticMatch?.gallery || (p.image_url ? [p.image_url] : ['/images/media__1786369656046.jpg'])),
              brand: p.brand || staticMatch?.brand || 'Klasik Wardrobe',
              category: p.category || staticMatch?.category || 'T-Shirts',
              gsm: p.gsm || staticMatch?.gsm || '240 GSM Heavyweight',
              material: p.material || staticMatch?.material || '100% Combed Organic Cotton',
              fit: p.fit || staticMatch?.fit || 'Oversized Drop-Shoulder',
              sizes: p.sizes || staticMatch?.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
              colors: p.color 
                ? [{ name: p.color, hex: '#111111' }] 
                : (staticMatch?.colors || [{ name: 'Obsidian Black', hex: '#111111' }]),
              tag: p.tag || staticMatch?.tag || 'New Drop'
            };
          });
          const existingIds = new Set(dbItems.map(d => d.id));
          products = [...dbItems, ...products.filter(p => !existingIds.has(p.id))];
        }
      }
    } catch {
      // Supabase unavailable; local manager verified products used safely
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
      { success: false, products: getAllProducts(), error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.title || !body.price) {
      return NextResponse.json(
        { success: false, error: 'Product title and price are required' },
        { status: 400 }
      );
    }

    const newProduct = {
      id: body.id || `kwt-${Date.now().toString().slice(-4)}`,
      title: body.title,
      price: Number(body.price),
      category: body.category || 'T-Shirts',
      tag: body.tag || 'New Drop',
      rating: body.rating || 5.0,
      reviews: body.reviews || 1,
      description: body.description || 'Heavyweight luxury streetwear garment crafted with dropped shoulder silhouette.',
      gsm: body.gsm || '240 GSM Heavyweight',
      material: body.material || '100% Combed Organic Cotton',
      fit: body.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : [{ name: body.colorName || 'Obsidian Black', hex: body.colorHex || '#111111' }],
      image: body.image || '/images/media__1786369656046.jpg',
      fallbackImage: body.image || '/images/media__1786369656046.jpg',
      gallery: body.gallery || [body.image || '/images/media__1786369656046.jpg'],
      stock: body.stock !== undefined ? Number(body.stock) : 15,
      createdAt: new Date().toISOString()
    };

    const res = saveCustomProduct(newProduct);

    // Also attempt Supabase upsert in background if active
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('products').upsert({
          id: newProduct.id,
          name: newProduct.title,
          price: newProduct.price,
          category: newProduct.category,
          description: newProduct.description,
          image_url: newProduct.image,
          stock: newProduct.stock
        });
      }
    } catch {
      // Supabase is optional; local storage already saved
    }

    return NextResponse.json({
      success: true,
      product: newProduct
    });
  } catch (err) {
    console.error('Error adding product:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    removeCustomProduct(id);

    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('products').delete().eq('id', id);
      }
    } catch {
      // Supabase is optional
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
