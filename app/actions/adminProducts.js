'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { checkAdminSession } from './adminAuth.js';
import { 
  saveAuthoritativeProduct, 
  deleteAuthoritativeProduct, 
  resetDatabaseToCatalog,
  validateProductImageUrls,
  ensureRedis,
  REDIS_HASH_KEY,
  REDIS_REMOVED_KEY,
  parseRedisProduct,
  ensureHashSeeded
} from '../../src/lib/db.js';
import { validateProductColors } from '../../src/lib/colorUtils.js';

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
      tiktokUrl: productData.tiktokUrl ? productData.tiktokUrl.trim() : null,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    validateProductImageUrls(newProduct);
    validateProductColors(newProduct.colors);
    const verifiedProduct = await saveAuthoritativeProduct(newProduct);
    revalidateAllProductPaths(id);

    return { success: true, product: verifiedProduct };
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
      tiktokUrl: productData.tiktokUrl !== undefined ? (productData.tiktokUrl?.trim() || null) : null,
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    validateProductImageUrls(updatedProduct);
    validateProductColors(updatedProduct.colors);
    const verifiedProduct = await saveAuthoritativeProduct(updatedProduct);
    revalidateAllProductPaths(productData.id);

    return { success: true, product: verifiedProduct };
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

export async function resetCatalogAction(confirmationText) {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    if (confirmationText !== 'RESET CATALOG') {
      return {
        success: false,
        error: 'Confirmation required: Exact confirmation string "RESET CATALOG" must be provided to reset catalog.',
      };
    }

    await resetDatabaseToCatalog();
    revalidateAllProductPaths();

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return process.env.BLOB_READ_WRITE_TOKEN.trim();
  }
  const matchingKey = Object.keys(process.env).find(
    (key) => (key.endsWith('_READ_WRITE_TOKEN') || key.includes('BLOB_READ_WRITE')) && process.env[key]?.trim()
  );
  if (matchingKey) {
    return process.env[matchingKey].trim();
  }
  return null;
}

function decodeDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;(base64))?,(.*)$/s);
  if (!match) return null;
  const mimeType = match[1] || 'image/jpeg';
  const isBase64 = match[2] === 'base64';
  const rawData = match[3] || '';
  const buffer = isBase64
    ? Buffer.from(rawData, 'base64')
    : Buffer.from(decodeURIComponent(rawData), 'utf8');

  let ext = '.jpg';
  if (mimeType.includes('png')) ext = '.png';
  else if (mimeType.includes('webp')) ext = '.webp';
  else if (mimeType.includes('gif')) ext = '.gif';
  else if (mimeType.includes('svg')) ext = '.svg';

  return { buffer, mimeType, ext };
}

async function uploadDataUrlToBlob(dataUrl, blobToken) {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) {
    throw new Error('Invalid data: URL format cannot be decoded.');
  }

  const safePathname = `products/repaired-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${decoded.ext}`;
  const putOptions = {
    access: 'public',
    addRandomSuffix: true,
    contentType: decoded.mimeType,
  };
  if (blobToken) {
    putOptions.token = blobToken;
  }

  const blob = await put(safePathname, decoded.buffer, putOptions);
  return blob.url;
}

