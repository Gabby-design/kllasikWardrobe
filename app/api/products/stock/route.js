import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { 
  getAuthoritativeProductById, 
  getAuthoritativeProducts, 
  updateAuthoritativeStock, 
  decrementAuthoritativeStock 
} from '../../../../src/lib/db.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: NO_CACHE_HEADERS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      const product = await getAuthoritativeProductById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      const stock = Number(product.stock !== undefined ? product.stock : 10);
      return NextResponse.json({
        success: true,
        productId,
        stock,
        isOutOfStock: stock <= 0,
      }, { headers: NO_CACHE_HEADERS });
    }

    const all = await getAuthoritativeProducts();
    const stockMap = {};
    for (const p of all) {
      if (p && p.id) {
        stockMap[p.id] = Number(p.stock !== undefined ? p.stock : 10);
      }
    }

    return NextResponse.json({
      success: true,
      stocks: stockMap,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, newStock, action = 'decrement' } = body || {};

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let result;
    if (action === 'set' && newStock !== undefined) {
      result = await updateAuthoritativeStock(productId, Number(newStock));
    } else {
      result = await decrementAuthoritativeStock(productId, Number(quantity || 1));
    }

    if (!result || !result.product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or stock update failed' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${productId}`, 'page');
    } catch {}

    return NextResponse.json({
      success: true,
      product: result.product,
      previousStock: result.previousStock,
      newStock: result.newStock,
      wasLastUnit: Boolean(result.wasLastUnit),
      isOutOfStock: result.newStock <= 0,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('API /api/products/stock error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
