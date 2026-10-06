"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '../src/store/cartStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PRODUCTS, REVIEWS } from '../src/data/catalog';
import { ShopTheLook } from '../src/components/ShopTheLook';
import { QuickViewModal } from '../src/components/QuickViewModal';
import { SizeGuideModal } from '../src/components/SizeGuideModal';
import { CartDrawer } from '../src/components/CartDrawer';
import { Navbar } from '../src/components/Navbar';
import { Hero } from '../src/components/Hero';
import { ProductGrid } from '../src/components/ProductGrid';
import { BottomNav } from '../src/components/BottomNav';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Feather, Layers, Star, ArrowRight } from 'lucide-react';

function App() {
  const [dbProducts, setDbProducts] = useState(PRODUCTS);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data && data.products && data.products.length > 0) {
            setDbProducts(data.products);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend API products notice (using default catalog):', err.message);
      }
      setDbProducts(PRODUCTS);
    }
    fetchProducts();
  }, []);

  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
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
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPrice && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111] pb-24 md:pb-12">

      {/* Floating Navbar */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full">
        {/* 1. Hero Showcase */}
        <Hero />
        
        {/* 2. Collection Product Grid & Categories */}
        <ProductGrid
          filteredProducts={filteredProducts.slice(0, 8)}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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

        {/* View Full Collection CTA */}
        <div className="flex justify-center mb-14 px-6">
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs sm:text-sm font-semibold px-8 py-3.5 rounded-full shadow-md active:scale-95 transition-all duration-300 group"
          >
            <span>Explore full collection</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3. Fabric & Craftsmanship Architecture Section */}
        <section className="bg-gradient-to-br from-[#111111] via-[#1E113A] to-[#111111] text-white py-16 sm:py-20 px-6 sm:px-10 lg:px-14 relative overflow-hidden my-10 rounded-[24px] max-w-7xl mx-4 sm:mx-6 lg:mx-auto shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <span className="font-sans text-xs font-semibold text-purple-300 flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Material Mastery & Engineering
              </span>
              <h2 className="font-sans text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                The Anatomy of 300 GSM Heavyweight Luxury
              </h2>
              <p className="font-sans text-xs sm:text-sm text-purple-100/75 leading-relaxed">
                Every Klasik garment undergoes rigorous preshrunk bio-washing and dense tight-knit weave construction to preserve structure and collar integrity through hundreds of washes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {/* Feature 1 */}
              <div className="bg-white/[0.06] border border-white/10 p-6 rounded-[20px] backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/30 text-purple-200 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-sans text-base font-bold text-white mb-1.5">
                  240–300 GSM Organic Weave
                </h3>
                <p className="font-sans text-xs text-purple-100/70 leading-relaxed">
                  Substantial density without suffocating stiffness. Combed natural fibers produce an ultra-clean matte surface drape that holds its boxy dropped silhouette effortlessly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/[0.06] border border-white/10 p-6 rounded-[20px] backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/30 text-purple-200 flex items-center justify-center mb-4">
                  <Feather className="w-5 h-5" />
                </div>
                <h3 className="font-sans text-base font-bold text-white mb-1.5">
                  Mulberry Silk & Pima Infusion
                </h3>
                <p className="font-sans text-xs text-purple-100/70 leading-relaxed">
                  Our Executive tier combines rare Peruvian Pima and mulberry silk threads, generating a cloud-like cool handfeel and subtle luster that resists pilling.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/[0.06] border border-white/10 p-6 rounded-[20px] backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED]/30 text-purple-200 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-sans text-base font-bold text-white mb-1.5">
                  Reinforced Anti-Sag Ribbed Collar
                </h3>
                <p className="font-sans text-xs text-purple-100/70 leading-relaxed">
                  Dual-layer high-density elastane collar ribbing engineered to remain completely flat, sharp, and snug around the neck without stretching out over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Shop The Look Editorial Section */}
        <ShopTheLook />

        {/* 5. Customer & Stylist Reviews Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
            <div>
              <span className="font-sans text-xs font-semibold text-[#7C3AED] mb-1 block">
                Customer & Stylist Reviews
              </span>
              <h2 className="font-sans text-xl sm:text-3xl font-bold tracking-tight text-[#111111]">
                Worn Across Nigeria
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-[#EDE9FE]/50 px-3.5 py-1.5 rounded-full border border-[#EDE9FE]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="font-sans text-xs font-bold text-[#7C3AED] ml-1">4.95 / 5.0 Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {REVIEWS.map((rev, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-black/[0.04] p-6 rounded-[24px] shadow-[0_8px_24px_rgba(17,17,17,0.06)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed mb-6 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="border-t border-black/[0.04] pt-3.5">
                  <div className="font-sans font-bold text-xs sm:text-sm text-[#111111]">{rev.name}</div>
                  <div className="font-sans text-[11px] text-gray-400">{rev.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

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

export default App;