export async function repairImagesAction() {
  try {
    const isAuthed = await checkAdminSession();
    if (!isAuthed) {
      return { success: false, error: 'Unauthorized: Administrator authentication required' };
    }

    const redis = ensureRedis();
    await ensureHashSeeded(redis);

    const [rawValues, removedIds] = await Promise.all([
      redis.hvals(REDIS_HASH_KEY),
      redis.smembers(REDIS_REMOVED_KEY).catch(() => []),
    ]);

    const removedSet = new Set(Array.isArray(removedIds) ? removedIds : []);
    const blobToken = getBlobToken();

    let productsScanned = 0;
    let imagesConverted = 0;
    let imagesRemoved = 0;
    const manualReuploadSet = new Set();
    const dataUrlMap = new Map();

    const isDataUrl = (url) => typeof url === 'string' && url.trim().toLowerCase().startsWith('data:');
    const isBlobUrl = (url) => typeof url === 'string' && url.trim().toLowerCase().startsWith('blob:');

    const getConvertedUrl = async (dataUrl) => {
      if (dataUrlMap.has(dataUrl)) {
        return dataUrlMap.get(dataUrl);
      }
      const uploadedUrl = await uploadDataUrlToBlob(dataUrl, blobToken);
      dataUrlMap.set(dataUrl, uploadedUrl);
      imagesConverted++;
      return uploadedUrl;
    };

    const DEFAULT_PLACEHOLDER = '/images/hero-tee-black.png';

    for (const raw of (Array.isArray(rawValues) ? rawValues : [])) {
      const product = parseRedisProduct(raw);
      if (!product || !product.id || removedSet.has(product.id)) continue;

      productsScanned++;
      let modified = false;

      // 1. Process gallery
      const originalGallery = Array.isArray(product.gallery) ? product.gallery : (product.image ? [product.image] : []);
      const newGallery = [];

      for (const item of originalGallery) {
        if (!item || typeof item !== 'string') continue;
        if (isBlobUrl(item)) {
          imagesRemoved++;
          modified = true;
          continue;
        }
        if (isDataUrl(item)) {
          const convertedUrl = await getConvertedUrl(item);
          newGallery.push(convertedUrl);
          modified = true;
          continue;
        }
        newGallery.push(item);
      }

      // Check if gallery became empty
      if (newGallery.length === 0) {
        newGallery.push(DEFAULT_PLACEHOLDER);
        manualReuploadSet.add(product.id);
        modified = true;
      }

      // 2. Process product.image
      let newImage = product.image;
      if (isDataUrl(newImage)) {
        newImage = await getConvertedUrl(newImage);
        modified = true;
      } else if (isBlobUrl(newImage) || !newImage) {
        newImage = newGallery[0] || DEFAULT_PLACEHOLDER;
        modified = true;
      }

      // 3. Process product.fallbackImage
      let newFallback = product.fallbackImage;
      if (isDataUrl(newFallback)) {
        newFallback = await getConvertedUrl(newFallback);
        modified = true;
      } else if (isBlobUrl(newFallback) || !newFallback) {
        newFallback = newGallery[1] || newGallery[0] || DEFAULT_PLACEHOLDER;
        modified = true;
      }

      // 4. Process product.colors if any have matching or data:/blob: image
      let updatedColors = product.colors;
      if (Array.isArray(product.colors)) {
        let colorsChanged = false;
        updatedColors = await Promise.all(product.colors.map(async (c) => {
          if (!c) return c;
          if (isDataUrl(c.image)) {
            colorsChanged = true;
            const converted = await getConvertedUrl(c.image);
            return { ...c, image: converted };
          }
          if (isBlobUrl(c.image)) {
            colorsChanged = true;
            return { ...c, image: '' };
          }
          return c;
        }));
        if (colorsChanged) modified = true;
      }

      // Never overwrite anything else on the product.
      if (modified) {
        const repairedProduct = {
          ...product,
          image: newImage,
          fallbackImage: newFallback,
          gallery: newGallery,
          ...(Array.isArray(updatedColors) ? { colors: updatedColors } : {}),
        };

        await redis.hset(REDIS_HASH_KEY, { [product.id]: JSON.stringify(repairedProduct) });
        revalidateAllProductPaths(product.id);
      }
    }

    return {
      success: true,
      report: {
        productsScanned,
        imagesConverted,
        imagesRemoved,
        manualReuploadIds: Array.from(manualReuploadSet),
        scanned: productsScanned,
        converted: imagesConverted,
        removed: imagesRemoved,
        idsNeedingReupload: Array.from(manualReuploadSet),
      },
    };
  } catch (err) {
    console.error('repairImagesAction error:', err);
    return { success: false, error: err.message };
  }
}
