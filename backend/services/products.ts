"use server";

import { createClient } from '../lib/supabase';
import { Product } from '../../types';

export async function getLatestProducts(limit?: number): Promise<Product[]> {
  const supabase = await createClient();
  
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    title: p.name,
    price: p.price,
    description: p.description,
    stock: p.stock !== undefined ? p.stock : 10,
    image: p.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    fallbackImage: p.image_url,
    gallery: [p.image_url].filter(Boolean),
    category: 'Essential',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Standard', hex: '#1a1a1a' }]
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching product by ID:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    title: data.name,
    price: data.price,
    description: data.description,
    stock: data.stock !== undefined ? data.stock : 10,
    image: data.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    fallbackImage: data.image_url,
    gallery: [data.image_url].filter(Boolean),
    category: 'Essential',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Standard', hex: '#1a1a1a' }]
  };
}
