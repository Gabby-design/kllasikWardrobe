'use client';

import { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createProductAction, deleteProductAction } from '../../../app/actions/adminProducts';
import { logoutAdmin } from '../../../app/actions/adminAuth';
import { KlasikLogo } from '../KlasikLogo';

export function AdminDashboard({ initialProducts, initialOrders }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('new-product'); // 'new-product' | 'catalog' | 'orders'
  const [products, setProducts] = useState(initialProducts || []);
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
  const [description, setDescription] = useState('Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.');
  const [stock, setStock] = useState(15);

  // Preset Image Options for quick selection
  const presetImages = [
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
      setDescription('Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.');
    } else if (cat === 'Jeans') {
      setPrice(65000);
      setTag('Luxury Denim');
      setGsm('14.5oz Heavyweight Denim');
      setMaterial('100% Shuttle-Loom Selvedge Cotton');
      setFit('Relaxed Straight Leg');
      setImage('/images/jeans-raw-indigo.jpg');
      setDescription('Crafted from 14.5oz Japanese shuttle-loom selvedge denim. Features relaxed straight drape and antique brass hardware.');
    } else if (cat === 'Short Jeans') {
      setPrice(45000);
      setTag('Vintage Jorts');
      setGsm('13oz Heavyweight Denim');
      setMaterial('100% Vintage Washed Cotton');
      setFit('Baggy Knee-Length Jorts');
      setImage('/images/short-jeans-jorts.jpg');
      setDescription('13oz heavyweight vintage washed denim shorts with signature raw frayed hem, relaxed baggy streetwear silhouette.');
    } else if (cat === 'Beach Pants') {
      setPrice(50000);
      setTag('Pure Linen');
      setGsm('240 GSM Pure Flax Linen');
      setMaterial('100% Breathable European Linen');
      setFit('Relaxed Wide-Leg Flow');
      setImage('/images/beach-pants-linen.jpg');
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

  // Handle image upload from device
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImage(data.url);
        if (data.storage === 'supabase') {
          toast.success('Image stored in Supabase backend!');
        } else {
          toast.success('Image uploaded successfully!');
        }
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      toast.error('Image upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
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
      title,
      price: Number(price),
      category,
      tag,
      gsm,
      material,
      fit,
      sizes,
      colorName,
      colorHex,
      image,
      description,
      stock: Number(stock) || 15,
    };

    try {
      const result = await createProductAction(productPayload);
      if (result.success && result.product) {
        toast.success('Product published to live store!');
        setProducts([result.product, ...products]);
        // Reset form fields
        setTitle('');
        setDescription('');
        setActiveTab('catalog');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create product');
      }
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

    try {
      const result = await deleteProductAction(productId);
      if (result.success) {
        toast.success('Product removed from store');
        setProducts(products.filter((p) => p.id !== productId));
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to remove product');
      }
    } catch (err) {
      toast.error('Error deleting product: ' + err.message);
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

        <div className="flex items-center gap-3">
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
                    placeholder="e.g. Klassic Obsidian Heavyweight Boxy Tee"
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

              {/* Image Selection & Upload */}
              <div className="bg-[#F7F7F8] rounded-[20px] p-4 sm:p-5 border border-black/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-[#111111] block">
                    Product Image *
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Paste image URL (e.g. /images/hero-tee-black.png)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-white border border-black/[0.06] rounded-full px-4 py-2.5 text-xs text-[#111111] outline-none mb-3"
                />

                {/* Preset image buttons */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                    Or pick from brand archive presets:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {presetImages.map((pImg) => (
                      <button
                        type="button"
                        key={pImg.url}
                        onClick={() => setImage(pImg.url)}
                        className={`p-1 rounded-[12px] border text-center transition-all cursor-pointer ${
                          image === pImg.url
                            ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30 bg-white'
                            : 'border-black/[0.06] bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="w-full h-12 rounded-[8px] bg-[#EDEDEF] overflow-hidden mb-1 flex items-center justify-center">
                          <img src={pImg.url} alt={pImg.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] text-gray-600 truncate block font-medium">
                          {pImg.name}
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
                  {image ? (
                    <img 
                      src={image} 
                      alt={title || 'Product Preview'} 
                      className="w-full h-full object-cover"
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
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">
                      {prod.category} &bull; {prod.gsm || '240 GSM'}
                    </span>
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
                  <Link
                    href={`/product/${prod.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-[#7C3AED]"
                  >
                    <span>View Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {prod.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 p-1 cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
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

    </div>
  );
}
