'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { getAllProducts, saveCustomProduct, removeCustomProduct, getCustomProducts } from '../../src/data/productsManager';
import { createAdminClient } from '../../utils/supabase/admin';

export async function createProductAction(productData) {
  try {
    if (!productData.title || !productData.price) {
      return { success: false, error: 'Product title and price are required' };
    }

    const id = productData.id || `kwt-custom-${Date.now().toString().slice(-5)}`;
    
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
      image: productData.image?.trim() || '/images/media__1786369656046.jpg',
      fallbackImage: productData.image?.trim() || '/images/media__1786369656046.jpg',
      gallery: productData.gallery || [productData.image?.trim() || '/images/media__1786369656046.jpg'],
      stock: productData.stock !== undefined ? Number(productData.stock) : 15,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const res = saveCustomProduct(newProduct);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Background sync to Supabase backend (Storage + Database)
    try {
      const supabase = createAdminClient();
      if (supabase) {
        let supabaseImageUrl = newProduct.image;

        // If image is a local path and file exists, upload to Supabase storage 'products' bucket
        if (newProduct.image && newProduct.image.startsWith('/images/')) {
          try {
            const relPath = newProduct.image.replace(/^\//, '');
            const localFilePath = path.join(process.cwd(), 'public', relPath);
            if (fs.existsSync(localFilePath)) {
              const fileBuf = fs.readFileSync(localFilePath);
              const fileName = path.basename(localFilePath);
              const { data: storageData, error: storageErr } = await supabase.storage
                .from('products')
                .upload(fileName, fileBuf, { contentType: 'image/jpeg', upsert: true });

              if (!storageErr && storageData) {
                const { data: pUrlData } = supabase.storage
                  .from('products')
                  .getPublicUrl(fileName);
                if (pUrlData?.publicUrl) {
                  supabaseImageUrl = pUrlData.publicUrl;
                }
              }
            }
          } catch (storageEx) {
            console.warn('Supabase storage upload notice:', storageEx.message);
          }
        }

        await supabase.from('products').upsert({
          id: newProduct.id,
          name: newProduct.title,
          price: newProduct.price,
          category: newProduct.category,
          description: newProduct.description,
          image_url: supabaseImageUrl,
          stock: newProduct.stock
        });
      }
    } catch {
      // Supabase is optional
    }

    revalidatePath('/');
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath(`/product/${id}`);

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
      image: productData.image?.trim() || '/images/media__1786369656046.jpg',
      fallbackImage: productData.fallbackImage?.trim() || productData.image?.trim() || '/images/media__1786369656046.jpg',
      gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0
        ? productData.gallery
        : [productData.image?.trim() || '/images/media__1786369656046.jpg'],
      stock: productData.stock !== undefined ? Number(productData.stock) : 10,
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    const res = saveCustomProduct(updatedProduct);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Background sync to Supabase database
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('products').upsert({
          id: updatedProduct.id,
          name: updatedProduct.title,
          price: updatedProduct.price,
          category: updatedProduct.category,
          description: updatedProduct.description,
          image_url: updatedProduct.image,
          stock: updatedProduct.stock
        });
      }
    } catch (e) {
      console.warn('Supabase product sync notice:', e.message);
    }

    revalidatePath('/');
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath(`/product/${productData.id}`);

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

    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('products').delete().eq('id', productId);
      }
    } catch {
      // Supabase optional
    }

    revalidatePath('/');
    revalidatePath('/catalog');
    revalidatePath('/admin');
    revalidatePath(`/product/${productId}`);

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
