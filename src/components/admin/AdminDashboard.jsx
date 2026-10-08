'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Package, 
  ShoppingBag, 
  Trash2, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Layers, 
  ArrowLeft, 
  LogOut, 
  ShieldCheck, 
  Eye, 
  Truck,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Save,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createProductAction, deleteProductAction, updateProductAction } from '../../../app/actions/adminProducts';
import { logoutAdmin } from '../../../app/actions/adminAuth';
import { KlasikLogo } from '../KlasikLogo';
import { 
  saveStoredCustomProduct, 
  removeStoredCustomProduct, 
  mergeWithStoredProducts, 
  broadcastProductChange,
  compressImageFile
} from '../../utils/productSync.js';

export function AdminDashboard({ initialProducts, initialOrders }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('new-product'); // 'new-product' | 'catalog' | 'orders'
  const [products, setProducts] = useState(initialProducts || []);
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Auto-Save & Synchronization State
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'saving' | 'saved' | 'idle'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const isInitialModalLoad = useRef(true);

  // Hydrate with local stored products on mount
  useEffect(() => {
    setProducts((current) => mergeWithStoredProducts(current));
  }, []);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState(30000);
  const [editCategory, setEditCategory] = useState('T-Shirts');
  const [editStock, setEditStock] = useState(15);
  const [editTag, setEditTag] = useState('Luxury Essential');
  const [editGsm, setEditGsm] = useState('240 GSM Heavyweight');
  const [editMaterial, setEditMaterial] = useState('100% Combed Organic Cotton');
  const [editFit, setEditFit] = useState('Oversized Drop-Shoulder');
  const [editSizes, setEditSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [editColorName, setEditColorName] = useState('Standard');
  const [editColorHex, setEditColorHex] = useState('#111111');
  const [editImage, setEditImage] = useState('');
  const [editGallery, setEditGallery] = useState([]);
  const [editDescription, setEditDescription] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [uploadingEditGallery, setUploadingEditGallery] = useState(false);

  // Form State
  const [categoryPreset, setCategoryPreset] = useState('T-Shirts');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(30000);
  const [category, setCategory] = useState('T-Shirts');
  const [tag, setTag] = useState('New Drop');
  const [gsm, setGsm] = useState('240 GSM Heavyweight');
  const [material, setMaterial] = useState('100% Combed Organic Cotton');
  const [fit, setFit] = useState('Oversized Drop-Shoulder');
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [colorName, setColorName] = useState('Obsidian Black');
  const [colorHex, setColorHex] = useState('#111111');
  const [image, setImage] = useState('/images/hero-tee-black.png');
  const [gallery, setGallery] = useState(['/images/hero-tee-black.png']);
  const [urlInput, setUrlInput] = useState('');
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [description, setDescription] = useState('Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.');
  const [stock, setStock] = useState(15);

  // Preset Image Options for quick selection
  const presetImages = [
    { name: 'Terracotta Stripe Polo Front', url: '/images/terracotta-stripe-polo-front.jpg' },
    { name: 'Terracotta Polo Embroidery Detail', url: '/images/terracotta-stripe-polo-detail.jpg' },
    { name: 'Denim Collar Shirt Front', url: '/images/linen-denim-collar-shirt-front.jpg' },
    { name: 'Denim Collar Detail', url: '/images/linen-denim-collar-shirt-detail.jpg' },
    { name: 'Blue Striped Shirt Front', url: '/images/stripe-shirt-blue-front.jpg' },
    { name: 'Blue Striped Fabric Detail', url: '/images/stripe-shirt-blue-detail.jpg' },
    { name: 'Wonderland Crochet Shirt', url: '/images/wonderland-shirt-front.jpg' },
    { name: 'Wonderland Texture Detail', url: '/images/wonderland-shirt-detail.jpg' },
    { name: 'Raw Indigo Jeans', url: '/images/jeans-raw-indigo.jpg' },
    { name: 'Washed Black Jeans', url: '/images/jeans-washed-black.jpg' },
    { name: 'Vintage Denim Jorts', url: '/images/short-jeans-jorts.jpg' },
    { name: 'Linen Beach Pants', url: '/images/beach-pants-linen.jpg' },
    { name: 'Noir Black Tee', url: '/images/hero-tee-black.png' },
    { name: 'Dark Cat Silhouette', url: '/images/media__1786369649479.jpg' },
  ];

  const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Handle category preset selection
  const handleCategorySelect = (cat) => {
    setCategoryPreset(cat);
    setCategory(cat);
    if (cat === 'T-Shirts') {
      setPrice(30000);
      setTag('Heavyweight Tee');
      setGsm('240 GSM Heavyweight');
      setMaterial('100% Combed Organic Cotton');
      setFit('Oversized Drop-Shoulder');
      setImage('/images/hero-tee-black.png');
      setGallery(['/images/hero-tee-black.png']);
      setPreviewActiveIndex(0);
      setDescription('Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.');
    } else if (cat === 'Jeans') {
      setPrice(65000);
      setTag('Luxury Denim');
      setGsm('14.5oz Heavyweight Denim');
      setMaterial('100% Shuttle-Loom Selvedge Cotton');
      setFit('Relaxed Straight Leg');
      setImage('/images/jeans-raw-indigo.jpg');
      setGallery(['/images/jeans-raw-indigo.jpg']);
      setPreviewActiveIndex(0);
      setDescription('Crafted from 14.5oz Japanese shuttle-loom selvedge denim. Features relaxed straight drape and antique brass hardware.');
    } else if (cat === 'Short Jeans') {
      setPrice(45000);
      setTag('Vintage Jorts');
      setGsm('13oz Heavyweight Denim');
      setMaterial('100% Vintage Washed Cotton');
      setFit('Baggy Knee-Length Jorts');
      setImage('/images/short-jeans-jorts.jpg');
      setGallery(['/images/short-jeans-jorts.jpg']);
      setPreviewActiveIndex(0);
      setDescription('13oz heavyweight vintage washed denim shorts with signature raw frayed hem, relaxed baggy streetwear silhouette.');
    } else if (cat === 'Beach Pants') {
      setPrice(50000);
      setTag('Pure Linen');
      setGsm('240 GSM Pure Flax Linen');
      setMaterial('100% Breathable European Linen');
      setFit('Relaxed Wide-Leg Flow');
      setImage('/images/beach-pants-linen.jpg');
      setGallery(['/images/beach-pants-linen.jpg']);
      setPreviewActiveIndex(0);
      setDescription('Tailored from 240 GSM pure European flax linen with elasticated drawstring waistband and breathable flowy silhouette.');
    }
  };

  // Toggle size availability
  const toggleSize = (size) => {
    if (sizes.includes(size)) {
      if (sizes.length === 1) {
        toast.error('Product must have at least one available size');
        return;
      }
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  // Reorder or set main image for new product
  const handleSetPrimaryImage = (idx) => {
    setGallery((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      const nextGallery = [target, ...rest];
      setImage(target);
      setPreviewActiveIndex(0);
      return nextGallery;
    });
    toast.success('Set as primary cover image');
  };

  const handleRemoveImage = (idx) => {
    if (gallery.length <= 1) {
      toast.error('Product must have at least one image');
      return;
    }
    setGallery((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setImage(next[0]);
      setPreviewActiveIndex(0);
      return next;
    });
  };

  const handleAddUrlToGallery = () => {
    if (!urlInput.trim()) return;
    const clean = urlInput.trim();
    setGallery((prev) => {
      const isInitialDefault = prev.length === 1 && prev[0] === '/images/hero-tee-black.png';
      return isInitialDefault ? [clean] : [...prev, clean];
    });
    setImage(clean);
    setUrlInput('');
    toast.success('Image URL added to gallery!');
  };

  const handleSelectPreset = (pUrl) => {
    setGallery((prev) => {
      if (prev.includes(pUrl)) return prev;
      const isInitialDefault = prev.length === 1 && prev[0] === '/images/hero-tee-black.png';
      return isInitialDefault ? [pUrl] : [...prev, pUrl];
    });
    setImage(pUrl);
    toast.success('Preset added to product photos!');
  };

  // Handle multi-image upload from device for new product
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const compressedUrls = [];
      for (const f of files) {
        const compressed = await compressImageFile(f);
        if (compressed) compressedUrls.push(compressed);
      }

      if (compressedUrls.length > 0) {
        setGallery(compressedUrls);
        setImage(compressedUrls[0]);
        setPreviewActiveIndex(0);
        toast.success(
          compressedUrls.length > 1
            ? `${compressedUrls.length} photos ready for product!`
            : 'Photo ready for product!'
        );
      }
    } catch (err) {
      toast.error('Upload notice: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Open Edit Product Modal
  const handleOpenEdit = (product) => {
    isInitialModalLoad.current = true;
    setAutoSaveStatus('idle');
    setEditingProduct(product);
    setEditTitle(product.title || '');
    setEditPrice(Number(product.price) || 30000);
    setEditCategory(product.category || 'T-Shirts');
    setEditStock(product.stock !== undefined ? Number(product.stock) : 10);
    setEditTag(product.tag || 'Luxury Essential');
    setEditGsm(product.gsm || '240 GSM Heavyweight');
    setEditMaterial(product.material || '100% Combed Organic Cotton');
    setEditFit(product.fit || 'Oversized Drop-Shoulder');
    setEditSizes(Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL']);
    setEditColorName(product.colors?.[0]?.name || 'Standard');
    setEditColorHex(product.colors?.[0]?.hex || '#111111');
    const initialGallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : (product.image ? [product.image] : []);
    setEditGallery(initialGallery);
    setEditImage(initialGallery[0] || product.image || '');
    setEditDescription(product.description || '');
    setIsEditModalOpen(true);

    setTimeout(() => {
      isInitialModalLoad.current = false;
    }, 400);
  };

  // Real-time auto-save as admin edits garment fields
  useEffect(() => {
    if (!isEditModalOpen || !editingProduct || isInitialModalLoad.current) return;
    if (!editTitle.trim() || !editPrice || editPrice <= 0) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveStatus('saving');

    autoSaveTimerRef.current = setTimeout(async () => {
      const payload = {
        ...editingProduct,
        id: editingProduct.id,
        title: editTitle.trim(),
        price: Number(editPrice),
        category: editCategory,
        stock: Number(editStock) || 0,
        tag: editTag,
        gsm: editGsm,
        material: editMaterial,
        fit: editFit,
        sizes: editSizes,
        colors: [{ name: editColorName || 'Standard', hex: editColorHex || '#111111' }],
        image: editGallery[0] || editImage,
        fallbackImage: editGallery[1] || editGallery[0] || editImage,
        gallery: editGallery.length > 0 ? editGallery : [editImage],
        description: editDescription,
        isCustom: editingProduct.isCustom !== undefined ? editingProduct.isCustom : true,
      };

      // 1. Instantly persist to localStorage & broadcast across store tabs
      saveStoredCustomProduct(payload);
      setProducts((prev) => prev.map((p) => (p.id === payload.id ? payload : p)));

      // 2. Persist to server in background
      try {
        await updateProductAction(payload);
      } catch (err) {}

      setAutoSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    isEditModalOpen,
    editingProduct,
    editTitle,
    editPrice,
    editCategory,
    editStock,
    editTag,
    editGsm,
    editMaterial,
    editFit,
    editSizes,
    editColorName,
    editColorHex,
    editImage,
    editGallery,
    editDescription,
  ]);

  // Toggle size availability for edited product
  const toggleEditSize = (sz) => {
    if (editSizes.includes(sz)) {
      if (editSizes.length === 1) {
        toast.error('Product must have at least one available size');
        return;
      }
      setEditSizes(editSizes.filter(s => s !== sz));
    } else {
      setEditSizes([...editSizes, sz]);
    }
  };

  // Handle multi-image upload from device for edited product (replaces old photos)
  const handleEditFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingEditGallery(true);
    try {
      const compressedUrls = [];
      for (const f of files) {
        const compressed = await compressImageFile(f);
        if (compressed) compressedUrls.push(compressed);
      }

      if (compressedUrls.length > 0) {
        // REPLACE old photos with newly uploaded photos
        setEditGallery(compressedUrls);
        setEditImage(compressedUrls[0]);
        toast.success(
          compressedUrls.length > 1
            ? `${compressedUrls.length} new photos set! Old photos replaced.`
            : 'New photo set! Old photo replaced.'
        );
      }
    } catch (err) {
      toast.error('Upload notice: ' + err.message);
    } finally {
      setUploadingEditGallery(false);
    }
  };

  const handleSetEditPrimaryImage = (idx) => {
    setEditGallery((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      const nextGallery = [target, ...rest];
      setEditImage(target);
      return nextGallery;
    });
    toast.success('Set as primary cover image');
  };

  const handleRemoveGalleryImage = (idx) => {
    setEditGallery((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0) {
        setEditImage(next[0]);
      } else {
        setEditImage('');
      }
      return next;
    });
    toast.success('Photo deleted');
  };

  // Submit edited product changes
  const handleSaveEditProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingProduct) return;
    if (!editTitle.trim()) {
      toast.error('Product title cannot be empty');
      return;
    }
    if (!editPrice || editPrice <= 0) {
      toast.error('Valid product price required');
      return;
    }

    setSavingEdit(true);

    const payload = {
      ...editingProduct,
      id: editingProduct.id,
      title: editTitle.trim(),
      price: Number(editPrice),
      category: editCategory,
      stock: Number(editStock) || 0,
      tag: editTag,
      gsm: editGsm,
      material: editMaterial,
      fit: editFit,
      sizes: editSizes,
      colors: [{ name: editColorName || 'Standard', hex: editColorHex || '#111111' }],
      image: editGallery[0] || editImage,
      fallbackImage: editGallery[1] || editGallery[0] || editImage,
      gallery: editGallery.length > 0 ? editGallery : [editImage],
      description: editDescription,
      isCustom: editingProduct.isCustom !== undefined ? editingProduct.isCustom : true,
    };

    // 1. Instantly save to local storage & broadcast across all store tabs
    saveStoredCustomProduct(payload);
    setProducts((prev) => prev.map((p) => (p.id === payload.id ? payload : p)));

    // 2. Persist to server
    try {
      const res = await updateProductAction(payload);
      if (res && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === payload.id ? res.product : p)));
      }
    } catch (err) {
      console.warn('Server sync notice:', err.message);
    }

    toast.success(`Saved "${payload.title}"! Live on website.`);
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setSavingEdit(false);
    router.refresh();
  };

  // Submit new product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter product title');
      return;
    }
    if (!price || price <= 0) {
      toast.error('Please enter valid product price');
      return;
    }
    if (sizes.length === 0) {
      toast.error('Please select at least one available size');
      return;
    }

    setLoading(true);

    const productPayload = {
      title: title.trim(),
      price: Number(price),
      category,
      tag,
      gsm,
      material,
      fit,
      sizes,
      colorName,
      colorHex,
      image: gallery[0] || image,
      fallbackImage: gallery[1] || gallery[0] || image,
      gallery: gallery && gallery.length > 0 ? gallery : [image],
      description,
      stock: Number(stock) || 15,
      isCustom: true,
    };

    try {
      const result = await createProductAction(productPayload);
      const finalProduct = (result && result.product) 
        ? result.product 
        : { ...productPayload, id: `kwt-custom-${Date.now().toString().slice(-6)}` };

      // 1. Instantly save to local storage & broadcast
      saveStoredCustomProduct(finalProduct);
      setProducts([finalProduct, ...products]);

      toast.success('Product published to live store!');

      // Reset form fields
      setTitle('');
      setDescription('');
      setGallery(['/images/hero-tee-black.png']);
      setImage('/images/hero-tee-black.png');
      setPreviewActiveIndex(0);
      setActiveTab('catalog');
      router.refresh();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete custom product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the store?')) {
      return;
    }

    // 1. Remove from local storage & broadcast
    removeStoredCustomProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success('Product removed from store');

    try {
      await deleteProductAction(productId);
      router.refresh();
    } catch (err) {
      console.warn('Server delete notice:', err.message);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    router.refresh();
  };

  const formatPrice = (amt) => `₦${Number(amt || 0).toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-black/[0.04]">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <KlasikLogo height={28} className="w-auto" fill="#111111" />
          </Link>
          <span className="h-4 w-px bg-black/[0.1]" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold border border-[#DDD6FE]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Concierge</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              broadcastProductChange({}, 'refresh');
              router.refresh();
              toast.success('Storefront synchronized across all open windows!');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] border border-[#DDD6FE] px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-xs"
            title="Force refresh & sync storefront"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Storefront</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#7C3AED] bg-white hover:bg-gray-50 border border-black/[0.06] px-4 py-2 rounded-full transition-all shadow-xs"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-3.5 py-2 rounded-full transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <span className="text-[11px] font-bold text-gray-400 block mb-1">TOTAL PRODUCTS</span>
          <span className="text-2xl font-bold text-[#111111]">{products.length}</span>
          <span className="text-[11px] text-[#7C3AED] block mt-1 font-semibold">Active in Catalog</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <span className="text-[11px] font-bold text-gray-400 block mb-1">CUSTOM ADDED</span>
          <span className="text-2xl font-bold text-[#7C3AED]">
            {products.filter((p) => p.isCustom).length}
          </span>
          <span className="text-[11px] text-gray-500 block mt-1 font-semibold">Dynamic Additions</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <span className="text-[11px] font-bold text-gray-400 block mb-1">PRICING TIERS</span>
          <span className="text-sm font-bold text-[#111111] block mt-1">₦30k &bull; ₦35k &bull; ₦40k</span>
          <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">Fixed Transparent</span>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <span className="text-[11px] font-bold text-gray-400 block mb-1">FREE DELIVERY</span>
          <span className="text-2xl font-bold text-emerald-600">₦200k+</span>
          <span className="text-[11px] text-gray-500 block mt-1 font-semibold">Complimentary Courier</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-[#EDEDEF]/60 p-1.5 rounded-full w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('new-product')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'new-product'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'text-gray-600 hover:text-[#111111]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Product</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'text-gray-600 hover:text-[#111111]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>All Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'text-gray-600 hover:text-[#111111]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: ADD NEW PRODUCT FORM */}
      {activeTab === 'new-product' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Input Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-black/[0.04] p-6 sm:p-8 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
            <div className="pb-4 mb-6 border-b border-black/[0.04]">
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider block mb-1">
                New Garment Release
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                Add Product to Store Catalog
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                New products publish immediately to the homepage feed, filters, search, and checkout.
              </p>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-6">
              
              {/* Product Category Quick Presets */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  Select Product Category Preset *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('T-Shirts')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'T-Shirts'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">T-Shirts</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦30,000</strong>
                    <span className="text-[10px] text-gray-400">240 GSM Cotton</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Jeans')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Jeans'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Jeans</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦65,000</strong>
                    <span className="text-[10px] text-gray-400">14.5oz Selvedge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Short Jeans')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Short Jeans'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Short Jeans</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦45,000</strong>
                    <span className="text-[10px] text-gray-400">13oz Jorts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Beach Pants')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Beach Pants'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Beach Pants</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦50,000</strong>
                    <span className="text-[10px] text-gray-400">240 GSM Linen</span>
                  </button>
                </div>
              </div>

              {/* Title & Price Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Klasik Obsidian Heavyweight Boxy Tee"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] font-bold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category & Badge Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Collection Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none transition-all cursor-pointer"
                  >
                    <option value="T-Shirts">T-Shirts (Heavyweight Cotton)</option>
                    <option value="Jeans">Jeans (Luxury Denim)</option>
                    <option value="Short Jeans">Short Jeans (Vintage Denim Jorts)</option>
                    <option value="Beach Pants">Beach Pants (Pure Linen)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Card Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Drop, Limited Drop, Best Seller"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Available Sizes Toggle (Grey-Out feature support) */}
              <div className="bg-[#F7F7F8] rounded-[20px] p-4 sm:p-5 border border-black/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111111] block">
                    Available Sizes in Stock *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Unchecked sizes are greyed out on the website
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {standardSizes.map((sz) => {
                    const isAvailable = sizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => toggleSize(sz)}
                        className={`h-9 px-4 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isAvailable
                            ? 'bg-[#111111] text-white shadow-xs'
                            : 'bg-[#EDEDEF] text-gray-400 line-through hover:bg-gray-200'
                        }`}
                      >
                        {isAvailable && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{sz}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Garment Construction Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    GSM Fabric Weight
                  </label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Silhouette & Fit
                  </label>
                  <input
                    type="text"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none"
                  />
                </div>
              </div>

              {/* Material Composition */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Material Composition
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none"
                />
              </div>

              {/* Color Name & Hex */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Obsidian Black, Sky Blue"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Color Hex
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-9 h-9 rounded-full cursor-pointer border border-black/[0.1] p-0.5"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="flex-1 bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2.5 text-xs text-[#111111] font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Photos & Angles Gallery Uploader */}
              <div className="bg-[#F7F7F8] rounded-[22px] p-4 sm:p-5 border border-black/[0.04] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#111111] block">
                      Product Photos &amp; Angle Views ({gallery.length}) *
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Upload 1 or more photos from your device (Front view, back view, fabric details).
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 rounded-full cursor-pointer shadow-xs transition-all self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading Photos...' : '+ Upload Photos (1 or Multiple)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Uploaded Gallery Thumbnails Strip */}
                {gallery.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                      Current Product Gallery (Click &quot;Set as Cover&quot; to pick the default angle):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {gallery.map((gImg, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-[14px] bg-[#EDEDEF] overflow-hidden border p-1 group flex flex-col justify-between aspect-[3/4] ${
                            idx === 0
                              ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                              : 'border-black/[0.08]'
                          }`}
                        >
                          <img src={gImg} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover rounded-[10px]" />
                          
                          {/* Angle Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            {idx === 0 ? (
                              <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Cover Photo
                              </span>
                            ) : idx === 1 ? (
                              <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Angle 2 / Back
                              </span>
                            ) : (
                              <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Angle {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Delete Button */}
                          {gallery.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-all cursor-pointer z-10"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Set Cover Button (for non-primary images) */}
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="absolute bottom-2 left-2 right-2 bg-white/95 hover:bg-white text-[#7C3AED] text-[10px] font-bold py-1 px-2 rounded-full text-center shadow-xs transition-all cursor-pointer z-10"
                            >
                              Set as Cover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional URL Adder */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Or paste an image URL to add to gallery..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-white border border-black/[0.06] rounded-full px-4 py-2 text-xs text-[#111111] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlToGallery}
                    className="bg-[#111111] text-white hover:bg-gray-800 text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all shrink-0"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Preset image buttons */}
                <div className="pt-2 border-t border-black/[0.04]">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                    Or click archive preset to add as another angle:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {presetImages.map((pImg) => (
                      <button
                        type="button"
                        key={pImg.url}
                        onClick={() => handleSelectPreset(pImg.url)}
                        className="p-1 rounded-[12px] border text-center transition-all cursor-pointer border-black/[0.06] bg-white hover:border-[#7C3AED] hover:shadow-xs"
                        title={`Add ${pImg.name} to gallery`}
                      >
                        <div className="w-full h-10 rounded-[8px] bg-[#EDEDEF] overflow-hidden mb-1 flex items-center justify-center">
                          <img src={pImg.url} alt={pImg.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8px] text-gray-600 truncate block font-medium">
                          {pImg.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[16px] p-3 text-xs text-[#111111] outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-sm font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Product...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Publish Product to Store</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right: Real-time Live Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-8">
            <div className="bg-white rounded-[24px] border border-black/[0.04] p-5 sm:p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.04]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Live Storefront Card Preview</span>
                </span>
                <span className="text-[10px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                  Real-Time
                </span>
              </div>

              {/* Mock Product Card exactly matching home page */}
              <div className="bg-[#EDEDEF]/30 rounded-[20px] p-3 border border-black/[0.04]">
                <div className="relative aspect-[3/4] rounded-[16px] bg-[#EDEDEF] overflow-hidden mb-3 flex items-center justify-center">
                  {(gallery[previewActiveIndex] || image) ? (
                    <img 
                      src={gallery[previewActiveIndex] || image} 
                      alt={title || 'Product Preview'} 
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="text-xs text-gray-400 font-bold">KLASIK</div>
                  )}

                  {tag && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="inline-block bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                        {tag}
                      </span>
                    </div>
                  )}

                  {/* Multi-angle indicator dots */}
                  {gallery.length > 1 && (
                    <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10">
                      {gallery.map((_, dotIdx) => (
                        <button
                          type="button"
                          key={dotIdx}
                          onClick={() => setPreviewActiveIndex(dotIdx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            previewActiveIndex === dotIdx
                              ? 'bg-[#7C3AED] w-4'
                              : 'bg-white/80 w-2 hover:bg-white'
                          }`}
                          aria-label={`View angle ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 px-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span>{category}</span>
                    <span>{gsm}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#111111] truncate">
                    {title || 'Product Title Appears Here'}
                  </h4>

                  <div className="text-sm font-bold text-[#7C3AED]">
                    {formatPrice(price)}
                  </div>

                  {/* Size chips preview */}
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-400 block mb-1">Available Sizes:</span>
                    <div className="flex flex-wrap gap-1">
                      {standardSizes.map((sz) => {
                        const isAvail = sizes.includes(sz);
                        return (
                          <span
                            key={sz}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                              isAvail
                                ? 'bg-white text-[#111111] border border-black/[0.08] shadow-2xs'
                                : 'bg-[#EDEDEF] text-gray-400 line-through opacity-50'
                            }`}
                          >
                            {sz}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3">
                    <div className="w-full bg-[#111111] text-white text-xs font-bold py-2.5 rounded-full text-center">
                      Quick Add &bull; {formatPrice(price)}
                    </div>
                  </div>

                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                This shows how shoppers see this piece on mobile and desktop feeds.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ALL PRODUCTS CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[20px] p-5 border border-black/[0.04]">
            <div>
              <h3 className="font-bold text-lg text-[#111111]">Store Products Archive</h3>
              <p className="text-xs text-gray-500">
                Manage all active collection pieces currently available on Klasik Wardrobe.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('new-product')}
              className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-[20px] border border-black/[0.04] p-4 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-[14px] bg-[#EDEDEF] overflow-hidden mb-3">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {prod.isCustom ? (
                        <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Custom Added
                        </span>
                      ) : (
                        <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Verified Catalog
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase truncate">
                        {prod.category} &bull; {prod.gsm || '240 GSM'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        (prod.stock !== undefined && prod.stock <= 2)
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        Stock: {prod.stock !== undefined ? prod.stock : 15} left
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#111111] line-clamp-1">
                      {prod.title}
                    </h4>
                    <span className="text-xs font-bold text-[#7C3AED] block">
                      {formatPrice(prod.price)}
                    </span>

                    {/* Sizes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {standardSizes.map((sz) => {
                        const isAvail = Array.isArray(prod.sizes) && prod.sizes.includes(sz);
                        return (
                          <span
                            key={sz}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                              isAvail
                                ? 'bg-[#EDEDEF] text-[#111111]'
                                : 'bg-transparent text-gray-300 line-through'
                            }`}
                          >
                            {sz}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(prod)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#DDD6FE] text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Edit garment details, price, sizes, images, stock"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${prod.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-[#7C3AED]"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <div className="pb-4 mb-6 border-b border-black/[0.04] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-[#111111]">Store Orders</h3>
              <p className="text-xs text-gray-500">
                Track payments, order amounts, and direct customer dispatch.
              </p>
            </div>
            <span className="text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] px-3 py-1 rounded-full">
              {orders.length} Total Orders
            </span>
          </div>

          {orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {orders.map((order) => {
                    const parsedAddress = typeof order.shipping_address === 'string'
                      ? JSON.parse(order.shipping_address)
                      : order.shipping_address;
                    const phone = parsedAddress?.phone || '';
                    const customerName = parsedAddress?.name || 'Customer';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#7C3AED]">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111111]">
                          {customerName}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {parsedAddress?.city || 'Lagos'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111111]">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            {order.payment_status || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-[#10B981] hover:bg-[#059669] text-white px-2.5 py-1 rounded-full font-bold text-[10px] transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500">No web form orders recorded yet.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Orders placed via WhatsApp chat directly with the store owner.
              </p>
            </div>
          )}
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-[28px] border border-black/[0.08] shadow-2xl p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 mb-6 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                    Product Editor &bull; ID: {editingProduct.id}
                  </span>
                  {autoSaveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Auto-saving...</span>
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Saved automatically{lastSavedTime ? ` (${lastSavedTime})` : ''}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                  Edit Garment Details
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">
                    Changes save automatically and refresh the live storefront immediately.
                  </p>
                  <Link
                    href={`/product/${editingProduct.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full transition-all shrink-0 shadow-xs"
                  >
                    <span>View on Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#111111] transition-all cursor-pointer"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-6">
              
              {/* Product Title */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                />
              </div>

              {/* Price & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Product Price (₦) *
                  </label>
                  <span className="text-xs font-bold text-[#7C3AED]">
                    Current: ₦{Number(editPrice || 0).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 self-center">Presets:</span>
                  {[30000, 35000, 40000, 50000, 65000].map((pr) => (
                    <button
                      type="button"
                      key={pr}
                      onClick={() => setEditPrice(pr)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        Number(editPrice) === pr
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-[#EDEDEF]/60 text-gray-700 border-black/[0.04] hover:bg-gray-200'
                      }`}
                    >
                      ₦{pr.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Inventory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Inventory Stock Count
                  </label>
                  <span className={`text-xs font-bold ${editStock <= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {editStock === 0 ? 'Out of Stock' : `${editStock} Available in Stock`}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 self-center">Stock Presets:</span>
                  {[
                    { label: 'Sold Out (0)', val: 0 },
                    { label: '1 Left', val: 1 },
                    { label: '2 Left', val: 2 },
                    { label: '5 Units', val: 5 },
                    { label: '10 Units', val: 10 },
                    { label: '20 Units', val: 20 },
                  ].map((st) => (
                    <button
                      type="button"
                      key={st.val}
                      onClick={() => setEditStock(st.val)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        Number(editStock) === st.val
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#EDEDEF]/60 text-gray-700 border-black/[0.04] hover:bg-gray-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                  >
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Beach Pants">Beach Pants</option>
                    <option value="Shorts">Shorts</option>
                    <option value="Tracksuits">Tracksuits</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Badge / Tag
                  </label>
                  <select
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                  >
                    <option value="New Drop">New Drop</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Limited Edition">Limited Edition</option>
                    <option value="Luxury Essential">Luxury Essential</option>
                    <option value="Raw Denim">Raw Denim</option>
                    <option value="Pure Linen">Pure Linen</option>
                  </select>
                </div>
              </div>

              {/* Fabric GSM & Fit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    GSM / Fabric Weight
                  </label>
                  <input
                    type="text"
                    value={editGsm}
                    onChange={(e) => setEditGsm(e.target.value)}
                    placeholder="e.g. 240 GSM Heavyweight"
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Silhouette Fit
                  </label>
                  <input
                    type="text"
                    value={editFit}
                    onChange={(e) => setEditFit(e.target.value)}
                    placeholder="e.g. Oversized Drop-Shoulder"
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Available Sizes Toggles */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Available Sizes * (Click to toggle availability)
                </label>
                <div className="flex flex-wrap gap-2">
                  {standardSizes.map((sz) => {
                    const isSelected = editSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => toggleEditSize(sz)}
                        className={`px-4 py-2 rounded-[12px] text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                            : 'bg-white text-gray-400 border-black/[0.08] line-through hover:border-gray-300'
                        }`}
                      >
                        {sz} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  E.g. If only Medium is available, deselect others so only Medium can be ordered.
                </p>
              </div>

              {/* Product Photos & Angles Gallery */}
              <div className="bg-[#F7F7F8] rounded-[22px] p-4 sm:p-5 border border-black/[0.04] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#111111] block">
                      Product Photos &amp; Angle Views ({editGallery.length}) *
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Upload 1 or multiple photos from your device (front, back, fabric details).
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {editGallery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditGallery([]);
                          setEditImage('');
                          toast.success('Old photos deleted. Upload new photos.');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full cursor-pointer transition-all border border-red-200"
                        title="Remove all photos from this product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete All Old Photos</span>
                      </button>
                    )}
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 rounded-full cursor-pointer shadow-xs transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingEditGallery ? 'Processing...' : '+ Upload New Photos'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleEditFilesUpload}
                        className="hidden"
                        disabled={uploadingEditGallery}
                      />
                    </label>
                  </div>
                </div>

                {/* Gallery Thumbnails Grid */}
                {editGallery.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                      Photo Angles (First photo is the default Cover shown on store cards):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {editGallery.map((gImg, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-[14px] bg-[#EDEDEF] overflow-hidden border p-1 group flex flex-col justify-between aspect-[3/4] ${
                            idx === 0
                              ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                              : 'border-black/[0.08]'
                          }`}
                        >
                          <img src={gImg} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover rounded-[10px]" />
                          
                          {/* Angle Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            {idx === 0 ? (
                              <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Cover Photo
                              </span>
                            ) : idx === 1 ? (
                              <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Angle 2 / Back
                              </span>
                            ) : (
                              <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Angle {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-all cursor-pointer z-10"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Set as Cover Button */}
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetEditPrimaryImage(idx)}
                              className="absolute bottom-2 left-2 right-2 bg-white/95 hover:bg-white text-[#7C3AED] text-[10px] font-bold py-1 px-2 rounded-full text-center shadow-xs transition-all cursor-pointer z-10"
                            >
                              Set as Cover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paste URL directly */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => {
                      setEditImage(e.target.value);
                      if (e.target.value && !editGallery.includes(e.target.value)) {
                        setEditGallery((prev) => [e.target.value, ...prev]);
                      }
                    }}
                    placeholder="Or paste an image URL to add..."
                    className="flex-1 bg-white border border-black/[0.06] rounded-full px-4 py-2 text-xs text-[#111111] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editImage && !editGallery.includes(editImage)) {
                        setEditGallery((prev) => [...prev, editImage]);
                        toast.success('Added to gallery!');
                      }
                    }}
                    className="bg-[#111111] text-white hover:bg-gray-800 text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all shrink-0"
                  >
                    + Add URL
                  </button>
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] p-3 text-xs text-[#111111] outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-full border border-black/[0.1] text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {savingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
