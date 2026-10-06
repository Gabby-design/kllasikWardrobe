"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '../../utils/supabase/client';
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
import { Sparkles, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const itemsPerPage = 6;

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
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212]">
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full pt-32 sm:pt-40 pb-20" id="catalog-page">
        
        {/* Editorial Header */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
              Nigeria&apos;s Heavyweight Archive
            </span>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground"
          >
            The Full Collection
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-xs sm:text-sm text-foreground/70 max-w-xl mx-auto leading-relaxed"
          >
            Explore our complete archive of 240–300 GSM organic cotton and silk-blend luxury essentials. Transparent fixed pricing at ₦30,000, ₦35,000, and ₦40,000.
          </motion.p>
        </section>

        {/* Category Filter Pills */}
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

        {/* Luxury Pagination UI */}
        {filteredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* Previous Page Button */}
              <button
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                aria-label="Previous Page"
                className={`h-11 px-4 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] font-semibold transition-all duration-200 border ${
                  activePage <= 1
                    ? 'opacity-30 cursor-not-allowed border-foreground/10 bg-white/40 text-foreground/40'
                    : 'cursor-pointer bg-white text-foreground border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground shadow-sm'
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
                      className={`w-11 h-11 flex items-center justify-center font-sans text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-foreground text-background border border-foreground shadow-md' 
                          : 'bg-white text-foreground/80 border border-foreground/15 hover:border-foreground hover:text-foreground'
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
                className={`h-11 px-4 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.16em] font-semibold transition-all duration-200 border ${
                  activePage >= totalPages
                    ? 'opacity-30 cursor-not-allowed border-foreground/10 bg-white/40 text-foreground/40'
                    : 'cursor-pointer bg-white text-foreground border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground shadow-sm'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Range & Page Details */}
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-foreground/50 text-center">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} pieces &bull; Page {activePage} of {totalPages}
            </p>
          </section>
        )}
      </main>

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

function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-[#F9F8F6]">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}

export default CatalogPage;
