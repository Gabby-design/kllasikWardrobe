"use client";

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
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
import Link from 'next/link';
import { Sparkles, ShieldCheck, Feather, Layers, Star, ArrowRight } from 'lucide-react';

function App() {
  const supabase = createClient();
  const [dbProducts, setDbProducts] = useState(PRODUCTS);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase fetch products notice:', error.message);
      }
      
      if (data && data.length > 0) {
        const formattedProducts = data.map(p => ({
          id: p.id,
          name: p.name,
          title: p.name,
          price: p.price,
          description: p.description,
          stock: p.stock !== undefined ? p.stock : 10,
          image: p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
          fallbackImage: p.image_url,
          gallery: [p.image_url],
          category: 'Essential',
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: [{ name: 'Standard', hex: '#1a1a1a' }]
        }));
        setDbProducts([...formattedProducts, ...PRODUCTS]);
      }
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
    return `₦${Number(amount || 0).toLocaleString()}`;
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
    <div className="min-h-screen bg-[#F9F8F6] text-[#121212]">

      {/* Floating Navbar */}
      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full">
        {/* 1. Hero Showcase */}
        <Hero />
        
        {/* 2. Collection Product Grid */}
        <ProductGrid
          filteredProducts={filteredProducts.slice(0, 6)}
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
        <div className="flex justify-center mb-24 px-6">
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-3 bg-foreground text-background font-sans text-xs uppercase tracking-[0.2em] font-bold px-10 py-5 hover:bg-neutral-800 transition-all duration-300 shadow-lg group"
          >
            <span>Explore All 9 Heavyweight Pieces</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3. Fabric & Craftsmanship Architecture Section */}
        <section className="bg-[#111111] text-[#F9F8F6] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-amber-400/90 flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Material Mastery & Engineering
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                The Anatomy of 300 GSM Heavyweight Luxury
              </h2>
              <p className="font-sans text-sm text-white/70 leading-relaxed">
                Every Klasik garment undergoes rigorous preshrunk bio-washing and dense tight-knit weave construction to preserve structure and collar integrity through hundreds of washes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-black/60 border border-white/10 p-8 shadow-inner">
                <Layers className="w-8 h-8 text-amber-400 mb-6" />
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  240–300 GSM Organic Weave
                </h3>
                <p className="font-sans text-xs text-white/70 leading-relaxed">
                  Substantial density without suffocating stiffness. Combed natural fibers produce an ultra-clean matte surface drape that holds its boxy dropped silhouette effortlessly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-black/60 border border-white/10 p-8 shadow-inner">
                <Feather className="w-8 h-8 text-amber-400 mb-6" />
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  Mulberry Silk & Pima Infusion
                </h3>
                <p className="font-sans text-xs text-white/70 leading-relaxed">
                  Our Executive tier combines rare Peruvian Pima and mulberry silk threads, generating a cloud-like cool handfeel and subtle luster that resists pilling.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-black/60 border border-white/10 p-8 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-amber-400 mb-6" />
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  Reinforced Anti-Sag Ribbed Collar
                </h3>
                <p className="font-sans text-xs text-white/70 leading-relaxed">
                  Dual-layer high-density elastane collar ribbing engineered to remain completely flat, sharp, and snug around the neck without stretching out over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Shop The Look Editorial Section */}
        <ShopTheLook />

        {/* 5. Verified Customer & Stylist Reviews Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-foreground/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50">
                Peer & Stylist Validation
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
                Worn & Endorsed Across Nigeria
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
              <span className="font-sans text-xs font-bold text-foreground ml-2">4.95 / 5.0 Average Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {REVIEWS.map((rev, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="bg-white border border-foreground/10 p-8 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed italic mb-6">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="border-t border-foreground/10 pt-4">
                  <div className="font-serif font-bold text-sm text-foreground">{rev.name}</div>
                  <div className="font-sans text-[0.7rem] uppercase tracking-wider text-foreground/50">{rev.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

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
