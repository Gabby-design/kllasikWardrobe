import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllProducts, saveCustomProduct, removeCustomProduct } from '../../../src/data/productsManager.js';
import { createAdminClient } from '../../../utils/supabase/admin.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let products = getAllProducts();

    // Fast-check Supabase with 400ms timeout
    try {
      const supabase = createAdminClient();
      if (supabase) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 400)
        );

        const fetchPromise = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result || {};

        if (!error && data && data.length > 0) {
          const dbItems = data.map((p) => {
            const staticMatch = products.find(sp => sp.id === p.id);
            return {
              id: p.id,
              name: p.name || p.title || staticMatch?.title,
              title: p.name || p.title || staticMatch?.title,
              price: Number(p.price || staticMatch?.price || 0),
              description: p.description || staticMatch?.description,
              stock: p.stock !== undefined ? p.stock : (staticMatch?.stock ?? 10),
              image: p.image_url || staticMatch?.image || '/images/hero-tee-black.png',
              fallbackImage: p.image_url || staticMatch?.fallbackImage || '/images/hero-tee-black.png',
              gallery: (Array.isArray(p.gallery) && p.gallery.length > 0)
                ? p.gallery 
                : (staticMatch?.gallery || (p.image_url ? [p.image_url] : ['/images/hero-tee-black.png'])),
              brand: p.brand || staticMatch?.brand || 'Klasik Wardrobe',
              category: p.category || staticMatch?.category || 'T-Shirts',
              gsm: p.gsm || staticMatch?.gsm || '240 GSM Heavyweight',
              material: p.material || staticMatch?.material || '100% Combed Organic Cotton',
              fit: p.fit || staticMatch?.fit || 'Oversized Drop-Shoulder',
              sizes: p.sizes || staticMatch?.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
              colors: p.color 
                ? [{ name: p.color, hex: '#111111' }] 
                : (staticMatch?.colors || [{ name: 'Obsidian Black', hex: '#111111' }]),
              tag: p.tag || staticMatch?.tag || 'New Drop',
              isCustom: true
            };
          });
          const existingIds = new Set(dbItems.map(d => d.id));
          products = [...dbItems, ...products.filter(p => !existingIds.has(p.id))];
        }
      }
    } catch {
      // Supabase unavailable; local manager verified products used
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
    }, {
      headers: NO_CACHE_HEADERS
    });
  } catch (error) {
    console.error('API /api/products error:', error);
    return NextResponse.json(
      { success: false, products: getAllProducts(), error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.title || !body.price) {
      return NextResponse.json(
        { success: false, error: 'Product title and price are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const newProduct = {
      id: body.id || `kwt-${Date.now().toString().slice(-5)}`,
      title: body.title.trim(),
      price: Number(body.price),
      category: body.category || 'T-Shirts',
      tag: body.tag || 'New Drop',
      rating: body.rating || 5.0,
      reviews: body.reviews || 1,
      description: body.description?.trim() || 'Heavyweight luxury streetwear garment crafted with dropped shoulder silhouette.',
      gsm: body.gsm || '240 GSM Heavyweight',
      material: body.material || '100% Combed Organic Cotton',
      fit: body.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : [{ name: body.colorName || 'Obsidian Black', hex: body.colorHex || '#111111' }],
      image: body.image || '/images/hero-tee-black.png',
      fallbackImage: body.fallbackImage || body.image || '/images/hero-tee-black.png',
      gallery: Array.isArray(body.gallery) && body.gallery.length > 0 ? body.gallery : [body.image || '/images/hero-tee-black.png'],
      stock: body.stock !== undefined ? Number(body.stock) : 15,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    saveCustomProduct(newProduct);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${newProduct.id}`, 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      product: newProduct
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('Error adding product:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required for editing' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const updatedProduct = {
      ...body,
      id: body.id,
      title: body.title?.trim() || 'Product',
      price: Number(body.price || 0),
      category: body.category || 'T-Shirts',
      tag: body.tag || 'Luxury Essential',
      stock: body.stock !== undefined ? Number(body.stock) : 10,
      updatedAt: new Date().toISOString()
    };

    saveCustomProduct(updatedProduct);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${body.id}`, 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      product: updatedProduct
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('Error updating product:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    removeCustomProduct(id);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${id}`, 'page');
    } catch {}

    return NextResponse.json({ success: true, id }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
