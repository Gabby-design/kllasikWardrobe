"use client";

import { useState, useEffect } from 'react';
import { getLatestProducts } from '../backend/services/products';
import { formatPrice } from '../frontend/lib/utils';
import { useCartStore } from '../store/cartStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PRODUCTS } from '../data/catalog';
import { ShopTheLook } from '../frontend/components/ShopTheLook';
import { QuickViewModal } from '../frontend/components/QuickViewModal';
import { SizeGuideModal } from '../frontend/components/SizeGuideModal';
import { CartDrawer } from '../frontend/components/CartDrawer';
import { CheckoutModal } from '../frontend/components/CheckoutModal';

import { Navbar } from '../frontend/components/Navbar';
import { Hero } from '../frontend/components/Hero';
import { ProductGrid } from '../frontend/components/ProductGrid';
import { AvantGardeButton } from '../frontend/components/Button';
import Link from 'next/link';


function App() {
  // const supabase = createClient();
  const [dbProducts, setDbProducts] = useState(PRODUCTS.slice(0, 4));

  useEffect(() => {
    async function fetchProducts() {
      const data = await getLatestProducts(4);
      const error = null;
      
      if (data && data.length > 0) {
        setDbProducts([...data, ...PRODUCTS].slice(0, 4));
      }
    }
    fetchProducts();
  }, []);

  const [selectedPrice, setSelectedPrice] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addToCart, setIsCartOpen, cart, cartSubtotal, clearCart } = useCartStore();
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

  // Format currency helper imported from utils

  const handleAddToCart = (product, size = 'L', color = null) => {
    addToCart(product, size, color);
    toast.success(`Added "${product.title}" (${size}) to your bag!`);
  };

  const handleBuyNow = (product) => {
    const size = getSelectedSize(product.id);
    const color = getSelectedColor(product);
    addToCart(product, size, color);
    setIsCartOpen(true); // Open the drawer instead of local checkout modal
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
    <div className="app-container">

      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setIsSizeGuideOpen={setIsSizeGuideOpen}
      />

      <main className="w-full" id="home">
        <Hero />
        
        <ProductGrid
          filteredProducts={filteredProducts}
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

        <div className="flex justify-center mt-12 mb-24 px-6">
          <Link href="/catalog" className="bg-[#1a1a1a] text-[#f8f8f8] font-bold font-['Syne'] uppercase tracking-widest px-8 py-4 hover:bg-neutral-800 transition-colors border border-transparent">
            View Full Collection
          </Link>
        </div>

        <ShopTheLook />
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

      <CheckoutModal
        formatPrice={formatPrice}
        cartSubtotal={cartSubtotal()}
        cart={cart}
        setCart={clearCart}
      />
    </div>
  );
}

export default App;
