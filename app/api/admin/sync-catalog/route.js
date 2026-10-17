import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  getAuthoritativeProducts, 
  saveAuthoritativeProduct, 
  deleteAuthoritativeProduct 
} from '../../../../src/lib/db.js';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

import { verifyAdminSessionToken } from '../../../../src/lib/auth';

async function isAdminAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return verifyAdminSessionToken(token);
}

export async function POST(request) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator authentication required' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { products, removedIds } = body || {};

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Products array is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Process removed IDs in authoritative database
    if (Array.isArray(removedIds)) {
      for (const id of removedIds) {
        if (id) {
          try {
            await deleteAuthoritativeProduct(id);
          } catch {}
        }
      }
    }

    // 2. Save products in authoritative database
    for (const prod of products) {
      if (prod && prod.id && prod.title) {
        await saveAuthoritativeProduct({
          ...prod,
          stock: prod.stock !== undefined ? Number(prod.stock) : 10,
          price: Number(prod.price || 0),
          isCustom: true,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Revalidate paths
    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
    } catch {}

    const all = await getAuthoritativeProducts();

    return NextResponse.json({
      success: true,
      message: 'Catalog synchronized to authoritative database',
      count: all.length,
      syncedProductsCount: products.length,
      timestamp: Date.now()
    }, {
      headers: CORS_HEADERS
    });
  } catch (err) {
    console.error('sync-catalog error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  try {
    const all = await getAuthoritativeProducts();
    return NextResponse.json({
      success: true,
      count: all.length,
      products: all,
      timestamp: Date.now()
    }, {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
