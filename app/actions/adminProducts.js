'use server';

import { revalidatePath } from 'next/cache';
import { checkAdminSession } from './adminAuth.js';
import { 
  saveAuthoritativeProduct, 
  deleteAuthoritativeProduct, 
  resetDatabaseToCatalog,
  validateProductImageUrls
} from '../../src/lib/db.js';

function revalidateAllProductPaths(productId) {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/catalog', 'page');
    revalidatePath('/admin', 'page');
    if (productId) {
      revalidatePath(`/product/${productId}`, 'page');
    }
  } catch (err) {
    console.warn('Revalidation notice:', err.message);
  }
}

export async function createProductAction(productData) {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    if (!productData || !productData.title || productData.price === undefined) {
      return { success: false, error: 'Product title and price are required' };
    }

    const id = productData.id || `kwt-custom-${Date.now().toString().slice(-6)}`;
    const gallery = Array.isArray(productData.gallery) && productData.gallery.length > 0
      ? productData.gallery
      : [productData.image?.trim() || '/images/hero-tee-black.png'];

    const newProduct = {
      id,
      title: productData.title.trim(),
      price: Number(productData.price),
      category: productData.category || 'T-Shirts',
      tag: productData.tag || 'New Drop',
      rating: 5.0,
      reviews: 1,
      description: productData.description?.trim() || 'Heavyweight luxury streetwear garment crafted with dropped shoulder silhouette.',
      gsm: productData.gsm || '240 GSM Heavyweight',
      material: productData.material || '100% Combed Organic Cotton',
      fit: productData.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(productData.sizes) && productData.sizes.length > 0 
        ? productData.sizes 
        : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(productData.colors) && productData.colors.length > 0
        ? productData.colors
        : [{ name: productData.colorName || 'Obsidian Black', hex: productData.colorHex || '#111111' }],
      image: gallery[0] || productData.image?.trim() || '/images/hero-tee-black.png',
      fallbackImage: gallery[1] || gallery[0] || productData.image?.trim() || '/images/hero-tee-black.png',
      gallery,
      stock: productData.stock !== undefined ? Math.max(0, Number(productData.stock)) : 15,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    validateProductImageUrls(newProduct);
    const res = await saveAuthoritativeProduct(newProduct);
    revalidateAllProductPaths(id);

    return { success: true, product: res.product || newProduct };
  } catch (err) {
    console.error('createProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateProductAction(productData) {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    if (!productData || !productData.id) {
      return { success: false, error: 'Product ID is required for editing' };
    }
    if (!productData.title || productData.price === undefined) {
      return { success: false, error: 'Product title and price are required' };
    }

    const gallery = Array.isArray(productData.gallery) && productData.gallery.length > 0
      ? productData.gallery
      : [productData.image?.trim() || '/images/hero-tee-black.png'];

    const updatedProduct = {
      id: productData.id,
      title: productData.title.trim(),
      price: Number(productData.price),
      category: productData.category || 'T-Shirts',
      tag: productData.tag || 'Essential',
      rating: productData.rating || 5.0,
      reviews: productData.reviews || 24,
      description: productData.description?.trim() || '',
      gsm: productData.gsm || '240 GSM Heavyweight',
      material: productData.material || '100% Combed Organic Cotton',
      fit: productData.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(productData.sizes) && productData.sizes.length > 0 
        ? productData.sizes 
        : ['S', 'M', 'L', 'XL'],
      colors: Array.isArray(productData.colors) && productData.colors.length > 0
        ? productData.colors
        : [{ name: productData.colorName || 'Obsidian Black', hex: productData.colorHex || '#111111' }],
      image: gallery[0] || productData.image || '/images/hero-tee-black.png',
      fallbackImage: gallery[1] || gallery[0] || productData.image || '/images/hero-tee-black.png',
      gallery,
      stock: productData.stock !== undefined ? Math.max(0, Number(productData.stock)) : 10,
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    validateProductImageUrls(updatedProduct);
    const res = await saveAuthoritativeProduct(updatedProduct);
    revalidateAllProductPaths(productData.id);

    return { success: true, product: res.product || updatedProduct };
  } catch (err) {
    console.error('updateProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteProductAction(productId) {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    if (!productId) {
      return { success: false, error: 'Product ID is required for deletion' };
    }

    await deleteAuthoritativeProduct(productId);
    revalidateAllProductPaths(productId);

    return { success: true, id: productId };
  } catch (err) {
    console.error('deleteProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function resetCatalogAction() {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    await resetDatabaseToCatalog();
    revalidateAllProductPaths();

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
