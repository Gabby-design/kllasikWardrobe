'use server';

import { revalidatePath } from 'next/cache';
import { getAllProducts, saveCustomProduct, removeCustomProduct, getCustomProducts } from '../../src/data/productsManager.js';
import { createAdminClient } from '../../utils/supabase/admin.js';

export async function createProductAction(productData) {
  try {
    if (!productData || !productData.title || !productData.price) {
      return { success: false, error: 'Product title and price are required' };
    }

    const id = productData.id || `kwt-custom-${Date.now().toString().slice(-6)}`;
    
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
      image: (Array.isArray(productData.gallery) && productData.gallery[0]) || productData.image?.trim() || '/images/hero-tee-black.png',
      fallbackImage: (Array.isArray(productData.gallery) && productData.gallery[1]) || (Array.isArray(productData.gallery) && productData.gallery[0]) || productData.image?.trim() || '/images/hero-tee-black.png',
      gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0 
        ? productData.gallery 
        : [productData.image?.trim() || '/images/hero-tee-black.png'],
      stock: productData.stock !== undefined ? Number(productData.stock) : 15,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const res = saveCustomProduct(newProduct);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Non-blocking background sync to Supabase (never blocks or delays user save)
    (async () => {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
          const sync = supabase.from('products').upsert({
            id: newProduct.id,
            name: newProduct.title,
            price: newProduct.price,
            category: newProduct.category,
            description: newProduct.description,
            image_url: newProduct.image,
            stock: newProduct.stock
          });
          await Promise.race([sync, timeout]);
        }
      } catch {}
    })().catch(() => {});

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${id}`, 'page');
    } catch {}

    return { success: true, product: newProduct };
  } catch (err) {
    console.error('createProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateProductAction(productData) {
  try {
    if (!productData || !productData.id) {
      return { success: false, error: 'Product ID is required for editing' };
    }
    if (!productData.title || !productData.price) {
      return { success: false, error: 'Product title and price are required' };
    }

    const updatedProduct = {
      ...productData,
      id: productData.id,
      title: productData.title.trim(),
      price: Number(productData.price),
      category: productData.category || 'T-Shirts',
      tag: productData.tag || 'Luxury Essential',
      description: productData.description ? productData.description.trim() : '',
      gsm: productData.gsm || '240 GSM Heavyweight',
      material: productData.material || '100% Combed Organic Cotton',
      fit: productData.fit || 'Oversized Drop-Shoulder',
      sizes: Array.isArray(productData.sizes) && productData.sizes.length > 0
        ? productData.sizes
        : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(productData.colors) && productData.colors.length > 0
        ? productData.colors
        : [{ name: productData.colorName || 'Obsidian Black', hex: productData.colorHex || '#111111' }],
      image: (Array.isArray(productData.gallery) && productData.gallery[0]) || productData.image?.trim() || '/images/hero-tee-black.png',
      fallbackImage: (Array.isArray(productData.gallery) && productData.gallery[1]) || (Array.isArray(productData.gallery) && productData.gallery[0]) || productData.fallbackImage?.trim() || productData.image?.trim() || '/images/hero-tee-black.png',
      gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0
        ? productData.gallery
        : [productData.image?.trim() || '/images/hero-tee-black.png'],
      stock: productData.stock !== undefined ? Number(productData.stock) : 10,
      isCustom: productData.isCustom !== undefined ? productData.isCustom : true,
      updatedAt: new Date().toISOString()
    };

    const res = saveCustomProduct(updatedProduct);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Non-blocking background sync to Supabase (never blocks or delays user save)
    (async () => {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
          const sync = supabase.from('products').upsert({
            id: updatedProduct.id,
            name: updatedProduct.title,
            price: updatedProduct.price,
            category: updatedProduct.category,
            description: updatedProduct.description,
            image_url: updatedProduct.image,
            stock: updatedProduct.stock
          });
          await Promise.race([sync, timeout]);
        }
      } catch {}
    })().catch(() => {});

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${productData.id}`, 'page');
    } catch {}

    return { success: true, product: updatedProduct };
  } catch (err) {
    console.error('updateProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteProductAction(productId) {
  try {
    if (!productId) return { success: false, error: 'Product ID required' };
    
    const res = removeCustomProduct(productId);

    // Non-blocking background sync to Supabase
    (async () => {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          await supabase.from('products').delete().eq('id', productId);
        }
      } catch {}
    })().catch(() => {});

    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/admin', 'page');
      revalidatePath(`/product/${productId}`, 'page');
    } catch {}

    return { success: true };
  } catch (err) {
    console.error('deleteProductAction error:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminProductsAction() {
  try {
    const all = getAllProducts();
    const custom = getCustomProducts();
    return { 
      success: true, 
      products: all,
      customCount: custom.length 
    };
  } catch (err) {
    return { success: false, error: err.message, products: [] };
  }
}
