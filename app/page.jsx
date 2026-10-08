"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '../src/store/cartStore';
import toast from 'react-hot-toast';
import { PRODUCTS } from '../src/data/catalog';
import { QuickViewModal } from '../src/components/QuickViewModal';
import { SizeGuideModal } from '../src/components/SizeGuideModal';
import { CartDrawer } from '../src/components/CartDrawer';
import { Navbar } from '../src/components/Navbar';
import { ProductGrid } from '../src/components/ProductGrid';
import { BottomNav } from '../src/components/BottomNav';
import { Sparkles, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { mergeWithStoredProducts, subscribeToProductChanges } from '../src/utils/productSync.js';

export default function HomePage() {
  const [dbProducts, setDbProducts] = useState(PRODUCTS);
  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { addToCart, setIsCartOpen } = useCartStore();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewSize, setQuickViewSize] = useState('L');
  const [quickViewColor, setQuickViewColor] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectedCardSizes, setSelectedCardSizes] = useState({});
  const [selectedCardColors, setSelectedCardColors] = useState({});
  const [cardActiveImages, setCardActiveImages] = useState({});
  const [quickViewActiveImg, setQuickViewActiveImg] = useState(null);

  useEffect(() => {
    // 1. Immediately hydrate with any locally saved updates
    setDbProducts((current) => mergeWithStoredProducts(current));

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cat = urlParams.get('category');
      if (cat) {
        setSelectedCategory(cat);
      }
    }

    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.products && data.products.length > 0) {
            const merged = mergeWithStoredProducts(data.products);
            setDbProducts(merged);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend API products notice (using default catalog):', err.message);
      }
      setDbProducts(mergeWithStoredProducts(PRODUCTS));
    }
    fetchProducts();

    // 2. Real-time subscription across tabs & on focus
    const unsubscribe = subscribeToProductChanges(() => {
      fetchProducts();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getSelectedSize = (productId) => {
    if (selectedCardSizes[productId]) return selectedCardSizes[productId];
    const prod = dbProducts.find((p) => p.id === productId);
    if (prod && Array.isArray(prod.sizes) && prod.sizes.length > 0) {
      return prod.sizes.includes('L') ? 'L' : prod.sizes[0];
    }
    return 'L';
  };

  const handleSelectCardSize = (productId, size) => {
    setSelectedCardSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const getSelectedColor = (product) => selectedCardColors[product.id] || product.colors[0]?.name;

  const handleSelectCardColor = (productId, colorName) => {
    setSelectedCardColors((prev) => ({ ...prev, [productId]: colorName }));
  };

  const getCardImage = (product) => cardActiveImages[product.id] || product.image;

  const handleSelectCardImage = (productId, imgUrl) => {
    setCardActiveImages((prev) => ({ ...prev, [productId]: imgUrl }));
  };

  const formatPrice = (amount) => {
    return `₦${Number(amount || 0).toLocaleString('en-US')}`;
  };

  const handleAddToCart = (product, size = 'L', color = null) => {
    addToCart(product, size, color);
    toast.success(`Added "${product.title}" (${size}) to your bag!`);
  };

  const handleBuyNow = (product) => {
    const size = getSelectedSize(product.id);
    const color = getSelectedColor(product);
    addToCart(product, size, color);
    setIsCartOpen(true);
  };

  // Filtered Products
  const filteredProducts = dbProducts.filter((p) => {
    const matchesPrice = selectedPrice === 'ALL' || p.price === Number(selectedPrice);
    const matchesCategory =
      selectedCategory === 'ALL' ||
      selectedCategory === 'All' ||
      p.category?.toLowerCase() === selectedCategory?.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === '' ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPrice && matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const categories = [
    { label: 'All Pieces', value: 'ALL' },
    { label: 'T-Shirts', value: 'T-Shirts' },
    { label: 'Jeans', value: 'Jeans' },
    { label: 'Short Jeans', value: 'Short Jeans' },
    { label: 'Beach Pants', value: 'Beach Pants' },
  ];

  const handleCategorySelect = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === activePage) return;
    setCurrentPage(newPage);
    const gridEl = document.getElementById('catalog-products-section');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] pb-24 md:pb-12">

      {/* Floating Navbar */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full pt-24 sm:pt-28 md:pt-32" id="catalog-main">
        
        {/* Header & Search Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 sm:mb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="font-sans text-xs font-semibold text-[#7C3AED]">
              Nigeria&apos;s Heavyweight Essentials
            </span>
          </div>

          <h1 className="font-sans text-2xl sm:text-4xl font-bold tracking-tight mb-2 text-[#111111]">
            The Collection
          </h1>

          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Explore heavyweight organic cotton tees, selvedge denim jeans, summer jorts, and luxury linen beach pants.
          </p>

          {/* Search Bar: Mobile only (Desktop uses the single search bar in the Navbar) */}
          <div className="mt-4 max-w-md mx-auto sm:hidden">
            <div className="relative flex items-center bg-white rounded-full border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[#7C3AED]/20 focus-within:border-[#EDE9FE]">
              <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-sans text-[#111111] placeholder:text-gray-400"
                placeholder="Search collection..."
                value={searchQuery || ''}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1.5 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (categories.findIndex(c => c.value === selectedCategory) + 1) % categories.length;
                  handleCategorySelect(categories[nextIdx].value);
                }}
                className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white flex items-center justify-center transition-colors flex-shrink-0 ml-1.5 cursor-pointer shadow-xs"
                title="Toggle Category Filter"
                aria-label="Toggle Category Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Horizontal Scrollable Category Chips */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`flex-shrink-0 font-sans text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:text-[#7C3AED] border border-black/[0.04] shadow-[0_4px_16px_rgba(17,17,17,0.05)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Mobile / Multi-column Desktop Product Grid */}
        <div id="catalog-products-section">
          <ProductGrid
            filteredProducts={paginatedProducts}
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategorySelect}
            showCategoryFilter={false}
            setSelectedPrice={setSelectedPrice}
            setSearchQuery={setSearchQuery}
            getCardImage={getCardImage}
            formatPrice={formatPrice}
            handleSelectCardImage={handleSelectCardImage}
            setQuickViewProduct={setQuickViewProduct}
            setQuickViewActiveImg={setQuickViewActiveImg}
            setQuickViewSize={setQuickViewSize}
            setQuickViewColor={setQuickViewColor}
            getSelectedSize={getSelectedSize}
            handleSelectCardSize={handleSelectCardSize}
            getSelectedColor={getSelectedColor}
            handleSelectCardColor={handleSelectCardColor}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
          />
        </div>

        {/* Rounded Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-12 px-4 select-none">
            <button
              type="button"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              aria-label="Previous page"
              className="w-10 h-10 rounded-full bg-white border border-black/[0.04] text-[#111111] flex items-center justify-center transition-all shadow-[0_4px_16px_rgba(17,17,17,0.05)] disabled:opacity-30 disabled:pointer-events-none hover:bg-[#EDE9FE] hover:text-[#7C3AED] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-white border border-black/[0.04] shadow-[0_4px_16px_rgba(17,17,17,0.05)] p-1 rounded-full">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === activePage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#7C3AED] hover:bg-[#EDE9FE]/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              aria-label="Next page"
              className="w-10 h-10 rounded-full bg-white border border-black/[0.04] text-[#111111] flex items-center justify-center transition-all shadow-[0_4px_16px_rgba(17,17,17,0.05)] disabled:opacity-30 disabled:pointer-events-none hover:bg-[#EDE9FE] hover:text-[#7C3AED] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />

      {/* Modals & Slide-out Bag */}
      <QuickViewModal
        quickViewProduct={quickViewProduct}
        setQuickViewProduct={setQuickViewProduct}
        quickViewActiveImg={quickViewActiveImg}
        setQuickViewActiveImg={setQuickViewActiveImg}
        quickViewSize={quickViewSize}
        setQuickViewSize={setQuickViewSize}
        quickViewColor={quickViewColor}
        setQuickViewColor={setQuickViewColor}
        formatPrice={formatPrice}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <SizeGuideModal
        isSizeGuideOpen={isSizeGuideOpen}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <CartDrawer />

    </div>
  );
}
