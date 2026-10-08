import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { decrementProductStock, updateProductStock, getProductById, getAllProducts } from '../../../../src/data/productsManager.js';
import { createAdminClient } from '../../../../utils/supabase/admin.js';

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
    const productId = searchParams.get('productId');

    if (productId) {
      const product = getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json({
        success: true,
        productId,
        stock: Number(product.stock !== undefined ? product.stock : 10),
        isOutOfStock: Number(product.stock !== undefined ? product.stock : 10) <= 0,
      }, { headers: NO_CACHE_HEADERS });
    }

    const all = getAllProducts();
    const stockMap = {};
    for (const p of all) {
      stockMap[p.id] = Number(p.stock !== undefined ? p.stock : 10);
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
      result = updateProductStock(productId, Number(newStock));
    } else {
      result = decrementProductStock(productId, Number(quantity || 1));
    }

    if (!result || !result.product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or stock update failed' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Background sync to Supabase if connected
    (async () => {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          if (action === 'set' && newStock !== undefined) {
            await supabase
              .from('products')
              .update({ stock: Number(newStock) })
              .eq('id', productId);
          } else {
            await supabase.rpc('decrement_stock', {
              p_id: productId,
              qty: Number(quantity || 1),
            });
          }
        }
      } catch {}
    })().catch(() => {});

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
