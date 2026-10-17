import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { 
  getAuthoritativeProducts, 
  saveAuthoritativeProduct, 
  deleteAuthoritativeProduct 
} from '../../../src/lib/db.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

import { verifyAdminSessionToken } from '../../../src/lib/auth';

async function isAdminAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return verifyAdminSessionToken(token);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let products = await getAuthoritativeProducts();

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
      { success: false, products: [], error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator authentication required' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    if (!body || !body.title || body.price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product title and price are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const gallery = Array.isArray(body.gallery) && body.gallery.length > 0
      ? body.gallery
      : [body.image?.trim() || '/images/hero-tee-black.png'];

    const newProduct = {
      id: body.id || `kwt-${Date.now().toString().slice(-5)}`,
      title: body.title.trim(),
      price: Number(body.price),
      category: body.category || 'T-Shirts',
      tag: body.tag || 'New Drop',
      rating: body.rating || 5.0,
      reviews: body.reviews || 1,
      description: body.description?.trim() || '',
      gsm: body.gsm || '240 GSM Heavyweight',
      material: body.material || '100% Combed Organic Cotton',
      fit: body.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0 ? body.sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : [{ name: body.colorName || 'Obsidian Black', hex: body.colorHex || '#111111' }],
      image: gallery[0] || body.image || '/images/hero-tee-black.png',
      fallbackImage: gallery[1] || gallery[0] || body.image || '/images/hero-tee-black.png',
      gallery,
      stock: body.stock !== undefined ? Math.max(0, Number(body.stock)) : 15,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    await saveAuthoritativeProduct(newProduct);

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
    if (!(await isAdminAuthorized())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator authentication required' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required for editing' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const gallery = Array.isArray(body.gallery) && body.gallery.length > 0
      ? body.gallery
      : [body.image?.trim() || '/images/hero-tee-black.png'];

    const updatedProduct = {
      ...body,
      id: body.id,
      title: body.title?.trim() || 'Product',
      price: Number(body.price || 0),
      category: body.category || 'T-Shirts',
      tag: body.tag || 'Luxury Essential',
      image: gallery[0] || body.image || '/images/hero-tee-black.png',
      fallbackImage: gallery[1] || gallery[0] || body.image || '/images/hero-tee-black.png',
      gallery,
      stock: body.stock !== undefined ? Math.max(0, Number(body.stock)) : 10,
      updatedAt: new Date().toISOString()
    };

    await saveAuthoritativeProduct(updatedProduct);

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
    if (!(await isAdminAuthorized())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator authentication required' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    await deleteAuthoritativeProduct(id);

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
