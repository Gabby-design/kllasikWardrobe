'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  RefreshCw,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  UserCheck,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createProductAction, deleteProductAction, updateProductAction, resetCatalogAction, repairImagesAction } from '../../../app/actions/adminProducts';
import { getLiveAnalyticsAction } from '../../../app/actions/adminAnalytics';
import { logoutAdmin } from '../../../app/actions/adminAuth';
import { KlasikLogo } from '../KlasikLogo';
import { 
  startLiveCatalogSync,
  resetToServerCatalog,
  runStorageMigration
} from '../../utils/productSync.js';
import { normalizeHex, isValidHex } from '../../lib/colorUtils.js';

export function AdminDashboard({
  initialProducts,
  initialOrders,
  isDatabaseConfigured = true,
  initialAnalytics = null,
  initialAnalyticsError = null,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('new-product'); // 'new-product' | 'catalog' | 'orders' | 'analytics'
  const [products, setProducts] = useState(initialProducts || []);
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all' | 'critical' | 'low' | 'sold-out' | 'in-stock'
  const [catalogSearch, setCatalogSearch] = useState('');

  // Visitor & Traffic Analytics State
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [analyticsError, setAnalyticsError] = useState(initialAnalyticsError);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchLiveAnalytics = async (showToast = false) => {
    setAnalyticsLoading(true);
    try {
      const res = await getLiveAnalyticsAction();
      if (res?.success && res?.data) {
        setAnalytics(res.data);
        setAnalyticsError(null);
        if (showToast) toast.success('Analytics updated');
      } else {
        const err = res?.error || 'Failed to load analytics';
        setAnalyticsError(err);
        if (showToast) toast.error(err);
      }
    } catch (err) {
      const msg = err.message || 'Error updating analytics';
      setAnalyticsError(msg);
      if (showToast) toast.error(msg);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Auto-refresh every 60 seconds only while the analytics tab is visible
  useEffect(() => {
    if (activeTab !== 'analytics') return;

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchLiveAnalytics(false);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Auto-Save & Synchronization State
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'saving' | 'saved' | 'idle'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const isInitialModalLoad = useRef(true);

  // Quick inline stock updater & live push to all devices
  const handleQuickStockChange = async (prod, targetStock) => {
    const finalStock = Math.max(0, Number(targetStock || 0));
    try {
      const res = await updateProductAction({ ...prod, stock: finalStock });
      if (res?.success && res?.product) {
        setProducts((prev) => prev.map((p) => (p.id === prod.id ? res.product : p)));
        const timeStr = new Date().toLocaleTimeString('en-GB');
        toast.success(`Saved to database at ${timeStr}`, { id: `quick-stock-${prod.id}` });
      } else {
        toast.error(res?.error || 'Could not update stock in database');
      }
    } catch (e) {
      toast.error('Stock error: ' + e.message);
    }
  };

  // Manual one-click refresh from authoritative database
  const handleManualSyncToAllDevices = async () => {
    setManualSyncing(true);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
          toast.success(`Refreshed ${data.products.length} products from database!`, { duration: 3000 });
        }
      }
      router.refresh();
    } catch (err) {
      toast.error('Sync notice: ' + err.message);
    } finally {
      setManualSyncing(false);
    }
  };

  // Export catalog JSON to clipboard
  const handleExportCatalog = () => {
    try {
      const jsonStr = JSON.stringify(products, null, 2);
      navigator.clipboard.writeText(jsonStr);
      toast.success('Catalog JSON copied to clipboard! Ready to backup.', { duration: 4000 });
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  // Import catalog JSON and synchronize to server
  const handleImportCatalog = async () => {
    const raw = prompt('Paste your Products JSON array here:');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        toast.error('Invalid JSON: Must be an array of products');
        return;
      }
      setLoading(true);
      for (const prod of parsed) {
        if (prod && prod.id && prod.title) {
          const isBadUrl = (u) => typeof u === 'string' && (u.trim().toLowerCase().startsWith('data:') || u.trim().toLowerCase().startsWith('blob:'));
          if (isBadUrl(prod.image) || isBadUrl(prod.fallbackImage) || (Array.isArray(prod.gallery) && prod.gallery.some(isBadUrl))) {
            toast.error(`Cannot import "${prod.title}": contains invalid data: or blob: image URLs. Please use "Repair Images" or host images before importing.`);
            setLoading(false);
            return;
          }
          const res = await createProductAction(prod);
          if (!res?.success) {
            toast.error(`Import error for "${prod.title}": ${res?.error || 'Failed to save'}`);
            setLoading(false);
            return;
          }
        }
      }
      toast.success(`Imported and saved ${parsed.length} products to database!`, { duration: 4500 });
      router.refresh();
    } catch (err) {
      toast.error('Import error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset to authoritative server catalog (requires exact typed confirmation)
  const handleResetToServerCatalog = async () => {
    const typed = window.prompt(
      'DANGER: This will restore the base codebase catalog into the database. All custom products or edits made in the admin will be reverted.\n\nType "RESET CATALOG" to proceed:'
    );
    if (typed === 'RESET CATALOG') {
      resetToServerCatalog();
      try {
        const res = await resetCatalogAction('RESET CATALOG');
        if (res?.success) {
          toast.success('Restoring server catalog from codebase...');
          setTimeout(() => {
            window.location.reload();
          }, 400);
        } else {
          toast.error(res?.error || 'Failed to reset catalog');
        }
      } catch (err) {
        toast.error('Reset error: ' + err.message);
      }
    } else if (typed !== null) {
      toast.error('Reset aborted: Confirmation text did not match "RESET CATALOG".');
    }
  };

  // Run storage migration on mount to wipe stale localStorage, plus continuous live polling
  useEffect(() => {
    runStorageMigration();

    // Start continuous live sync across all devices
    const unsubscribe = startLiveCatalogSync((eventOrData) => {
      const liveList = Array.isArray(eventOrData)
        ? eventOrData
        : Array.isArray(eventOrData?.products)
        ? eventOrData.products
        : null;
      if (liveList && liveList.length > 0) {
        setProducts(liveList);
      }
    });

    return () => unsubscribe();
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
  const [editColors, setEditColors] = useState([{ name: 'Obsidian Black', hex: '#111111', image: '' }]);
  const [newEditColorName, setNewEditColorName] = useState('');
  const [newEditColorHexText, setNewEditColorHexText] = useState('#111111');
  const [newEditLastValidHex, setNewEditLastValidHex] = useState('#111111');
  const [newEditColorImage, setNewEditColorImage] = useState('');
  // Edit Product Images State (Tracked with upload status & retry capabilities)
  const [editImageItems, setEditImageItems] = useState([]);
  const [editUrlInput, setEditUrlInput] = useState('');
  const [editUrlError, setEditUrlError] = useState('');
  const [isDraggingEditPhoto, setIsDraggingEditPhoto] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditGallery, setUploadingEditGallery] = useState(false);
  const [invalidImageIndices, setInvalidImageIndices] = useState([]);

  // Derived for display / backwards compatibility
  const editGallery = editImageItems.map((img) => img.previewUrl);
  const editImage = editImageItems[0]?.previewUrl || '';

  // Repair Images Modal & State
  const [repairingImages, setRepairingImages] = useState(false);
  const [repairReport, setRepairReport] = useState(null);
  const [showRepairModal, setShowRepairModal] = useState(false);

  // Inventory Category Filter State
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('ALL');

  // Dynamically derived list of categories present across all products in store
  const existingCategories = useMemo(() => {
    const defaultList = ['T-Shirts', 'Jeans', 'Cargo Pants', 'Short Jeans', 'Beach Pants'];
    const set = new Set(defaultList);
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p.category && typeof p.category === 'string' && p.category.trim()) {
          set.add(p.category.trim());
        }
      });
    }
    return Array.from(set);
  }, [products]);

  // Form State (New Product)
  const [categoryPreset, setCategoryPreset] = useState('T-Shirts');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(30000);
  const [category, setCategory] = useState('T-Shirts');
  const [tag, setTag] = useState('New Drop');
  const [gsm, setGsm] = useState('240 GSM Heavyweight');
  const [material, setMaterial] = useState('100% Combed Organic Cotton');
  const [fit, setFit] = useState('Oversized Drop-Shoulder');
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [newProductColors, setNewProductColors] = useState([{ name: 'Obsidian Black', hex: '#111111', image: '' }]);
  const [addFormColorName, setAddFormColorName] = useState('');
  const [addFormColorHexText, setAddFormColorHexText] = useState('#111111');
  const [addFormLastValidHex, setAddFormLastValidHex] = useState('#111111');
  const [addFormColorImage, setAddFormColorImage] = useState('');
  
  // New Product Images State (Tracked with upload status & retry capabilities)
  const [newProductImages, setNewProductImages] = useState([
    {
      id: 'default-cover-1',
      file: null,
      previewUrl: '/images/hero-tee-black.png',
      isObjectUrl: false,
      finalUrl: '/images/hero-tee-black.png',
      status: 'uploaded',
      error: null,
    },
  ]);
  const [urlInput, setUrlInput] = useState('');
  const [urlInputError, setUrlInputError] = useState('');
  const [isDraggingNewPhoto, setIsDraggingNewPhoto] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  // Derived for preview card / backwards compatibility
  const gallery = newProductImages.map((img) => img.previewUrl);
  const image = newProductImages[0]?.previewUrl || '/images/hero-tee-black.png';
  const [description, setDescription] = useState('Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.');
  const [stock, setStock] = useState(15);

  const colorPresets = [
    { name: 'Obsidian Black', hex: '#111111' },
    { name: 'Pure White', hex: '#fafafa' },
    { name: 'Royal Blue', hex: '#2563EB' },
    { name: 'Wine Noir', hex: '#4a0e17' },
    { name: 'Terracotta Rust', hex: '#c85a32' },
    { name: 'Ecru Cream', hex: '#fdfbf7' },
    { name: 'Olive Green', hex: '#4b5320' },
    { name: 'Purple Accent', hex: '#7C3AED' },
    { name: 'Heather Grey', hex: '#9ca3af' },
  ];

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

  // Cleanup object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      newProductImages.forEach((img) => {
        if (img.isObjectUrl && img.previewUrl?.startsWith('blob:')) {
          try { URL.revokeObjectURL(img.previewUrl); } catch {}
        }
      });
      editImageItems.forEach((img) => {
        if (img.isObjectUrl && img.previewUrl?.startsWith('blob:')) {
          try { URL.revokeObjectURL(img.previewUrl); } catch {}
        }
      });
    };
  }, []);

  // AI Garment Analysis State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysisNotice, setAiAnalysisNotice] = useState(null);
  const [editIsAnalyzingAi, setEditIsAnalyzingAi] = useState(false);
  const [editAiNotice, setEditAiNotice] = useState(null);

  // Handle category preset selection
  const handleCategorySelect = (cat) => {
    setCategoryPreset(cat);
    setCategory(cat);
    let defaultImg = '/images/hero-tee-black.png';
    let defaultDesc = 'Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.';
    if (cat === 'T-Shirts') {
      setPrice(30000);
      setTag('Heavyweight Tee');
      setGsm('240 GSM Heavyweight');
      setMaterial('100% Combed Organic Cotton');
      setFit('Oversized Drop-Shoulder');
      defaultImg = '/images/hero-tee-black.png';
      defaultDesc = 'Crafted from 240 GSM combed organic cotton. Features clean minimalist cut with intentional dropped shoulder drape.';
    } else if (cat === 'Long Sleeves') {
      setPrice(35000);
      setTag('Layered Drop');
      setGsm('260 GSM Heavyweight Cotton');
      setMaterial('100% Combed Cotton with Ribbed Striped Undersleeve');
      setFit('Layered Double-Sleeve Streetwear Fit');
      defaultImg = '/images/tee-make-true-09-charcoal.png';
      defaultDesc = '260 GSM double-layer streetwear long-sleeve tee in washed charcoal featuring signature gothic Make True 09 distressed chest insignia with contrasting grey horizontal striped undersleeves.';
    } else if (cat === 'Jeans') {
      setPrice(65000);
      setTag('Luxury Denim');
      setGsm('14.5oz Heavyweight Denim');
      setMaterial('100% Shuttle-Loom Selvedge Cotton');
      setFit('Relaxed Straight Leg');
      defaultImg = '/images/jeans-raw-indigo.jpg';
      defaultDesc = 'Crafted from 14.5oz Japanese shuttle-loom selvedge denim. Features relaxed straight drape and antique brass hardware.';
    } else if (cat === 'Cargo Pants') {
      setPrice(45000);
      setTag('Tactical Drop');
      setGsm('280 GSM Combat Cotton Twill');
      setMaterial('100% Military Grade Cotton Twill');
      setFit('Relaxed Straight-Leg Cargo');
      defaultImg = '/images/cargo-pants-tactical-black.png';
      defaultDesc = 'Constructed from high-density 280 GSM military twill cotton with dual deep bellow cargo flap pockets and reinforced knee panels.';
    } else if (cat === 'Short Jeans') {
      setPrice(45000);
      setTag('Vintage Jorts');
      setGsm('13oz Heavyweight Denim');
      setMaterial('100% Vintage Washed Cotton');
      setFit('Baggy Knee-Length Jorts');
      defaultImg = '/images/short-jeans-jorts.jpg';
      defaultDesc = '13oz heavyweight vintage washed denim shorts with signature raw frayed hem, relaxed baggy streetwear silhouette.';
    } else if (cat === 'Beach Pants') {
      setPrice(50000);
      setTag('Pure Linen');
      setGsm('240 GSM Pure Flax Linen');
      setMaterial('100% Breathable European Linen');
      setFit('Relaxed Wide-Leg Flow');
      defaultImg = '/images/beach-pants-linen.jpg';
      defaultDesc = 'Tailored from 240 GSM pure European flax linen with elasticated drawstring waistband and breathable flowy silhouette.';
    } else if (cat === 'Up and Down') {
      setPrice(58000);
      setTag('Co-Ord Drop');
      setGsm('280 GSM Heavyweight Washed Twill');
      setMaterial('100% Premium Washed Cotton Twill');
      setFit('Boxy Overshirt & Relaxed Utility Shorts');
      defaultImg = '/images/up-and-down-set.jpg';
      defaultDesc = 'Luxury two-piece matching co-ord set featuring a boxy cropped utility button-up overshirt and matching relaxed shorts in washed heavyweight twill.';
    } else {
      defaultDesc = description || `Crafted with custom ${cat} streetwear tailoring and premium heavyweight finishing.`;
      defaultImg = newProductImages[0]?.previewUrl || '/images/hero-tee-black.png';
    }
    setDescription(defaultDesc);
    setNewProductImages([
      {
        id: `preset-${cat.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        file: null,
        previewUrl: defaultImg,
        isObjectUrl: false,
        finalUrl: defaultImg,
        status: 'uploaded',
        error: null,
      },
    ]);
    setPreviewActiveIndex(0);
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
  const handleSetPrimaryNewProductImage = (idx) => {
    setNewProductImages((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
    setPreviewActiveIndex(0);
    toast.success('Set as primary cover image');
  };
  const handleSetPrimaryImage = handleSetPrimaryNewProductImage;

  const handleRemoveNewProductImage = (itemId) => {
    setNewProductImages((prev) => {
      const target = prev.find((item) => item.id === itemId || item === itemId);
      if (target?.isObjectUrl && target?.previewUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.previewUrl); } catch {}
      }
      const next = prev.filter((item, idx) => item.id !== itemId && idx !== itemId);
      if (next.length === 0) {
        return [
          {
            id: `default-${Date.now()}`,
            file: null,
            previewUrl: '/images/hero-tee-black.png',
            isObjectUrl: false,
            finalUrl: '/images/hero-tee-black.png',
            status: 'uploaded',
            error: null,
          },
        ];
      }
      return next;
    });
    setPreviewActiveIndex(0);
  };
  const handleRemoveImage = handleRemoveNewProductImage;

  const handleAddUrlToGallery = () => {
    if (!urlInput.trim()) return;
    const clean = urlInput.trim();
    const lower = clean.toLowerCase();

    if (lower.startsWith('data:') || lower.startsWith('blob:')) {
      setUrlInputError('data: and blob: URLs are temporary and cannot be stored. Please upload the photo file instead.');
      toast.error('Direct data: or blob: URLs are not allowed. Please upload the image file.');
      return;
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/images/')) {
      setUrlInputError('Please enter a valid https:// image URL or relative /images/ path.');
      toast.error('Invalid image URL format');
      return;
    }

    setUrlInputError('');
    setNewProductImages((prev) => {
      const isDefaultPlaceholder =
        prev.length === 1 &&
        !prev[0].isObjectUrl &&
        prev[0].finalUrl === '/images/hero-tee-black.png';
      const newItem = {
        id: `url_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file: null,
        previewUrl: clean,
        isObjectUrl: false,
        finalUrl: clean,
        status: 'uploaded',
        error: null,
      };
      return isDefaultPlaceholder ? [newItem] : [...prev, newItem];
    });
    setUrlInput('');
    toast.success('Image URL added to gallery!');
  };

  const handleSelectPreset = (pUrl) => {
    if (typeof pUrl !== 'string' || pUrl.startsWith('data:') || pUrl.startsWith('blob:')) return;
    setNewProductImages((prev) => {
      if (prev.some((item) => item.finalUrl === pUrl)) return prev;
      const isDefaultPlaceholder =
        prev.length === 1 &&
        !prev[0].isObjectUrl &&
        prev[0].finalUrl === '/images/hero-tee-black.png';
      const newItem = {
        id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file: null,
        previewUrl: pUrl,
        isObjectUrl: false,
        finalUrl: pUrl,
        status: 'uploaded',
        error: null,
      };
      return isDefaultPlaceholder ? [newItem] : [...prev, newItem];
    });
    toast.success('Preset added to product photos!');
  };

  // Reorder gallery images for new product
  const handleMoveNewGalleryImage = (idx, offset) => {
    const targetIdx = idx + offset;
    if (targetIdx < 0 || targetIdx >= newProductImages.length) return;
    setNewProductImages((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setPreviewActiveIndex(0);
  };

  // Resize and compress image in browser (max ~1600px, JPEG 0.85)
  // Ensures phone camera photos (10-20MB) never exceed Vercel 4.5MB request limit
  const resizeImageForUpload = (file, maxDimension = 1600, quality = 0.85) => {
    if (!file || typeof window === 'undefined') return Promise.resolve(file);
    if (!file.type || !file.type.startsWith('image/')) return Promise.resolve(file);
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return Promise.resolve(file);

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;

        if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
          return resolve(file);
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'product_photo';
            const optimized = new File([blob], `${cleanName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Instant client-side palette extractor using HTML5 canvas
  const extractPaletteFromImageFile = (file) => {
    return new Promise((resolve) => {
      if (!file || typeof window === 'undefined') return resolve([]);
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = document.createElement('canvas');
          const sampleSize = 100;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return resolve([]);

          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
          const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

          const getRegionAvg = (xStart, xEnd) => {
            let r = 0, g = 0, b = 0, count = 0;
            for (let y = 0; y < sampleSize; y += 2) {
              for (let x = xStart; x < xEnd; x += 2) {
                const idx = (y * sampleSize + x) * 4;
                const red = imgData[idx];
                const green = imgData[idx + 1];
                const blue = imgData[idx + 2];
                const alpha = imgData[idx + 3];
                // Exclude pure white / blown out backgrounds
                if (alpha > 128 && !(red > 245 && green > 245 && blue > 245)) {
                  r += red;
                  g += green;
                  b += blue;
                  count++;
                }
              }
            }
            if (count === 0) return null;
            return {
              r: Math.round(r / count),
              g: Math.round(g / count),
              b: Math.round(b / count),
            };
          };

          const fullAvg = getRegionAvg(0, sampleSize);
          const leftAvg = getRegionAvg(0, Math.floor(sampleSize * 0.48));
          const rightAvg = getRegionAvg(Math.floor(sampleSize * 0.52), sampleSize);

          const rgbToHex = (r, g, b) =>
            '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

          const nameColor = (r, g, b) => {
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 45) return 'Obsidian Black';
            if (brightness > 225) return 'Pure White';
            if (brightness > 195 && r > g && g > b) return 'Cream Off-White';
            if (r > 130 && g < 85 && b < 85) return 'Burgundy Red';
            if (b > 120 && b > r && b > g) return 'Navy Blue';
            if (g > 100 && g > r && g > b) return 'Olive Green';
            if (r > 120 && g > 100 && b < 85) return 'Sand Khaki';
            if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18)
              return brightness < 110 ? 'Washed Charcoal' : 'Heather Grey';
            return 'Custom Color';
          };

          const colors = [];
          if (leftAvg && rightAvg) {
            const dist = Math.hypot(leftAvg.r - rightAvg.r, leftAvg.g - rightAvg.g, leftAvg.b - rightAvg.b);
            if (dist > 45) {
              colors.push({
                name: nameColor(leftAvg.r, leftAvg.g, leftAvg.b),
                hex: rgbToHex(leftAvg.r, leftAvg.g, leftAvg.b),
                image: '',
              });
              colors.push({
                name: nameColor(rightAvg.r, rightAvg.g, rightAvg.b),
                hex: rgbToHex(rightAvg.r, rightAvg.g, rightAvg.b),
                image: '',
              });
              return resolve(colors);
            }
          }

          if (fullAvg) {
            colors.push({
              name: nameColor(fullAvg.r, fullAvg.g, fullAvg.b),
              hex: rgbToHex(fullAvg.r, fullAvg.g, fullAvg.b),
              image: '',
            });
          }
          resolve(colors);
        } catch {
          resolve([]);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve([]);
      };

      img.src = objectUrl;
    });
  };

  // AI Garment Analysis Engine for New Product Form
  const analyzeGarmentWithAi = async (filesOrFile, imageUrl) => {
    setIsAnalyzingAi(true);
    try {
      const files = Array.isArray(filesOrFile)
        ? filesOrFile.filter(Boolean)
        : filesOrFile
        ? [filesOrFile]
        : [];

      // 1. Instant client-side color extraction for immediate swatches
      const localColors = [];
      for (const f of files.slice(0, 4)) {
        try {
          const pal = await extractPaletteFromImageFile(f);
          localColors.push(...pal);
        } catch {}
      }

      if (localColors.length > 0) {
        setNewProductColors((prev) => {
          const isDefault =
            prev.length <= 1 &&
            (prev[0]?.name === 'Obsidian Black' || prev[0]?.hex === '#111111');
          if (isDefault) {
            const unique = [];
            const seen = new Set();
            for (const c of localColors) {
              const h = (c.hex || '').toLowerCase();
              if (!seen.has(h)) {
                seen.add(h);
                unique.push(c);
              }
            }
            return unique.length > 0 ? unique : prev;
          }
          return prev;
        });
      }

      // 2. Pre-compress each file to 1024px before base64 to avoid Vercel 4.5MB payload limit
      const imagesPayload = [];
      for (const f of files.slice(0, 4)) {
        try {
          const optimized = await resizeImageForUpload(f, 1024, 0.8);
          const dataUrl = await fileToDataUrl(optimized);
          if (typeof dataUrl === 'string' && dataUrl.includes(',')) {
            const base64 = dataUrl.split(',')[1];
            imagesPayload.push({
              name: f.name || 'product_photo.jpg',
              mimeType: 'image/jpeg',
              base64,
            });
          }
        } catch {}
      }

      const primaryFile = files[0];
      const primaryBase64 = imagesPayload[0]?.base64 || null;

      const res = await fetch('/api/admin/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl || undefined,
          fileName: primaryFile?.name || undefined,
          mimeType: 'image/jpeg',
          base64: primaryBase64 || undefined,
          images: imagesPayload.length > 0 ? imagesPayload : undefined,
          customApiKey:
            (typeof window !== 'undefined' ? localStorage.getItem('klasik_gemini_api_key') : null) ||
            undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.analysis) {
          const a = data.analysis;
          if (a.title) setTitle(a.title);
          if (a.category) {
            setCategory(a.category);
            setCategoryPreset(a.category);
          }
          if (a.price) setPrice(Number(a.price));
          if (a.tag) setTag(a.tag);
          if (a.gsm) setGsm(a.gsm);
          if (a.material) setMaterial(a.material);
          if (a.fit) setFit(a.fit);
          if (a.description) setDescription(a.description);
          if (Array.isArray(a.sizes) && a.sizes.length > 0) setSizes(a.sizes);

          if (Array.isArray(a.colors) && a.colors.length > 0) {
            const aiMapped = a.colors.map((c) => ({
              name: c.name || 'Custom Color',
              hex: c.hex || '#111111',
              image: '',
            }));

            setNewProductColors((prev) => {
              const isDefault =
                prev.length <= 1 &&
                (prev[0]?.name === 'Obsidian Black' || prev[0]?.hex === '#111111');
              if (isDefault) return aiMapped;
              const seen = new Set(prev.map((p) => (p.hex || '').toLowerCase()));
              const fresh = aiMapped.filter((c) => !seen.has((c.hex || '').toLowerCase()));
              return [...prev, ...fresh];
            });
          }

          setAiAnalysisNotice({
            category: a.category,
            title: a.title,
            source: data.source,
          });

          const colorCount = Array.isArray(a.colors) ? a.colors.length : 1;
          const colorListStr =
            Array.isArray(a.colors) && a.colors.length > 1
              ? ` (${colorCount} colors: ${a.colors.map((c) => c.name).join(', ')})`
              : '';
          toast.success(
            `AI Identified Garment: ${a.category}${colorListStr}! Form auto-populated.`,
            { duration: 5000 }
          );
        }
      }
    } catch (err) {
      console.warn('[Admin AI] Analysis notice:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // AI Garment Analysis Engine for Edit Product Modal
  const analyzeEditGarmentWithAi = async (imageUrl, filesOrFile) => {
    setEditIsAnalyzingAi(true);
    try {
      const files = Array.isArray(filesOrFile)
        ? filesOrFile.filter(Boolean)
        : filesOrFile
        ? [filesOrFile]
        : [];

      const imagesPayload = [];
      for (const f of files.slice(0, 4)) {
        try {
          const optimized = await resizeImageForUpload(f, 1024, 0.8);
          const dataUrl = await fileToDataUrl(optimized);
          if (typeof dataUrl === 'string' && dataUrl.includes(',')) {
            imagesPayload.push({
              name: f.name || 'edit_photo.jpg',
              mimeType: 'image/jpeg',
              base64: dataUrl.split(',')[1],
            });
          }
        } catch {}
      }

      const primaryFile = files[0];
      const primaryBase64 = imagesPayload[0]?.base64 || null;

      const res = await fetch('/api/admin/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl || undefined,
          fileName: primaryFile?.name || undefined,
          mimeType: 'image/jpeg',
          base64: primaryBase64 || undefined,
          images: imagesPayload.length > 0 ? imagesPayload : undefined,
          customApiKey:
            (typeof window !== 'undefined' ? localStorage.getItem('klasik_gemini_api_key') : null) ||
            undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.analysis) {
          const a = data.analysis;
          if (a.title) setEditTitle(a.title);
          if (a.category) setEditCategory(a.category);
          if (a.price) setEditPrice(Number(a.price));
          if (a.tag) setEditTag(a.tag);
          if (a.description) setEditDescription(a.description);
          if (Array.isArray(a.sizes) && a.sizes.length > 0) setEditSizes(a.sizes);

          if (Array.isArray(a.colors) && a.colors.length > 0) {
            const aiMapped = a.colors.map((c) => ({
              name: c.name || 'Custom Color',
              hex: c.hex || '#111111',
              image: '',
            }));

            setEditColors((prev) => {
              const isDefault =
                prev.length <= 1 &&
                (prev[0]?.name === 'Obsidian Black' || prev[0]?.hex === '#111111');
              if (isDefault) return aiMapped;
              const seen = new Set(prev.map((p) => (p.hex || '').toLowerCase()));
              const fresh = aiMapped.filter((c) => !seen.has((c.hex || '').toLowerCase()));
              return [...prev, ...fresh];
            });
          }

          setEditAiNotice({
            category: a.category,
            title: a.title,
          });

          const editColorCount = Array.isArray(a.colors) ? a.colors.length : 1;
          const editColorStr =
            Array.isArray(a.colors) && a.colors.length > 1
              ? ` (${editColorCount} colors: ${a.colors.map((c) => c.name).join(', ')})`
              : '';
          toast.success(
            `AI Re-Identified: ${a.category}${editColorStr}! Modal updated.`,
            { duration: 4000 }
          );
        }
      }
    } catch (err) {
      console.warn('[Admin AI] Edit analysis notice:', err);
    } finally {
      setEditIsAnalyzingAi(false);
    }
  };

  // Process a single file upload to /api/admin/upload for new product
  const processSingleNewProductUpload = async (file, itemId) => {
    try {
      const optimizedFile = await resizeImageForUpload(file, 1600, 0.85);
      const fd = new FormData();
      fd.append('file', optimizedFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.url && !data.url.startsWith('data:') && !data.url.startsWith('blob:')) {
        setNewProductImages((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            if (item.isObjectUrl && item.previewUrl?.startsWith('blob:')) {
              try { URL.revokeObjectURL(item.previewUrl); } catch {}
            }
            return {
              ...item,
              previewUrl: data.url,
              finalUrl: data.url,
              isObjectUrl: false,
              status: 'uploaded',
              error: null,
            };
          })
        );
        return { success: true, url: data.url };
      } else {
        const errMsg = data?.error || (res.status === 413 ? 'Image exceeds maximum file size' : 'Server failed to save image to storage');
        setNewProductImages((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              status: 'failed',
              error: errMsg,
            };
          })
        );
        return { success: false, error: errMsg };
      }
    } catch (netErr) {
      const errMsg = netErr.message || 'Network upload failed';
      setNewProductImages((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status: 'failed',
            error: errMsg,
          };
        })
      );
      return { success: false, error: errMsg };
    }
  };

  // Upload multiple files for new product (from input, drag/drop, paste)
  const uploadNewProductFiles = (files) => {
    const validFiles = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    // Trigger AI analysis on all selected photos concurrently (multi-image & multi-colorway extraction)
    analyzeGarmentWithAi(validFiles, null);

    const newItems = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        isObjectUrl: true,
        finalUrl: null,
        status: 'uploading',
        error: null,
      };
    });

    setNewProductImages((prev) => {
      const isDefault =
        prev.length === 1 &&
        !prev[0].isObjectUrl &&
        prev[0].finalUrl === '/images/hero-tee-black.png';
      return isDefault ? newItems : [...prev, ...newItems];
    });

    // Start uploads concurrently
    newItems.forEach((item) => {
      processSingleNewProductUpload(item.file, item.id);
    });
  };

  // Retry a failed upload for new product
  const handleRetryNewProductImage = (itemId) => {
    setNewProductImages((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (!target || !target.file) {
        toast.error('Source file is no longer available. Please remove and re-select the image.');
        return prev;
      }
      setTimeout(() => {
        processSingleNewProductUpload(target.file, target.id);
      }, 50);
      return prev.map((item) =>
        item.id === itemId ? { ...item, status: 'uploading', error: null } : item
      );
    });
  };

  // Handle multi-image upload from device for new product
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadNewProductFiles(files);
    }
    if (e.target) e.target.value = '';
  };

  // Drag and drop handler for new product photos
  const handleNewProductDrop = (e) => {
    e.preventDefault();
    setIsDraggingNewPhoto(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      uploadNewProductFiles(files);
    }
  };

  // Paste handler for new product photos
  const handleNewProductPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      uploadNewProductFiles(files);
      toast.success(`Pasted ${files.length} photo${files.length > 1 ? 's' : ''}!`);
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
    
    // Parse all available colors
    const rawColors = Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors
      : (product.color ? [{ name: product.color, hex: '#111111', image: '' }] : [{ name: 'Obsidian Black', hex: '#111111', image: '' }]);
    const parsedColors = rawColors.map((c) => {
      if (typeof c === 'string') return { name: c, hex: '#111111', image: '' };
      const normHex = normalizeHex(c.hex) || '#111111';
      return {
        name: c.name || 'Standard',
        hex: normHex,
        image: c.image || '',
      };
    });
    setEditColors(parsedColors);
    setNewEditColorName('');
    setNewEditColorHexText('#111111');
    setNewEditLastValidHex('#111111');
    setNewEditColorImage('');

    const initialGallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : (product.image ? [product.image] : []);
    setEditDescription(product.description || '');

    // Check for any legacy data: or blob: images and map to editImageItems with status
    const initialInvalid = [];
    const mappedItems = initialGallery.map((url, i) => {
      const isInvalid = typeof url === 'string' && (url.trim().toLowerCase().startsWith('data:') || url.trim().toLowerCase().startsWith('blob:'));
      if (isInvalid) initialInvalid.push(i);
      return {
        id: `edit_img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        file: null,
        previewUrl: url,
        isObjectUrl: false,
        finalUrl: isInvalid ? null : url,
        status: isInvalid ? 'failed' : 'uploaded',
        error: isInvalid ? 'Legacy data: or blob: URL cannot be stored. Please remove or replace.' : null,
      };
    });

    setEditImageItems(
      mappedItems.length > 0
        ? mappedItems
        : [
            {
              id: `edit_default_${Date.now()}`,
              file: null,
              previewUrl: '/images/hero-tee-black.png',
              isObjectUrl: false,
              finalUrl: '/images/hero-tee-black.png',
              status: 'uploaded',
              error: null,
            },
          ]
    );
    setEditUrlInput('');
    setEditUrlError('');
    setInvalidImageIndices(initialInvalid);
    setIsEditModalOpen(true);

    setTimeout(() => {
      isInitialModalLoad.current = false;
    }, 400);
  };

  // Color management helpers for Edit Modal
  const handleUpdateEditColor = (idx, field, value) => {
    setEditColors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleAddEditColor = () => {
    if (!newEditColorName.trim()) {
      toast.error('Please enter a color name (e.g. Pure White)');
      return;
    }
    const validatedHex = normalizeHex(newEditColorHexText);
    if (!validatedHex) {
      toast.error(`Invalid hex code "${newEditColorHexText}". Must be valid #RGB or #RRGGBB format.`);
      return;
    }
    const newEntry = {
      name: newEditColorName.trim(),
      hex: validatedHex,
      image: newEditColorImage || '',
    };
    setEditColors((prev) => [...prev, newEntry]);
    setNewEditColorName('');
    setNewEditColorHexText('#111111');
    setNewEditLastValidHex('#111111');
    setNewEditColorImage('');
    toast.success(`Color "${newEntry.name}" added to product!`);
  };

  const handleRemoveEditColor = (idx) => {
    if (editColors.length <= 1) {
      toast.error('Product must have at least one available color');
      return;
    }
    const target = editColors[idx];
    setEditColors((prev) => prev.filter((_, i) => i !== idx));
    toast.success(`Removed color "${target.name}"`);
  };

  // Color management helpers for New Product Form
  const handleAddFormAddColor = () => {
    if (!addFormColorName.trim()) {
      toast.error('Please enter a color name (e.g. Pure White)');
      return;
    }
    const validatedHex = normalizeHex(addFormColorHexText);
    if (!validatedHex) {
      toast.error(`Invalid hex code "${addFormColorHexText}". Must be valid #RGB or #RRGGBB format.`);
      return;
    }
    const newEntry = {
      name: addFormColorName.trim(),
      hex: validatedHex,
      image: addFormColorImage || '',
    };
    setNewProductColors((prev) => [...prev, newEntry]);
    setAddFormColorName('');
    setAddFormColorHexText('#111111');
    setAddFormLastValidHex('#111111');
    setAddFormColorImage('');
    toast.success(`Color "${newEntry.name}" added!`);
  };

  const handleAddFormRemoveColor = (idx) => {
    if (newProductColors.length <= 1) {
      toast.error('Product must have at least one color');
      return;
    }
    setNewProductColors((prev) => prev.filter((_, i) => i !== idx));
  };

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

  // Process a single file upload to /api/admin/upload for edit modal
  const processSingleEditUpload = async (file, itemId) => {
    try {
      const optimizedFile = await resizeImageForUpload(file, 1600, 0.85);
      const fd = new FormData();
      fd.append('file', optimizedFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.url && !data.url.startsWith('data:') && !data.url.startsWith('blob:')) {
        setEditImageItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            if (item.isObjectUrl && item.previewUrl?.startsWith('blob:')) {
              try { URL.revokeObjectURL(item.previewUrl); } catch {}
            }
            return {
              ...item,
              previewUrl: data.url,
              finalUrl: data.url,
              isObjectUrl: false,
              status: 'uploaded',
              error: null,
            };
          })
        );
        return { success: true, url: data.url };
      } else {
        const errMsg = data?.error || (res.status === 413 ? 'Image exceeds maximum file size' : 'Server failed to save image to storage');
        setEditImageItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              status: 'failed',
              error: errMsg,
            };
          })
        );
        return { success: false, error: errMsg };
      }
    } catch (netErr) {
      const errMsg = netErr.message || 'Network upload failed';
      setEditImageItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status: 'failed',
            error: errMsg,
          };
        })
      );
      return { success: false, error: errMsg };
    }
  };

  // Upload multiple files for edit modal (from input, drag/drop, paste)
  const uploadEditFiles = (files) => {
    const validFiles = Array.from(files || []).filter((f) => f && f.type && f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newItems = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `edit_upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        isObjectUrl: true,
        finalUrl: null,
        status: 'uploading',
        error: null,
      };
    });

    setEditImageItems((prev) => {
      const isDefault =
        prev.length === 1 &&
        !prev[0].isObjectUrl &&
        prev[0].finalUrl === '/images/hero-tee-black.png';
      return isDefault ? newItems : [...prev, ...newItems];
    });

    newItems.forEach((item) => {
      processSingleEditUpload(item.file, item.id);
    });
  };

  // Retry a failed upload for edit modal
  const handleRetryEditImage = (itemId) => {
    setEditImageItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (!target) return prev;
      if (!target.file) {
        toast.error('Source file not available for retry. Please delete and re-upload the photo.');
        return prev;
      }
      setTimeout(() => {
        processSingleEditUpload(target.file, target.id);
      }, 50);
      return prev.map((item) =>
        item.id === itemId ? { ...item, status: 'uploading', error: null } : item
      );
    });
  };

  // Handle multi-image upload from device for edited product
  const handleEditFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadEditFiles(files);
    }
    if (e.target) e.target.value = '';
  };

  // Drag and drop handler for edit product photos
  const handleEditDrop = (e) => {
    e.preventDefault();
    setIsDraggingEditPhoto(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      uploadEditFiles(files);
    }
  };

  // Paste handler for edit product photos
  const handleEditPaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      e.preventDefault();
      uploadEditFiles(files);
      toast.success(`Pasted ${files.length} photo${files.length > 1 ? 's' : ''}!`);
    }
  };

  // Move gallery image left or right in edit modal
  const handleMoveEditImage = (idx, offset) => {
    const targetIdx = idx + offset;
    if (targetIdx < 0 || targetIdx >= editImageItems.length) return;
    setEditImageItems((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };
  const handleMoveGalleryImage = handleMoveEditImage;

  const handleSetEditPrimaryImage = (idx) => {
    setEditImageItems((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
    toast.success('Set as primary cover image');
  };

  const handleRemoveEditImage = (itemId) => {
    setEditImageItems((prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (target?.isObjectUrl && target?.previewUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.previewUrl); } catch {}
      }
      const next = prev.filter((item) => item.id !== itemId);
      if (next.length === 0) {
        return [
          {
            id: `edit_default_${Date.now()}`,
            file: null,
            previewUrl: '/images/hero-tee-black.png',
            isObjectUrl: false,
            finalUrl: '/images/hero-tee-black.png',
            status: 'uploaded',
            error: null,
          },
        ];
      }
      return next;
    });
    toast.success('Photo removed');
  };
  const handleRemoveGalleryImage = (idx) => {
    const item = editImageItems[idx];
    if (item) handleRemoveEditImage(item.id);
  };

  // Add image URL in edit modal
  const handleAddEditUrl = () => {
    if (!editUrlInput.trim()) return;
    const clean = editUrlInput.trim();
    const lower = clean.toLowerCase();

    if (lower.startsWith('data:') || lower.startsWith('blob:')) {
      setEditUrlError('data: and blob: URLs are temporary and cannot be stored. Please upload the photo file instead.');
      toast.error('Direct data: or blob: URLs are not allowed. Please upload the image file.');
      return;
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/images/')) {
      setEditUrlError('Please enter a valid https:// image URL or relative /images/ path.');
      toast.error('Invalid image URL format');
      return;
    }

    setEditUrlError('');
    setEditImageItems((prev) => {
      const isDefault =
        prev.length === 1 &&
        !prev[0].isObjectUrl &&
        prev[0].finalUrl === '/images/hero-tee-black.png';
      const newItem = {
        id: `edit_url_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file: null,
        previewUrl: clean,
        isObjectUrl: false,
        finalUrl: clean,
        status: 'uploaded',
        error: null,
      };
      return isDefault ? [newItem] : [...prev, newItem];
    });
    setEditUrlInput('');
    toast.success('Image URL added to gallery!');
  };

  // Submit edited product changes
  const handleSaveEditProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingProduct) return;

    if (editImageItems.some((img) => img.status === 'uploading')) {
      toast.error('Photos are currently uploading. Please wait before saving.');
      return;
    }

    // Detailed position check on failed or non-storage URLs
    const invalidList = [];
    editImageItems.forEach((item, i) => {
      const positionLabel = i === 0 ? 'Cover photo (position 1)' : `Gallery photo ${i + 1}`;
      if (item.status === 'failed') {
        invalidList.push(`${positionLabel}: ${item.error || 'Upload failed'}`);
      } else if (!item.finalUrl || item.finalUrl.startsWith('data:') || item.finalUrl.startsWith('blob:')) {
        invalidList.push(`${positionLabel}: Invalid temporary URL`);
      }
    });

    if (invalidList.length > 0) {
      toast.error(`Cannot save product:\n${invalidList.join('\n')}`);
      return;
    }

    if (!editTitle.trim()) {
      toast.error('Product title cannot be empty');
      return;
    }
    if (!editPrice || editPrice <= 0) {
      toast.error('Valid product price required');
      return;
    }

    // Validate and normalize all colors
    const rawColors = editColors.length > 0 ? editColors : [{ name: 'Standard', hex: '#111111', image: '' }];
    const normalizedColors = [];
    for (const c of rawColors) {
      const norm = normalizeHex(c.hex);
      if (!norm) {
        toast.error(`Invalid hex color code "${c.hex}" for color "${c.name}". Please enter a valid hex (#RGB or #RRGGBB).`);
        return;
      }
      normalizedColors.push({
        ...c,
        hex: norm,
      });
    }

    setSavingEdit(true);

    const finalGallery = editImageItems.map((item) => item.finalUrl);

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
      colors: normalizedColors,
      image: finalGallery[0] || '/images/hero-tee-black.png',
      fallbackImage: finalGallery[1] || finalGallery[0] || '/images/hero-tee-black.png',
      gallery: finalGallery,
      description: editDescription,
      isCustom: editingProduct.isCustom !== undefined ? editingProduct.isCustom : true,
    };

    try {
      const res = await updateProductAction(payload);
      if (!res?.success || !res?.product) {
        toast.error(res?.error || 'Failed to update product in database');
        setSavingEdit(false);
        return;
      }

      const updated = res.product;
      setProducts((prev) => prev.map((p) => (p.id === payload.id ? updated : p)));
      const timeStr = new Date().toLocaleTimeString('en-GB');
      toast.success(`Saved to database at ${timeStr}`);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setSavingEdit(false);
      router.refresh();
    } catch (err) {
      toast.error('Save error: ' + err.message);
      setSavingEdit(false);
    }
  };

  // Submit new product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (newProductImages.some((img) => img.status === 'uploading')) {
      toast.error('Photos are currently uploading. Please wait before publishing.');
      return;
    }

    // Detailed position check on failed or non-storage URLs
    const invalidList = [];
    newProductImages.forEach((item, i) => {
      const positionLabel = i === 0 ? 'Cover photo (position 1)' : `Gallery photo ${i + 1}`;
      if (item.status === 'failed') {
        invalidList.push(`${positionLabel}: ${item.error || 'Upload failed'}`);
      } else if (!item.finalUrl || item.finalUrl.startsWith('data:') || item.finalUrl.startsWith('blob:')) {
        invalidList.push(`${positionLabel}: Invalid temporary URL`);
      }
    });

    if (invalidList.length > 0) {
      toast.error(`Cannot publish product:\n${invalidList.join('\n')}`);
      return;
    }

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

    // Validate and normalize all colors
    const rawColors = newProductColors.length > 0 ? newProductColors : [{ name: 'Obsidian Black', hex: '#111111', image: '' }];
    const normalizedColors = [];
    for (const c of rawColors) {
      const norm = normalizeHex(c.hex);
      if (!norm) {
        toast.error(`Invalid hex color code "${c.hex}" for color "${c.name}". Please enter a valid hex (#RGB or #RRGGBB).`);
        return;
      }
      normalizedColors.push({
        ...c,
        hex: norm,
      });
    }

    setLoading(true);

    const finalGallery = newProductImages.map((item) => item.finalUrl);

    const productPayload = {
      title: title.trim(),
      price: Number(price),
      category,
      tag,
      gsm,
      material,
      fit,
      sizes,
      colors: normalizedColors,
      colorName: normalizedColors[0]?.name || 'Obsidian Black',
      colorHex: normalizedColors[0]?.hex || '#111111',
      image: finalGallery[0] || '/images/hero-tee-black.png',
      fallbackImage: finalGallery[1] || finalGallery[0] || '/images/hero-tee-black.png',
      gallery: finalGallery,
      description,
      stock: Number(stock) || 15,
      isCustom: true,
    };

    try {
      const res = await createProductAction(productPayload);
      if (!res?.success || !res?.product) {
        toast.error(res?.error || 'Failed to publish product to database');
        setLoading(false);
        return;
      }

      const finalProduct = res.product;
      setProducts((prev) => [finalProduct, ...prev]);

      const timeStr = new Date().toLocaleTimeString('en-GB');
      toast.success(`Saved to database at ${timeStr}`);

      // Reset form fields
      setTitle('');
      setDescription('');
      setNewProductImages([
        {
          id: `default-${Date.now()}`,
          file: null,
          previewUrl: '/images/hero-tee-black.png',
          isObjectUrl: false,
          finalUrl: '/images/hero-tee-black.png',
          status: 'uploaded',
          error: null,
        },
      ]);
      setUrlInput('');
      setUrlInputError('');
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

    try {
      const res = await deleteProductAction(productId);
      if (!res?.success) {
        toast.error(res?.error || 'Failed to delete product from database');
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      const timeStr = new Date().toLocaleTimeString('en-GB');
      toast.success(`Saved to database at ${timeStr}`);
      router.refresh();
    } catch (err) {
      toast.error('Delete error: ' + err.message);
    }
  };

  const handleRepairImages = async () => {
    const confirmed = window.confirm(
      'Scan and repair legacy images in Redis database?\n\n' +
      'This will convert legacy data: URLs to Vercel Blob assets, remove broken blob: links, and retain all other product properties.\n\n' +
      'Click OK to proceed with scan.'
    );
    if (!confirmed) return;

    setRepairingImages(true);
    try {
      const res = await repairImagesAction();
      if (!res?.success) {
        toast.error(res?.error || 'Failed to repair images');
        return;
      }
      setRepairReport(res.report);
      setShowRepairModal(true);
      toast.success('Image repair scan completed');
      await handleManualSyncToAllDevices();
    } catch (err) {
      toast.error('Repair failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRepairingImages(false);
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
            disabled={manualSyncing}
            onClick={handleManualSyncToAllDevices}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] border border-[#7C3AED] px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs disabled:opacity-60"
            title="Refresh latest product catalog from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${manualSyncing ? 'animate-spin' : ''}`} />
            <span>{manualSyncing ? 'Refreshing...' : 'Refresh from server'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#7C3AED] bg-white hover:bg-gray-50 border border-black/[0.06] px-3.5 py-2 rounded-full transition-all shadow-xs cursor-pointer"
            title="Copy all current catalog JSON to clipboard"
          >
            <span>Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={handleImportCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#7C3AED] bg-white hover:bg-gray-50 border border-black/[0.06] px-3.5 py-2 rounded-full transition-all shadow-xs cursor-pointer"
            title="Paste and restore backup catalog JSON"
          >
            <span>Restore JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetToServerCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3.5 py-2 rounded-full transition-all shadow-xs cursor-pointer"
            title="Clear all local edits and restore fresh server catalog"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Server</span>
          </button>

          <button
            type="button"
            disabled={repairingImages}
            onClick={handleRepairImages}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-2 rounded-full transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Scan Redis for legacy data: and blob: URLs, upload to Blob storage, and cleanup broken links"
          >
            <Sparkles className={`w-3.5 h-3.5 ${repairingImages ? 'animate-spin' : ''}`} />
            <span>{repairingImages ? 'Repairing...' : 'Repair Images'}</span>
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

        <button
          type="button"
          onClick={() => {
            setActiveTab('analytics');
            if (!analytics) fetchLiveAnalytics(false);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#7C3AED] text-white shadow-md'
              : 'text-gray-600 hover:text-[#111111]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
          {analytics?.onlineNow > 0 && (
            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {analytics.onlineNow} live
            </span>
          )}
        </button>
      </div>
 
       {!isDatabaseConfigured && (
         <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
           <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
           <div>
             <span className="font-bold block">Database Not Connected on Vercel</span>
             <p className="mt-0.5 text-amber-800">
               The store is displaying fallback catalog products. To save additions, edits, and deletions across all devices, configure <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">KV_REST_API_URL</code> and <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">KV_REST_API_TOKEN</code> in your Vercel Project Settings and redeploy.
             </p>
           </div>
         </div>
       )}

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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    Product Category Presets & Quick Templates *
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Select preset or enter custom below
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('T-Shirts')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'T-Shirts' && category === 'T-Shirts'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">T-Shirts</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦30,000</strong>
                    <span className="text-[10px] text-gray-400">240 GSM Cotton</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Long Sleeves')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Long Sleeves' && category === 'Long Sleeves'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Long Sleeves</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦35,000</strong>
                    <span className="text-[10px] text-gray-400">260 GSM Layered</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Jeans')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Jeans' && category === 'Jeans'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Jeans</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦65,000</strong>
                    <span className="text-[10px] text-gray-400">14.5oz Selvedge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Cargo Pants')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Cargo Pants' && category === 'Cargo Pants'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Cargo Pants</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦45,000</strong>
                    <span className="text-[10px] text-gray-400">280 GSM Combat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Short Jeans')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Short Jeans' && category === 'Short Jeans'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
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
                      categoryPreset === 'Beach Pants' && category === 'Beach Pants'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Beach Pants</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦50,000</strong>
                    <span className="text-[10px] text-gray-400">240 GSM Linen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Up and Down')}
                    className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                      categoryPreset === 'Up and Down' && category === 'Up and Down'
                        ? 'border-[#7C3AED] bg-[#EDE9FE]/50 shadow-xs ring-1 ring-[#7C3AED]/30'
                        : 'border-black/[0.06] bg-[#F7F7F8] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Up and Down</span>
                    <strong className="text-sm font-bold text-[#7C3AED] block">₦58,000</strong>
                    <span className="text-[10px] text-gray-400">280 GSM Co-Ord</span>
                  </button>
                </div>
              </div>

              {/* AI Auto-Detection Feedback Banner */}
              {isAnalyzingAi && (
                <div className="bg-purple-50 border border-purple-200/80 rounded-[18px] p-3.5 flex items-center gap-3 text-xs text-purple-700 animate-pulse">
                  <div className="w-5 h-5 rounded-full bg-[#7C3AED]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
                  </div>
                  <div>
                    <strong className="block text-[#7C3AED] font-bold">Scanning garment image with AI...</strong>
                    <span className="text-gray-600">Analyzing garment silhouette, sleeves, fabric texture, and dominant colorway.</span>
                  </div>
                </div>
              )}
              {aiAnalysisNotice && (
                <div className="bg-[#EDE9FE]/60 border border-[#7C3AED]/30 rounded-[18px] p-3.5 flex items-center justify-between text-xs text-[#7C3AED] shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-[#111111]">
                        AI Auto-Detected: <span className="text-[#7C3AED]">{aiAnalysisNotice.category}</span>
                      </span>
                      <span className="text-gray-600 block text-[11px]">
                        Title: &ldquo;{aiAnalysisNotice.title}&rdquo; &bull; Form specs auto-filled. You can edit any details below.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiAnalysisNotice(null)}
                    className="text-[11px] font-bold text-gray-400 hover:text-gray-700 px-2 py-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 block">
                      Product Category *
                    </label>
                    <span className="text-[10px] text-[#7C3AED] font-semibold">
                      Custom name or tap below
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    list="new-product-category-list"
                    placeholder="e.g. Cargo Pants, Hoodies, Caps, Jackets..."
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCategoryPreset(e.target.value);
                    }}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-2.5 text-xs text-[#111111] font-semibold outline-none transition-all"
                  />
                  <datalist id="new-product-category-list">
                    {existingCategories.map((catName) => (
                      <option key={catName} value={catName} />
                    ))}
                  </datalist>

                  {/* Active / Available Category Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-400 font-medium mr-1">Existing:</span>
                    {existingCategories.map((catName) => {
                      const isSelected = category.toLowerCase().trim() === catName.toLowerCase().trim();
                      return (
                        <button
                          key={catName}
                          type="button"
                          onClick={() => {
                            setCategory(catName);
                            setCategoryPreset(catName);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                              : 'bg-white text-gray-600 border-black/[0.08] hover:border-[#7C3AED] hover:text-[#7C3AED]'
                          }`}
                        >
                          {catName}
                        </button>
                      );
                    })}
                  </div>
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

              {/* Available Colors Manager */}
              <div className="bg-[#F7F7F8] rounded-[20px] p-4 sm:p-5 border border-black/[0.04] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-[#111111] flex items-center gap-2">
                      <span>Available Colors ({newProductColors.length})</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                        {newProductColors.length > 1 ? 'Multiple Colorways Active' : 'Single Colorway'}
                      </span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Add each and every colorway for this piece. Customers can select between all of these colors on the live store.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isAnalyzingAi}
                    onClick={async () => {
                      const files = newProductImages.map((img) => img.file).filter(Boolean);
                      const urls = newProductImages.map((img) => img.finalUrl || img.previewUrl).filter(Boolean);
                      if (files.length === 0 && urls.length === 0) {
                        toast.error('Please upload product photos first to auto-detect colors.');
                        return;
                      }
                      await analyzeGarmentWithAi(files.length > 0 ? files : null, urls[0] || null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-3.5 py-1.5 rounded-full transition-all border border-[#7C3AED]/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto shadow-xs"
                    title="Scan uploaded photos to automatically extract and populate all product colorways"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingAi ? 'Scanning Photos for Colors...' : 'Auto-Detect Colors from Photos'}</span>
                  </button>
                </div>

                {/* List of currently added colors */}
                <div className="flex flex-wrap gap-2.5">
                  {newProductColors.map((c, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 bg-white rounded-full pl-2 pr-3 py-1.5 border border-black/[0.08] shadow-xs text-xs font-semibold text-[#111111]"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.hex || '#111111' }}
                      />
                      <span>{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({c.hex})</span>
                      {newProductColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleAddFormRemoveColor(idx)}
                          className="text-gray-400 hover:text-red-500 ml-1 transition-colors cursor-pointer"
                          title="Remove color"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Add New Color Box */}
                <div className="bg-white rounded-[16px] p-3 border border-black/[0.06] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    + Add Another Colorway:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Color name (e.g. Pure White)"
                        value={addFormColorName}
                        onChange={(e) => setAddFormColorName(e.target.value)}
                        className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-3.5 py-2 text-xs text-[#111111] outline-none font-medium"
                      />
                    </div>
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <input
                        type="color"
                        value={addFormLastValidHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddFormColorHexText(val);
                          setAddFormLastValidHex(val);
                        }}
                        className="w-8 h-8 rounded-full cursor-pointer border border-black/[0.1] p-0.5 shrink-0"
                        title="Pick color"
                      />
                      <input
                        type="text"
                        value={addFormColorHexText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddFormColorHexText(val);
                          const norm = normalizeHex(val);
                          if (norm) {
                            setAddFormLastValidHex(norm);
                          }
                        }}
                        placeholder="#111111"
                        className="flex-1 bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-3 py-2 text-xs text-[#111111] font-mono outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddFormAddColor}
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold py-2 px-3 rounded-full transition-all cursor-pointer shadow-xs"
                      >
                        + Add Color
                      </button>
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 font-bold mr-1">Presets:</span>
                    {colorPresets.map((cp) => (
                      <button
                        type="button"
                        key={cp.name}
                        onClick={() => {
                          setAddFormColorName(cp.name);
                          setAddFormColorHexText(cp.hex);
                          setAddFormLastValidHex(cp.hex);
                        }}
                        className="inline-flex items-center gap-1 bg-[#EDEDEF]/70 hover:bg-[#EDEDEF] px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700 transition-all cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: cp.hex }}
                        />
                        <span>{cp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Photos & Angles Gallery Uploader */}
              {(() => {
                const newProductHasUploading = newProductImages.some((img) => img.status === 'uploading');
                const newProductHasFailed = newProductImages.some((img) => img.status === 'failed');
                const uploadingCount = newProductImages.filter((img) => img.status === 'uploading').length;
                const failedCount = newProductImages.filter((img) => img.status === 'failed').length;

                return (
                  <>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingNewPhoto(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingNewPhoto(false);
                      }}
                      onDrop={handleNewProductDrop}
                      onPaste={handleNewProductPaste}
                      className={`rounded-[22px] p-4 sm:p-5 border transition-all space-y-4 ${
                        isDraggingNewPhoto
                          ? 'bg-[#EDE9FE]/30 border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                          : 'bg-[#F7F7F8] border-black/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-[#111111] block">
                            Product Photos &amp; Angle Views ({newProductImages.length}) *
                          </label>
                          <span className="text-[11px] text-gray-500">
                            Upload photos from device, drag &amp; drop files, paste from clipboard, or add URL.
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                          {newProductImages.length > 0 && (
                            <button
                              type="button"
                              disabled={isAnalyzingAi}
                              onClick={() => {
                                const activeItem = newProductImages[previewActiveIndex] || newProductImages[0];
                                if (activeItem) {
                                  analyzeGarmentWithAi(activeItem.file, activeItem.finalUrl || activeItem.previewUrl);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-3.5 py-2 rounded-full cursor-pointer transition-all border border-[#7C3AED]/20 disabled:opacity-50"
                              title="Analyze active photo with AI to detect category, title, colors, and specs"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                              <span>{isAnalyzingAi ? 'Analyzing Piece...' : 'AI Auto-Detect'}</span>
                            </button>
                          )}
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 rounded-full cursor-pointer shadow-xs transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {newProductHasUploading
                                ? `Uploading (${uploadingCount})...`
                                : '+ Upload Photos (1 or Multiple)'}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Drag & Drop Prompt Banner */}
                      <div className="border border-dashed border-black/10 rounded-[14px] p-2.5 text-center bg-white/70">
                        <span className="text-[11px] text-gray-500 font-medium">
                          Tip: Drag &amp; drop photos anywhere in this box, or paste directly with Ctrl+V
                        </span>
                      </div>

                      {/* Uploaded Gallery Thumbnails Strip with Status Lifecycle */}
                      {newProductImages.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                            Product Photos (First photo is Cover shown on store cards):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {newProductImages.map((item, idx) => {
                              const isUploading = item.status === 'uploading';
                              const isFailed = item.status === 'failed';
                              const isUploaded = item.status === 'uploaded';

                              return (
                                <div
                                  key={item.id || idx}
                                  className={`relative rounded-[14px] overflow-hidden border p-1 group flex flex-col justify-between aspect-[3/4] transition-all ${
                                    isFailed
                                      ? 'border-red-500 ring-2 ring-red-400 bg-red-50/50'
                                      : isUploading
                                      ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/50'
                                      : idx === 0
                                      ? 'bg-[#EDEDEF] border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                                      : 'bg-[#EDEDEF] border-black/[0.08]'
                                  }`}
                                >
                                  <img
                                    src={item.previewUrl}
                                    alt={`Photo ${idx + 1}`}
                                    className="w-full h-full object-cover rounded-[10px]"
                                  />

                                  {/* Status Badges */}
                                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start max-w-[80%]">
                                    {isUploading ? (
                                      <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Uploading...
                                      </span>
                                    ) : isFailed ? (
                                      <div className="flex flex-col gap-0.5 items-start">
                                        <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                          <AlertCircle className="w-2.5 h-2.5" />
                                          Failed - retry
                                        </span>
                                        {item.error && (
                                          <span
                                            className="bg-black/85 text-red-100 text-[8px] font-medium px-1.5 py-0.5 rounded shadow max-w-[120px] truncate"
                                            title={item.error}
                                          >
                                            {item.error}
                                          </span>
                                        )}
                                      </div>
                                    ) : idx === 0 ? (
                                      <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Cover Photo
                                      </span>
                                    ) : idx === 1 ? (
                                      <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Angle 2 / Back
                                      </span>
                                    ) : (
                                      <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Angle {idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Top Right: Retry & Remove buttons */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                    {isFailed && item.file && (
                                      <button
                                        type="button"
                                        onClick={() => handleRetryNewProductImage(item.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                        title="Retry upload"
                                      >
                                        <RotateCw className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveNewProductImage(item.id)}
                                      className="bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-all cursor-pointer shadow-sm"
                                      title="Remove photo"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Reorder & Cover Buttons */}
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveNewGalleryImage(idx, -1)}
                                        className="bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-all"
                                        title="Move Left"
                                      >
                                        <ChevronLeft className="w-3 h-3" />
                                      </button>
                                    )}
                                    {idx !== 0 && isUploaded && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimaryNewProductImage(idx)}
                                        className="flex-1 bg-white/95 hover:bg-white text-[#7C3AED] text-[10px] font-bold py-1 px-1 rounded-full text-center shadow-xs transition-all cursor-pointer"
                                      >
                                        Cover
                                      </button>
                                    )}
                                    {idx < newProductImages.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveNewGalleryImage(idx, 1)}
                                        className="bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-all ml-auto"
                                        title="Move Right"
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* URL Adder with Inline Error Messaging */}
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Or paste an image URL (https://...)..."
                            value={urlInput}
                            onChange={(e) => {
                              setUrlInput(e.target.value);
                              if (urlInputError) setUrlInputError('');
                            }}
                            className={`flex-1 bg-white border ${
                              urlInputError ? 'border-red-400 focus:border-red-500' : 'border-black/[0.06]'
                            } rounded-full px-4 py-2 text-xs text-[#111111] outline-none transition-all`}
                          />
                          <button
                            type="button"
                            onClick={handleAddUrlToGallery}
                            className="bg-[#111111] text-white hover:bg-gray-800 text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all shrink-0"
                          >
                            + Add URL
                          </button>
                        </div>
                        {urlInputError && (
                          <p className="text-[11px] text-red-600 font-medium pl-3 pt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{urlInputError}</span>
                          </p>
                        )}
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

                    {/* Publish Action & Disabled Reason Banner */}
                    <div className="space-y-2">
                      {newProductHasUploading && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Publish is disabled: Photos are currently uploading to storage. Please wait.</span>
                        </div>
                      )}
                      {newProductHasFailed && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>
                            Publish is disabled: {failedCount} photo upload{failedCount > 1 ? 's' : ''} failed. Click &quot;Retry&quot; or remove failed photos to publish.
                          </span>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={loading || newProductHasUploading || newProductHasFailed}
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#7C3AED]/50 disabled:cursor-not-allowed text-white font-sans text-sm font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {newProductHasUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Photos...</span>
                          </>
                        ) : loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Publishing Product to Database...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Publish Product to Store</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}

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
      {activeTab === 'catalog' && (() => {
        const criticalCount = products.filter((p) => Number(p.stock) === 1).length;
        const lowCount = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3).length;
        const soldOutCount = products.filter((p) => Number(p.stock) === 0).length;
        const healthyCount = products.filter((p) => Number(p.stock) > 3).length;

        const filteredCatalogProducts = products.filter((prod) => {
          const stock = prod.stock !== undefined ? Number(prod.stock) : 10;
          if (inventoryFilter === 'critical' && stock !== 1) return false;
          if (inventoryFilter === 'low' && (stock <= 0 || stock > 3)) return false;
          if (inventoryFilter === 'sold-out' && stock !== 0) return false;
          if (inventoryFilter === 'in-stock' && stock <= 3) return false;

          if (adminCategoryFilter !== 'ALL') {
            if ((prod.category || '').toLowerCase().trim() !== adminCategoryFilter.toLowerCase().trim()) {
              return false;
            }
          }

          if (catalogSearch.trim()) {
            const q = catalogSearch.toLowerCase();
            const titleMatch = (prod.title || '').toLowerCase().includes(q);
            const catMatch = (prod.category || '').toLowerCase().includes(q);
            return titleMatch || catMatch;
          }
          return true;
        });

        return (
          <div className="space-y-6">
            
            {/* Header & New Product CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-[20px] p-5 border border-black/[0.04]">
              <div>
                <h3 className="font-bold text-lg text-[#111111]">Store Products &amp; Inventory Archive</h3>
                <p className="text-xs text-gray-500">
                  Audit live stock counts, monitor single-unit alerts, and edit active pieces.
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

            {/* Inventory Quick-Filter Bar & Search Input */}
            <div className="bg-white rounded-[20px] p-4 border border-black/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_4px_16px_rgba(17,17,17,0.03)]">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => setInventoryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    inventoryFilter === 'all'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Pieces ({products.length})
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryFilter('critical')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    inventoryFilter === 'critical'
                      ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Only 1 Left ({criticalCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryFilter('low')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    inventoryFilter === 'low'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50/70 text-amber-800 border border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  Low Stock &le;3 ({lowCount})
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryFilter('sold-out')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    inventoryFilter === 'sold-out'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 border border-red-200/80 hover:bg-red-100'
                  }`}
                >
                  Sold Out ({soldOutCount})
                </button>

                <button
                  type="button"
                  onClick={() => setInventoryFilter('in-stock')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    inventoryFilter === 'in-stock'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                  }`}
                >
                  Healthy Stock ({healthyCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="w-full md:w-64 shrink-0">
                <input
                  type="text"
                  placeholder="Filter by title or category..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-full px-4 py-2 text-xs text-[#111111] font-medium outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Filter Pills Row */}
            <div className="bg-white rounded-[20px] p-3 border border-black/[0.04] flex items-center gap-2 overflow-x-auto scrollbar-none shadow-[0_4px_16px_rgba(17,17,17,0.02)]">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 pl-1">
                Category:
              </span>
              <button
                type="button"
                onClick={() => setAdminCategoryFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  adminCategoryFilter === 'ALL'
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories ({products.length})
              </button>
              {existingCategories.map((cName) => {
                const count = products.filter((p) => (p.category || '').toLowerCase().trim() === cName.toLowerCase().trim()).length;
                if (count === 0) return null;
                const isSelected = adminCategoryFilter.toLowerCase().trim() === cName.toLowerCase().trim();
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => setAdminCategoryFilter(cName)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-[#EDEDEF] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            {filteredCatalogProducts.length === 0 ? (
              <div className="bg-white rounded-[20px] p-12 text-center border border-black/[0.04]">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-[#111111]">No garments match this inventory filter</h4>
                <p className="text-xs text-gray-400 mt-1">Try selecting a different filter above or clearing your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryFilter('all');
                    setAdminCategoryFilter('ALL');
                    setCatalogSearch('');
                  }}
                  className="mt-4 text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCatalogProducts.map((prod) => {
                  const stockNum = prod.stock !== undefined ? Number(prod.stock) : 10;
                  const isCritical = stockNum === 1;
                  const isSoldOut = stockNum === 0;

                  return (
                    <div
                      key={prod.id}
                      className={`bg-white rounded-[20px] border p-4 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between transition-all ${
                        isCritical
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : isSoldOut
                          ? 'border-red-200 opacity-90'
                          : 'border-black/[0.04]'
                      }`}
                    >
                      <div>
                        {/* Image Showcase */}
                        <div className="relative aspect-[3/4] rounded-[14px] bg-[#EDEDEF] overflow-hidden mb-3">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {prod.isCustom ? (
                              <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full w-fit">
                                Custom Added
                              </span>
                            ) : (
                              <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full w-fit">
                                Verified Catalog
                              </span>
                            )}
                          </div>

                          {/* Top Right Stock Badge */}
                          <div className="absolute top-2 right-2">
                            {isCritical ? (
                              <span className="bg-amber-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>Only 1 Left</span>
                              </span>
                            ) : isSoldOut ? (
                              <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                Sold Out
                              </span>
                            ) : stockNum <= 3 ? (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                {stockNum} Left
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                {stockNum} in stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase truncate">
                              {prod.category} &bull; {prod.gsm || '240 GSM'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium truncate max-w-[100px]">
                              {prod.colors?.length || 1} color{prod.colors?.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-[#111111] line-clamp-1">
                            {prod.title}
                          </h4>
                          <span className="text-xs font-bold text-[#7C3AED] block">
                            {formatPrice(prod.price)}
                          </span>

                          {/* Quick Inline Stock Adjuster */}
                          <div className="bg-[#F7F7F8] rounded-[12px] p-2 mt-2 border border-black/[0.04]">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-bold text-gray-500">Live Inventory:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStockChange(prod, 1)}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                                  title="Set to 1 to test immediate claim alert"
                                >
                                  Set 1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStockChange(prod, 0)}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer"
                                  title="Set to 0 to mark as sold out"
                                >
                                  Set 0
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickStockChange(prod, Math.max(0, stockNum - 1))}
                                className="w-6 h-6 rounded-full bg-white hover:bg-gray-100 text-[#111111] border border-black/10 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title="Decrease stock"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-[#111111] min-w-[28px] text-center">
                                {stockNum} units
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickStockChange(prod, stockNum + 1)}
                                className="w-6 h-6 rounded-full bg-white hover:bg-gray-100 text-[#111111] border border-black/10 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title="Increase stock"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Sizes */}
                          <div className="flex flex-wrap gap-1 pt-1.5">
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

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(prod)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#DDD6FE] text-xs font-bold transition-all cursor-pointer shadow-xs"
                          title="Edit garment details, colors, photo angles, sizes, price, stock"
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
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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

      {/* TAB 4: VISITOR & TRAFFIC ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Live Store Telemetry &bull; Africa/Lagos Timezone
                </span>
                {analytics?.onlineNow > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{analytics.onlineNow} Online Now</span>
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xl text-[#111111]">Visitor & Traffic Analytics</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time unique visitors, cumulative page views, and store activity.
              </p>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
              <span className="text-[11px] text-gray-400 font-mono">
                {analytics?.lastUpdated
                  ? `Updated ${new Date(analytics.lastUpdated).toLocaleTimeString('en-GB')}`
                  : 'Awaiting sync'}
              </span>
              <button
                type="button"
                onClick={() => fetchLiveAnalytics(true)}
                disabled={analyticsLoading}
                className="flex items-center gap-2 bg-[#111111] hover:bg-[#222222] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                <span>{analyticsLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner when Redis is unavailable (Requirement 1) */}
          {analyticsError && (
            <div className="p-6 rounded-[20px] bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">Analytics unavailable: {analyticsError}</span>
                <span className="text-xs text-red-700 block mt-1">
                  Ensure Upstash Redis is active and environment variables (KV_REST_API_URL / KV_REST_API_TOKEN) are configured.
                </span>
              </div>
            </div>
          )}

          {/* 4 Primary KPI Metric Cards (Requirement 5 & 7) */}
          {analytics && !analyticsError && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. All-Time Unique Visitors */}
                <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      All-Time Unique Visitors
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#111111] tracking-tight">
                    {(analytics.totalVisitors || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium block mt-1">
                    Distinct visitors across all time
                  </span>
                </div>

                {/* 2. Today's Unique Visitors (Exact Label Required) */}
                <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                      Today&apos;s Unique Visitors
                    </span>
                    <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <UserCheck className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-purple-600 tracking-tight">
                    {(analytics.todayVisitors || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium block mt-1">
                    Active visitors today (Lagos UTC+1)
                  </span>
                </div>

                {/* 3. Total Page Views */}
                <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      Total Page Views
                    </span>
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                      <Layers className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#111111] tracking-tight">
                    {(analytics.totalPageViews || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium block mt-1">
                    Cumulative store impressions
                  </span>
                </div>

                {/* 4. Today's Page Views */}
                <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                      Today&apos;s Page Views
                    </span>
                    <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Activity className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                    {(analytics.todayPageViews || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium block mt-1">
                    Store impressions today
                  </span>
                </div>

                {/* 5. Average Time on Site */}
                <div className="bg-white rounded-[20px] p-5 border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                      Avg Time on Site
                    </span>
                    <span className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                    {analytics.avgDurationFormatted || '0s'}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium block mt-1">
                    Active session average today
                  </span>
                </div>
              </div>

              {/* 7-Day Trend Chart & History Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 7-Day Bar Chart Visualizer */}
                <div className="lg:col-span-7 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-black/[0.04]">
                    <div>
                      <h4 className="font-bold text-sm text-[#111111]">7-Day Traffic Activity</h4>
                      <p className="text-xs text-gray-400">Daily unique visitors and page impressions</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                        <span className="text-gray-600">Visitors</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DDD6FE]" />
                        <span className="text-gray-600">Views</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual CSS Bar Chart */}
                  {Array.isArray(analytics.history) && analytics.history.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.history.map((day, idx) => {
                        const maxViews = Math.max(
                          1,
                          ...analytics.history.map((d) => d.pageViews || 0)
                        );
                        const viewsPct = Math.min(100, Math.round(((day.pageViews || 0) / maxViews) * 100));
                        const visitorsPct = Math.min(100, Math.round(((day.visitors || 0) / maxViews) * 100));

                        return (
                          <div key={day.date || idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${day.label === 'Today' ? 'text-[#7C3AED]' : 'text-gray-700'}`}>
                                {day.label}
                              </span>
                              <div className="flex items-center gap-3 text-[11px] font-mono">
                                <span className="text-[#7C3AED] font-bold">{day.visitors || 0} visitors</span>
                                <span className="text-gray-400">&bull;</span>
                                <span className="text-gray-600">{day.pageViews || 0} views</span>
                              </div>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${visitorsPct}%` }}
                                className="bg-[#7C3AED] h-full rounded-full transition-all duration-500"
                                title={`${day.visitors} unique visitors`}
                              />
                              <div
                                style={{ width: `${Math.max(0, viewsPct - visitorsPct)}%` }}
                                className="bg-[#DDD6FE] h-full transition-all duration-500"
                                title={`${day.pageViews} page views`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">No history available yet.</div>
                  )}
                </div>

                {/* 7-Day History Table */}
                <div className="lg:col-span-5 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#111111] mb-1">Traffic Breakdown</h4>
                    <p className="text-xs text-gray-400 mb-4 pb-3 border-b border-black/[0.04]">
                      Detailed metrics per day (Lagos Time)
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.06] text-gray-400 font-bold uppercase text-[10px]">
                            <th className="py-2.5">Date</th>
                            <th className="py-2.5 text-right">Visitors</th>
                            <th className="py-2.5 text-right">Views</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {Array.isArray(analytics.history) &&
                            analytics.history.map((day, idx) => (
                              <tr key={day.date || idx} className="hover:bg-gray-50/80">
                                <td className={`py-2.5 font-medium ${day.label === 'Today' ? 'text-[#7C3AED] font-bold' : 'text-gray-700'}`}>
                                  {day.label}
                                </td>
                                <td className="py-2.5 text-right font-mono font-semibold text-[#7C3AED]">
                                  {day.visitors || 0}
                                </td>
                                <td className="py-2.5 text-right font-mono font-semibold text-gray-700">
                                  {day.pageViews || 0}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Category & Session Duration Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Device Breakdown (Mobile vs Desktop vs Tablet) */}
                <div className="lg:col-span-6 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.04]">
                      <div>
                        <h4 className="font-bold text-sm text-[#111111]">Visitor Devices</h4>
                        <p className="text-xs text-gray-400">Hardware categories accessing the storefront today</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-2.5 py-1 rounded-full">
                        {analytics.devices?.totalHits || 0} Telemetry Hits
                      </span>
                    </div>

                    {/* Device Category Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="p-3.5 rounded-2xl bg-[#EDE9FE]/50 border border-[#DDD6FE]/60 text-center">
                        <Smartphone className="w-5 h-5 mx-auto text-[#7C3AED] mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Mobile</span>
                        <span className="text-lg font-extrabold text-[#7C3AED] block">
                          {analytics.devices?.mobilePct || 0}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {analytics.devices?.Mobile || 0} visits
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/60 text-center">
                        <Monitor className="w-5 h-5 mx-auto text-gray-700 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Desktop</span>
                        <span className="text-lg font-extrabold text-[#111111] block">
                          {analytics.devices?.desktopPct || 0}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {analytics.devices?.Desktop || 0} visits
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/60 text-center">
                        <Tablet className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Tablet</span>
                        <span className="text-lg font-extrabold text-gray-600 block">
                          {analytics.devices?.tabletPct || 0}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {analytics.devices?.Tablet || 0} visits
                        </span>
                      </div>
                    </div>

                    {/* Segmented Percentage Bar */}
                    <div className="mb-4">
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${analytics.devices?.mobilePct || 0}%` }}
                          className="bg-[#7C3AED] h-full transition-all duration-500"
                          title={`Mobile: ${analytics.devices?.mobilePct || 0}%`}
                        />
                        <div
                          style={{ width: `${analytics.devices?.desktopPct || 0}%` }}
                          className="bg-gray-800 h-full transition-all duration-500"
                          title={`Desktop: ${analytics.devices?.desktopPct || 0}%`}
                        />
                        <div
                          style={{ width: `${analytics.devices?.tabletPct || 0}%` }}
                          className="bg-gray-300 h-full transition-all duration-500"
                          title={`Tablet: ${analytics.devices?.tabletPct || 0}%`}
                        />
                      </div>
                    </div>

                    {/* Operating System Pills */}
                    {analytics.operatingSystems && Object.keys(analytics.operatingSystems).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                          Operating Systems
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(analytics.operatingSystems)
                            .sort(([, a], [, b]) => Number(b) - Number(a))
                            .map(([os, count]) => (
                              <span
                                key={os}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-[11px] font-medium"
                              >
                                <span className="font-semibold">{os}:</span>
                                <span className="font-mono text-[#7C3AED]">{Number(count).toLocaleString()}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Duration & Engagement */}
                <div className="lg:col-span-6 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.04]">
                      <div>
                        <h4 className="font-bold text-sm text-[#111111]">Time Spent on Website</h4>
                        <p className="text-xs text-gray-400">Active browsing duration and visit depth</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Avg: {analytics.avgDurationFormatted || '0s'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Measures active foreground attention while visitors explore garments, select sizes, and view details.
                    </p>

                    {/* Duration Buckets */}
                    <div className="space-y-3">
                      {[
                        { label: '< 30s', desc: 'Bounced / Quick scan', key: '< 30s', color: 'bg-gray-400' },
                        { label: '30s - 2m', desc: 'Engaged browsing', key: '30s - 2m', color: 'bg-[#DDD6FE]' },
                        { label: '2m - 5m', desc: 'Deep interest / Reading', key: '2m - 5m', color: 'bg-[#7C3AED]' },
                        { label: '5m+', desc: 'High intent / Checkout', key: '5m+', color: 'bg-emerald-500' },
                      ].map((b) => {
                        const count = Number(analytics.durationBuckets?.[b.key] || 0);
                        const totalBucketHits = Object.values(analytics.durationBuckets || {}).reduce((s, c) => s + Number(c || 0), 0);
                        const pct = totalBucketHits > 0 ? Math.round((count / totalBucketHits) * 100) : 0;

                        return (
                          <div key={b.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-800">{b.label} <span className="text-gray-400 font-normal">({b.desc})</span></span>
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="font-bold text-gray-900">{count} visits</span>
                                <span className="text-gray-400">({pct}%)</span>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${b.color} transition-all duration-500`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Pages (Last 7 Days) & Country Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Pages */}
                <div className="lg:col-span-7 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.04]">
                    <div>
                      <h4 className="font-bold text-sm text-[#111111]">Top Pages (Last 7 Days)</h4>
                      <p className="text-xs text-gray-400">Most visited catalog sections and garments</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#7C3AED] bg-[#EDE9FE] px-2.5 py-1 rounded-full">
                      {(analytics.topPages || []).length} Recorded
                    </span>
                  </div>

                  {Array.isArray(analytics.topPages) && analytics.topPages.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-black/[0.06] text-gray-400 font-bold uppercase text-[10px]">
                            <th className="py-2.5 w-12">#</th>
                            <th className="py-2.5">Path</th>
                            <th className="py-2.5 text-right">Views</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {analytics.topPages.map((item, idx) => (
                            <tr key={item.path || idx} className="hover:bg-gray-50/80">
                              <td className="py-2.5 text-gray-400 font-mono text-[11px] font-bold">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 font-mono text-gray-800 text-[11px] max-w-[280px] truncate">
                                <Link
                                  href={item.path}
                                  target="_blank"
                                  className="hover:text-[#7C3AED] hover:underline"
                                >
                                  {item.path}
                                </Link>
                              </td>
                              <td className="py-2.5 text-right font-mono font-bold text-[#111111]">
                                {item.views.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No page traffic recorded yet.
                    </div>
                  )}
                </div>

                {/* Country Breakdown */}
                <div className="lg:col-span-5 bg-white rounded-[24px] border border-black/[0.04] p-6 shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/[0.04]">
                    <div>
                      <h4 className="font-bold text-sm text-[#111111]">Visitor Locations</h4>
                      <p className="text-xs text-gray-400">Geographic origin today (Edge header)</p>
                    </div>
                    <Globe className="w-4 h-4 text-purple-400" />
                  </div>

                  {analytics.countries && Object.keys(analytics.countries).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.countries)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .map(([country, count]) => (
                          <div
                            key={country}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-colors text-xs"
                          >
                            <span className="font-mono font-bold text-gray-800 tracking-wider">
                              {country}
                            </span>
                            <span className="font-mono font-semibold text-[#7C3AED]">
                              {Number(count).toLocaleString()} hits
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400">
                      No country telemetry logged today.
                    </div>
                  )}
                </div>
              </div>
            </>
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
                  {savingEdit && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7C3AED] bg-[#EDE9FE] border border-[#DDD6FE] px-2 py-0.5 rounded-full animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </span>
                  )}
                  {uploadingEditGallery && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Uploading Photo...</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                  Edit Garment Details
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">
                    Click Save Changes below to write directly to the database and update the live storefront.
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Category *
                    </label>
                    <span className="text-[10px] text-[#7C3AED] font-semibold">
                      Custom name or tap pill
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    list="edit-product-category-list"
                    placeholder="e.g. Cargo Pants, Hoodies, T-Shirts, Jeans..."
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                  />
                  <datalist id="edit-product-category-list">
                    {existingCategories.map((catName) => (
                      <option key={catName} value={catName} />
                    ))}
                  </datalist>

                  {/* Existing category pills for 1-tap switching */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-400 font-medium mr-1">Existing:</span>
                    {existingCategories.map((catName) => {
                      const isSelected = editCategory.toLowerCase().trim() === catName.toLowerCase().trim();
                      return (
                        <button
                          key={catName}
                          type="button"
                          onClick={() => setEditCategory(catName)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                              : 'bg-white text-gray-600 border-black/[0.08] hover:border-[#7C3AED] hover:text-[#7C3AED]'
                          }`}
                        >
                          {catName}
                        </button>
                      );
                    })}
                  </div>
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

              {/* Material Composition */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Material Composition
                </label>
                <input
                  type="text"
                  value={editMaterial}
                  onChange={(e) => setEditMaterial(e.target.value)}
                  placeholder="e.g. 100% Combed Organic Cotton"
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[14px] px-4 py-3 text-xs sm:text-sm text-[#111111] outline-none transition-all font-semibold"
                />
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
                        {sz} {isSelected ? <Check className="w-3 h-3 inline ml-1" /> : null}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  E.g. If only Medium is available, deselect others so only Medium can be ordered.
                </p>
              </div>

              {/* Available Colors & Photo Angle Mapping */}
              <div className="bg-[#F7F7F8] rounded-[22px] p-4 sm:p-5 border border-black/[0.04] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-[#111111] flex items-center gap-2">
                      <span>Available Colors &amp; Photo Mapping ({editColors.length})</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                        {editColors.length > 1 ? 'Multiple Colorways Active' : 'Single Colorway'}
                      </span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Configure each colorway for this piece and link each color to its corresponding photo angle.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={editIsAnalyzingAi}
                    onClick={async () => {
                      const files = editImages.map((img) => img.file).filter(Boolean);
                      const urls = editImages.map((img) => img.finalUrl || img.previewUrl).filter(Boolean);
                      if (files.length === 0 && urls.length === 0) {
                        toast.error('Please upload or select product photos first to auto-detect colors.');
                        return;
                      }
                      await analyzeEditGarmentWithAi(urls[0] || null, files.length > 0 ? files : null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-3.5 py-1.5 rounded-full transition-all border border-[#7C3AED]/20 cursor-pointer disabled:opacity-50 self-start sm:self-auto shadow-xs"
                    title="Scan uploaded photos to automatically extract and populate all product colorways"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${editIsAnalyzingAi ? 'animate-spin' : ''}`} />
                    <span>{editIsAnalyzingAi ? 'Scanning Photos for Colors...' : 'Auto-Detect Colors from Photos'}</span>
                  </button>
                </div>

                {/* List of current colors */}
                <div className="space-y-3">
                  {editColors.map((colorObj, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-[16px] p-3.5 border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Swatch Picker */}
                        <div className="relative shrink-0">
                          <input
                            type="color"
                            value={normalizeHex(colorObj.hex) || '#111111'}
                            onChange={(e) => handleUpdateEditColor(idx, 'hex', e.target.value)}
                            className="w-9 h-9 rounded-full cursor-pointer border border-black/10 p-0.5"
                            title="Click to pick color"
                          />
                        </div>

                        {/* Color Name Input */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={colorObj.name || ''}
                            placeholder="Color name"
                            onChange={(e) => handleUpdateEditColor(idx, 'name', e.target.value)}
                            className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[10px] px-3 py-1.5 text-xs text-[#111111] font-semibold outline-none"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={colorObj.hex || ''}
                              placeholder="#111111"
                              onChange={(e) => handleUpdateEditColor(idx, 'hex', e.target.value)}
                              className="w-20 bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded px-2 py-0.5 text-[10px] font-mono text-[#111111] outline-none"
                            />
                            {/* Color presets quick-select */}
                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                              {colorPresets.slice(0, 5).map((cp) => (
                                <button
                                  type="button"
                                  key={cp.name}
                                  title={cp.name}
                                  onClick={() => {
                                    handleUpdateEditColor(idx, 'name', cp.name);
                                    handleUpdateEditColor(idx, 'hex', cp.hex);
                                  }}
                                  className="w-3 h-3 rounded-full border border-black/10 transition-transform hover:scale-125 cursor-pointer"
                                  style={{ backgroundColor: cp.hex }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Linked Photo Selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-[#EDEDEF] rounded-[10px] px-2.5 py-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <select
                            value={colorObj.image || ''}
                            onChange={(e) => handleUpdateEditColor(idx, 'image', e.target.value)}
                            className="bg-transparent text-xs text-gray-700 font-medium outline-none cursor-pointer max-w-[150px] truncate"
                          >
                            <option value="">(Default / Cover Photo)</option>
                            {editGallery.map((gUrl, gIdx) => (
                              <option key={gIdx} value={gUrl}>
                                {gIdx === 0 ? 'Cover Photo' : `Angle Photo ${gIdx + 1}`}
                              </option>
                            ))}
                          </select>
                          {colorObj.image && (
                            <img
                              src={colorObj.image}
                              alt={colorObj.name}
                              className="w-6 h-6 rounded-md object-cover border border-black/10 shrink-0"
                            />
                          )}
                        </div>

                        {/* Remove Color */}
                        {editColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditColor(idx)}
                            className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove color"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Color Sub-Card */}
                <div className="bg-white rounded-[16px] p-3.5 border border-black/[0.06] space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    + Add New Available Color:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Color name (e.g. Royal Blue)"
                        value={newEditColorName}
                        onChange={(e) => setNewEditColorName(e.target.value)}
                        className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[10px] px-3 py-2 text-xs text-[#111111] font-semibold outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4 flex items-center gap-2">
                      <input
                        type="color"
                        value={newEditLastValidHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewEditColorHexText(val);
                          setNewEditLastValidHex(val);
                        }}
                        className="w-8 h-8 rounded-full cursor-pointer border border-black/10 p-0.5 shrink-0"
                        title="Pick color hex"
                      />
                      <input
                        type="text"
                        value={newEditColorHexText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewEditColorHexText(val);
                          const norm = normalizeHex(val);
                          if (norm) {
                            setNewEditLastValidHex(norm);
                          }
                        }}
                        placeholder="#111111"
                        className="flex-1 bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] rounded-[10px] px-3 py-2 text-xs text-[#111111] font-mono outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddEditColor}
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold py-2 px-3 rounded-full transition-all cursor-pointer shadow-xs"
                      >
                        + Add Color
                      </button>
                    </div>
                  </div>

                  {/* Preset Quick Swatches */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-400 font-bold mr-1">Presets:</span>
                    {colorPresets.map((cp) => (
                      <button
                        type="button"
                        key={cp.name}
                        onClick={() => {
                          setNewEditColorName(cp.name);
                          setNewEditColorHexText(cp.hex);
                          setNewEditLastValidHex(cp.hex);
                        }}
                        className="inline-flex items-center gap-1 bg-[#EDEDEF]/70 hover:bg-[#EDEDEF] px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700 transition-all cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: cp.hex }}
                        />
                        <span>{cp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Product Photos & Angles Gallery */}
              {(() => {
                const editHasUploading = editImageItems.some((img) => img.status === 'uploading');
                const editHasFailed = editImageItems.some((img) => img.status === 'failed');
                const editUploadingCount = editImageItems.filter((img) => img.status === 'uploading').length;
                const editFailedCount = editImageItems.filter((img) => img.status === 'failed').length;

                return (
                  <>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingEditPhoto(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingEditPhoto(false);
                      }}
                      onDrop={handleEditDrop}
                      onPaste={handleEditPaste}
                      className={`rounded-[22px] p-4 sm:p-5 border transition-all space-y-4 ${
                        isDraggingEditPhoto
                          ? 'bg-[#EDE9FE]/30 border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                          : 'bg-[#F7F7F8] border-black/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-[#111111] block">
                            Product Photos &amp; Angle Views ({editImageItems.length}) *
                          </label>
                          <span className="text-[11px] text-gray-500">
                            Upload photos from device, drag &amp; drop files, paste from clipboard, or add URL.
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                          {editImageItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                editImageItems.forEach((img) => {
                                  if (img.isObjectUrl && img.previewUrl?.startsWith('blob:')) {
                                    try { URL.revokeObjectURL(img.previewUrl); } catch {}
                                  }
                                });
                                setEditImageItems([
                                  {
                                    id: `edit_default_${Date.now()}`,
                                    file: null,
                                    previewUrl: '/images/hero-tee-black.png',
                                    isObjectUrl: false,
                                    finalUrl: '/images/hero-tee-black.png',
                                    status: 'uploaded',
                                    error: null,
                                  },
                                ]);
                                toast.success('Photos reset to default placeholder. Upload new photos.');
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full cursor-pointer transition-all border border-red-200"
                              title="Reset all photos on this product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Reset Photos</span>
                            </button>
                          )}
                          {editImageItems.length > 0 && (
                            <button
                              type="button"
                              disabled={editIsAnalyzingAi}
                              onClick={() => {
                                const activeItem = editImageItems[editPreviewActiveIndex] || editImageItems[0];
                                if (activeItem) {
                                  analyzeEditGarmentWithAi(activeItem.finalUrl || activeItem.previewUrl, activeItem.file);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-3.5 py-2 rounded-full cursor-pointer transition-all border border-[#7C3AED]/20 disabled:opacity-50"
                              title="Analyze active photo to auto-detect category, title, colors, and specs"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${editIsAnalyzingAi ? 'animate-spin' : ''}`} />
                              <span>{editIsAnalyzingAi ? 'Analyzing Piece...' : 'AI Auto-Detect'}</span>
                            </button>
                          )}
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-4 py-2 rounded-full cursor-pointer shadow-xs transition-all">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {editHasUploading
                                ? `Uploading (${editUploadingCount})...`
                                : '+ Upload New Photos'}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleEditFilesUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Drag & Drop Prompt Banner */}
                      <div className="border border-dashed border-black/10 rounded-[14px] p-2.5 text-center bg-white/70">
                        <span className="text-[11px] text-gray-500 font-medium">
                          Tip: Drag &amp; drop photos anywhere in this box, or paste directly with Ctrl+V
                        </span>
                      </div>

                      {/* Gallery Thumbnails Grid with Status Lifecycle */}
                      {editImageItems.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                            Photo Angles (First photo is Cover shown on store cards):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {editImageItems.map((item, idx) => {
                              const isUploading = item.status === 'uploading';
                              const isFailed = item.status === 'failed';
                              const isUploaded = item.status === 'uploaded';

                              return (
                                <div
                                  key={item.id || idx}
                                  className={`relative rounded-[14px] overflow-hidden border p-1 group flex flex-col justify-between aspect-[3/4] transition-all ${
                                    isFailed
                                      ? 'border-red-500 ring-2 ring-red-400 bg-red-50/50'
                                      : isUploading
                                      ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/50'
                                      : idx === 0
                                      ? 'bg-[#EDEDEF] border-[#7C3AED] ring-2 ring-[#7C3AED]/30'
                                      : 'bg-[#EDEDEF] border-black/[0.08]'
                                  }`}
                                >
                                  <img
                                    src={item.previewUrl}
                                    alt={`Angle ${idx + 1}`}
                                    className="w-full h-full object-cover rounded-[10px]"
                                  />

                                  {/* Status Badges */}
                                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start max-w-[80%]">
                                    {isUploading ? (
                                      <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Uploading...
                                      </span>
                                    ) : isFailed ? (
                                      <div className="flex flex-col gap-0.5 items-start">
                                        <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                          <AlertCircle className="w-2.5 h-2.5" />
                                          Failed - retry
                                        </span>
                                        {item.error && (
                                          <span
                                            className="bg-black/85 text-red-100 text-[8px] font-medium px-1.5 py-0.5 rounded shadow max-w-[120px] truncate"
                                            title={item.error}
                                          >
                                            {item.error}
                                          </span>
                                        )}
                                      </div>
                                    ) : idx === 0 ? (
                                      <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Cover Photo
                                      </span>
                                    ) : idx === 1 ? (
                                      <span className="bg-[#111111] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Angle 2 / Back
                                      </span>
                                    ) : (
                                      <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" />
                                        Angle {idx + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Top Right: Retry & Remove buttons */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                    {isFailed && item.file && (
                                      <button
                                        type="button"
                                        onClick={() => handleRetryEditImage(item.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                        title="Retry upload"
                                      >
                                        <RotateCw className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEditImage(item.id)}
                                      className="bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-all cursor-pointer shadow-sm"
                                      title="Remove photo"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Reorder & Set Cover Buttons */}
                                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveEditImage(idx, -1)}
                                        className="bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-all"
                                        title="Move Left"
                                      >
                                        <ChevronLeft className="w-3 h-3" />
                                      </button>
                                    )}
                                    {idx !== 0 && isUploaded && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetEditPrimaryImage(idx)}
                                        className="flex-1 bg-white/95 hover:bg-white text-[#7C3AED] text-[10px] font-bold py-1 px-1 rounded-full text-center shadow-xs transition-all cursor-pointer"
                                      >
                                        Cover
                                      </button>
                                    )}
                                    {idx < editImageItems.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveEditImage(idx, 1)}
                                        className="bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-all ml-auto"
                                        title="Move Right"
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Paste URL directly with inline error */}
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editUrlInput}
                            onChange={(e) => {
                              setEditUrlInput(e.target.value);
                              if (editUrlError) setEditUrlError('');
                            }}
                            placeholder="Or paste an image URL (https://...)..."
                            className={`flex-1 bg-white border ${
                              editUrlError ? 'border-red-400 focus:border-red-500' : 'border-black/[0.06]'
                            } rounded-full px-4 py-2 text-xs text-[#111111] outline-none transition-all`}
                          />
                          <button
                            type="button"
                            onClick={handleAddEditUrl}
                            className="bg-[#111111] text-white hover:bg-gray-800 text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all shrink-0"
                          >
                            + Add URL
                          </button>
                        </div>
                        {editUrlError && (
                          <p className="text-[11px] text-red-600 font-medium pl-3 pt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{editUrlError}</span>
                          </p>
                        )}
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
                      <div className="self-stretch sm:self-auto">
                        {editHasUploading && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            <span>Photos are currently uploading. Please wait...</span>
                          </div>
                        )}
                        {editHasFailed && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>
                              Fix or remove {editFailedCount} failed photo{editFailedCount > 1 ? 's' : ''} to save.
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-auto">
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
                          disabled={savingEdit || editHasUploading || editHasFailed}
                          className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-[#7C3AED]/50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          {editHasUploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Uploading Photo...</span>
                            </>
                          ) : savingEdit ? (
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
                    </div>
                  </>
                );
              })()}

            </form>
          </div>
        </div>
      )}

      {/* Repair Images Report Modal */}
      {showRepairModal && repairReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-[28px] border border-black/[0.08] shadow-2xl p-6 sm:p-8 my-8">
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-black/[0.06]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Image Repair Tool
                </span>
                <h3 className="text-xl font-bold text-[#111111] tracking-tight mt-0.5">
                  Repair Summary Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRepairModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#111111] transition-all cursor-pointer"
                aria-label="Close repair modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#F7F7F8] p-3 rounded-2xl text-center border border-black/[0.04]">
                  <span className="text-2xl font-bold text-[#111111] block">{repairReport.scanned}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Scanned</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl text-center border border-emerald-100">
                  <span className="text-2xl font-bold text-emerald-700 block">{repairReport.converted}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Converted</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
                  <span className="text-2xl font-bold text-amber-700 block">{repairReport.removed}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-700">Removed</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1.5">
                  Products Needing Manual Re-upload ({repairReport.manualReuploadIds?.length || 0}):
                </span>
                {repairReport.manualReuploadIds && repairReport.manualReuploadIds.length > 0 ? (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1">
                    <p className="text-xs text-amber-800 font-medium mb-1.5">
                      The following products had all gallery images removed because they were dead blob: URLs. Default placeholder assigned:
                    </p>
                    <ul className="list-disc list-inside text-xs font-mono text-amber-900 space-y-0.5">
                      {repairReport.manualReuploadIds.map((id) => (
                        <li key={id}>{id}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-800 font-medium">
                    No products require manual re-upload. All product images are valid.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-5 mt-6 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setShowRepairModal(false)}
                className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
