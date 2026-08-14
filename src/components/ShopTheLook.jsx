"use client";
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ShopTheLook() {
  const { addToCart } = useCartStore();

  const lookItems = [
    {
      id: 'kwt-01',
      title: 'Essential 240 GSM Noir',
      price: 30000,
      image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop',
      gsm: '240 GSM Combed Cotton',
      fit: 'Oversized Drop-Shoulder'
    },
    {
      id: 'kwt-03',
      title: 'Executive Cotton-Silk',
      price: 40000,
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop',
      gsm: '280 GSM Mulberry Silk Blend',
      fit: 'Tailored Luxury Fit'
    }
  ];

  const handleAddLookItem = (item) => {
    addToCart(item, 'L', 'Standard');
    toast.success(`Added ${item.title} to your bag!`);
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-foreground/10">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span className="font-sans text-[0.7rem] uppercase tracking-[0.25em] font-bold text-foreground/50 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Editorial Streetwear Pairing
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground mt-1">
            Shop The Look &bull; Issue 01
          </h2>
        </div>

        <Link 
          href="/catalog" 
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] font-bold text-foreground hover:opacity-60 transition-opacity"
        >
          <span>View Lookbook Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Editorial Feature Image (7 Cols) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="lg:col-span-7 relative group"
        >
          <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-foreground/5 shadow-2xl border border-foreground/10">
            <img 
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop" 
              alt="Klasik Streetwear Editorial Look" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            
            {/* Ambient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-white">
              <div>
                <span className="font-sans text-[0.65rem] uppercase tracking-[0.25em] font-bold text-amber-300">
                  Curated Silhouette
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold">
                  Look 01 &mdash; The Midnight Monolith
                </h3>
              </div>
              <span className="font-sans text-xs font-semibold px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30">
                Victoria Island, Lagos
              </span>
            </div>
          </div>
        </motion.div>

        {/* Coordinated Pieces Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-foreground/50 border-b border-foreground/10 pb-3">
            Featured In This Look
          </span>

          {lookItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="bg-white border border-foreground/10 p-5 shadow-sm hover:shadow-md transition-all flex gap-5 items-center group"
            >
              <div className="w-24 h-32 bg-foreground/5 overflow-hidden flex-shrink-0 border border-foreground/10">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>

              <div className="flex flex-col justify-between flex-1">
                <div>
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-foreground/50 font-bold block mb-1">
                    {item.gsm}
                  </span>
                  <h4 className="font-serif text-base font-bold text-foreground leading-snug mb-1">
                    {item.title}
                  </h4>
                  <div className="font-sans text-sm font-bold text-foreground mb-3">
                    ₦{item.price.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => handleAddLookItem(item)}
                  className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-neutral-800 font-sans text-xs uppercase tracking-[0.18em] font-bold px-4 py-2.5 transition-all self-start shadow-sm cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add To Bag</span>
                </button>
              </div>
            </motion.div>
          ))}

          {/* Guarantee Note */}
          <div className="p-4 bg-foreground/[0.02] border border-foreground/10 font-sans text-xs text-foreground/70 flex items-center justify-between">
            <span>Free Express Courier on paired orders over ₦70,000</span>
            <span className="font-bold text-foreground">₦70,000 Bundle</span>
          </div>

        </div>

      </div>

    </section>
  );
}
