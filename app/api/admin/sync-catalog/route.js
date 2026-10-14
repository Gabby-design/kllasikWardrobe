import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { 
  saveCustomProduct, 
  getAllProducts, 
  saveRemovedProductIds 
} from '../../../../src/data/productsManager.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { products, removedIds } = body || {};

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400 }
      );
    }

    // 1. Process removed IDs if provided
    if (Array.isArray(removedIds)) {
      saveRemovedProductIds(removedIds);
    }

    // 2. Save each product into productsManager
    for (const prod of products) {
      if (prod && prod.id && prod.title) {
        saveCustomProduct({
          ...prod,
          stock: prod.stock !== undefined ? Number(prod.stock) : 10,
          price: Number(prod.price || 0),
          isCustom: true,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Persist directly to custom-products.json if writeable
    const customFile = path.join(process.cwd(), 'src', 'data', 'custom-products.json');
    try {
      fs.writeFileSync(customFile, JSON.stringify(products, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('custom-products.json write notice:', fsErr.message);
    }

    // 4. Revalidate all pages so Next.js renders the latest products immediately
    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      for (const prod of products) {
        if (prod?.id) {
          revalidatePath(`/product/${prod.id}`, 'page');
        }
      }
    } catch (revErr) {
      console.warn('Revalidate notice:', revErr.message);
    }

    const all = getAllProducts();

    return NextResponse.json({
      success: true,
      message: 'Catalog synchronized successfully',
      count: all.length,
      syncedProductsCount: products.length,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (err) {
    console.error('sync-catalog error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const all = getAllProducts();
  return NextResponse.json({
    success: true,
    count: all.length,
    products: all,
    timestamp: Date.now()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
