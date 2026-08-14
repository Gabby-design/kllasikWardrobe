-- database_setup.sql
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the 'products' table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  image_url text,
  stock integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from 'products' (so customers can see the store)
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Allow authenticated users / service role to manage products
CREATE POLICY "Authenticated users can insert products" 
ON public.products FOR INSERT 
TO authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.products FOR UPDATE 
TO authenticated, service_role
USING (true);


-- 2. Create the 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL,
  payment_status text DEFAULT 'Pending Transfer' NOT NULL,
  delivery_status text DEFAULT 'Processing' NOT NULL,
  shipping_address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If table already exists with old schema, ensure required columns exist:
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending Transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'Processing';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Enable Row Level Security (RLS) on 'orders'
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including guest checkout) to create orders
CREATE POLICY "Allow public insert for orders" 
ON public.orders FOR INSERT 
TO public
WITH CHECK (true);

-- Allow anyone to select orders (or filter by user_id/service_role)
CREATE POLICY "Allow select for orders" 
ON public.orders FOR SELECT 
TO public
USING (true);

-- Allow updates (e.g. updating delivery/payment status from admin)
CREATE POLICY "Allow update for orders" 
ON public.orders FOR UPDATE 
TO public
USING (true);


-- 3. Stock Decrement RPC Function
CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, qty int)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, COALESCE(stock, 10) - qty)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;


-- 4. Set up Storage Bucket for 'products' (if not already created)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'products' bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated, service_role
WITH CHECK (bucket_id = 'products');

