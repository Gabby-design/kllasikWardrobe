"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '../../src/store/cartStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PRODUCTS } from '../../src/data/catalog';
import { QuickViewModal } from '../../src/components/QuickViewModal';
import { SizeGuideModal } from '../../src/components/SizeGuideModal';
import { CartDrawer } from '../../src/components/CartDrawer';
import { Navbar } from '../../src/components/Navbar';
import { ProductGrid } from '../../src/components/ProductGrid';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { BottomNav } from '../../src/components/BottomNav';
import { Sparkles, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const itemsPerPage = 8;

  const selectedCategory = searchParams.get('category') || 'ALL';

  const [allProducts, setAllProducts] = useState(PRODUCTS);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const queryUrl = selectedCategory !== 'ALL' && selectedCategory !== 'All'
          ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
          : '/api/products';

        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.products && data.products.length > 0) {
            setAllProducts(data.products);
            return;
          }
        }
      } catch (err) {
        console.warn('Catalog fetch notice (using verified catalog):', err);
      }
      setAllProducts(PRODUCTS);
    }
    fetchProducts();
  }, [selectedCategory]);

  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToCart, setIsCartOpen } = useCartStore();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewSize, setQuickViewSize] = useState('L');
  const [quickViewColor, setQuickViewColor] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [selectedCardSizes, setSelectedCardSizes] = useState({});
  const [selectedCardColors, setSelectedCardColors] = useState({});
  const [cardActiveImages, setCardActiveImages] = useState({});
  const [quickViewActiveImg, setQuickViewActiveImg] = useState(null);

  const getSelectedSize = (productId) => selectedCardSizes[productId] || 'L';

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

  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString('en-US')}`;

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

  const filteredProducts = allProducts.filter((p) => {
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === activePage) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    const gridSection = document.getElementById('catalog-products-section') || document.getElementById('catalog-page');
    if (gridSection) {
      gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] pb-24 md:pb-12">
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full pt-28 sm:pt-32 md:pt-36" id="catalog-page">
        
        {/* Catalog Header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="font-sans text-xs font-semibold text-[#7C3AED]">
              Nigeria&apos;s Heavyweight Archive
            </span>
          </div>

          <h1 className="font-sans text-2xl sm:text-4xl font-bold tracking-tight mb-2 text-[#111111]">
            The Full Collection
          </h1>

          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Explore our complete archive of 240–300 GSM organic cotton and silk-blend luxury essentials.
          </p>

          {/* Top: Pill Search Bar + Filter Button */}
          <div className="mt-5 max-w-md mx-auto">
            <div className="relative flex items-center bg-white rounded-full border border-black/[0.04] shadow-[0_8px_24px_rgba(17,17,17,0.06)] px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[#7C3AED]/20 focus-within:border-[#EDE9FE]">
              <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-sans text-[#111111] placeholder:text-gray-400"
                placeholder="Search collection..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white flex items-center justify-center transition-colors flex-shrink-0 ml-1.5 cursor-pointer shadow-xs"
                title="Filter Options"
                aria-label="Filter Options"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Horizontal Scrollable Category Chips */}
        <CategoryFilter />

        {/* Product Grid Area */}
        <div id="catalog-products-section">
          <ProductGrid
            filteredProducts={paginatedProducts}
            selectedCategory={selectedCategory}
            setSelectedCategory={() => {}}
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

        {/* Modern Rounded Pagination UI */}
        {filteredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* Previous Page Button */}
              <button
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                aria-label="Previous Page"
                className={`h-10 px-4 flex items-center gap-2 font-sans text-xs font-semibold rounded-full transition-all duration-200 border ${
                  activePage <= 1
                    ? 'opacity-30 cursor-not-allowed border-black/[0.04] bg-white text-gray-400'
                    : 'cursor-pointer bg-white text-gray-700 border-black/[0.04] hover:text-[#7C3AED] shadow-[0_4px_16px_rgba(17,17,17,0.04)]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isActive = pageNum === activePage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-[#7C3AED] text-white shadow-sm' 
                          : 'bg-white text-gray-700 border border-black/[0.04] hover:text-[#7C3AED] shadow-[0_4px_16px_rgba(17,17,17,0.04)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage >= totalPages}
                aria-label="Next Page"
                className={`h-10 px-4 flex items-center gap-2 font-sans text-xs font-semibold rounded-full transition-all duration-200 border ${
                  activePage >= totalPages
                    ? 'opacity-30 cursor-not-allowed border-black/[0.04] bg-white text-gray-400'
                    : 'cursor-pointer bg-white text-gray-700 border-black/[0.04] hover:text-[#7C3AED] shadow-[0_4px_16px_rgba(17,17,17,0.04)]'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="font-sans text-[11px] text-gray-400 font-medium">
              Showing page {activePage} of {totalPages} ({filteredProducts.length} items total)
            </span>
          </section>
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
        formatPrice={formatPrice}
        handleAddToCart={handleAddToCart}
      />

      <SizeGuideModal
        isSizeGuideOpen={isSizeGuideOpen}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <CartDrawer />

    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
