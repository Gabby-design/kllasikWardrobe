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
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const itemsPerPage = 9;

  const selectedCategory = searchParams.get('category') || 'ALL';

  const [dbProducts, setDbProducts] = useState(PRODUCTS);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (!isSupabaseConfigured) {
        let filteredStatic = PRODUCTS;
        if (selectedCategory !== 'ALL' && selectedCategory !== 'All') {
          filteredStatic = PRODUCTS.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        setDbProducts(filteredStatic);
        setTotalPages(Math.max(1, Math.ceil(filteredStatic.length / itemsPerPage)));
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      if (!supabase) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn('Supabase query error:', error.message);
        }

        if (data && data.length > 0) {
          let formattedProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            title: p.name,
            price: p.price,
            description: p.description,
            stock: p.stock !== undefined ? p.stock : 10,
            image: p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
            fallbackImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
            gallery: [p.image_url],
            brand: p.brand || 'Klasik Wardrobe',
            category: p.category || (p.price >= 40000 ? 'Executive' : p.price >= 30000 ? 'Signature' : 'Essential'),
            gsm: p.gsm || (p.price >= 40000 ? '300 GSM Silk Infusion' : p.price >= 30000 ? '280 GSM French Terry' : '240 GSM Organic Cotton'),
            material: p.material || '100% Combed Cotton',
            fit: p.fit || 'Drop Shoulder Oversized',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            colors: [{ name: p.color || 'Standard', hex: '#1a1a1a' }]
          }));

          if (selectedCategory !== 'ALL' && selectedCategory !== 'All') {
            formattedProducts = formattedProducts.filter(p => 
              p.category.toLowerCase() === selectedCategory.toLowerCase()
            );
          }

          setTotalPages(Math.max(1, Math.ceil(formattedProducts.length / itemsPerPage)));
          const from = (currentPage - 1) * itemsPerPage;
          const to = from + itemsPerPage;
          setDbProducts(formattedProducts.slice(from, to));
        } else {
          // Fallback to rich catalog data if no products in database
          let filteredStatic = PRODUCTS;
          if (selectedCategory !== 'ALL' && selectedCategory !== 'All') {
            filteredStatic = PRODUCTS.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
          }
          setDbProducts(filteredStatic);
          setTotalPages(Math.max(1, Math.ceil(filteredStatic.length / itemsPerPage)));
        }
      } catch (err) {
        console.error('Catalog fetch error:', err);
        setDbProducts(PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [currentPage, itemsPerPage, selectedCategory]);

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

  const formatPrice = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

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

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
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
        {isLoading ? (
          <div className="flex justify-center items-center py-24 min-h-[40vh]">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ProductGrid
            filteredProducts={filteredProducts}
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
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center font-sans text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-foreground text-background border border-foreground shadow-md' 
                        : 'bg-white text-foreground border border-foreground/15 hover:border-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
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
