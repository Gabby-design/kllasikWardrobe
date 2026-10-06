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


-- 5. Seed Real Klassic Wardrobe Heavyweight T-Shirt Products
INSERT INTO public.products (name, price, description, image_url, stock)
VALUES 
  ('Klassic Never Heavyweight Noir Tee', 30000, 'Crafted from 240 GSM 100% combed organic cotton. Features clean minimalist "NEVER" chest graphic and dropped shoulder silhouette.', '/images/media__1786369656046.jpg', 15),
  ('Klassic Mindset Over Everything Heavyweight Tee', 35000, '260 GSM dense organic cotton featuring high-contrast orange and white "MINDSET OVER EVERYTHING" box typography.', '/images/media__1786370258071_2.jpg', 12),
  ('Klassic Dark Cat Silhouette Heavyweight Tee', 40000, '280 GSM luxury combed cotton with arched "DARK" typography and luminous cat silhouette graphic.', '/images/media__1786369606088.jpg', 10),
  ('Klassic Whatever Brush-Stroke Sky Blue Tee', 30000, 'Minimalist streetwear graphic tee in Sky Blue with distinctive white brush-stroke overlay and bold typography.', '/images/media__1786369626673.jpg', 18),
  ('Klassic Sukuna Graphic Heavyweight Tee', 35000, '260 GSM heavyweight cotton tee in pure white with high-definition anime character illustration and reinforced neckline.', '/images/media__1786369649479.jpg', 14),
  ('Klassic Life Is Short Minimalist Clock Tee', 40000, '300 GSM luxury structured white tee with modern minimalist geometric clock motif: "Life is short. LIVE IT".', '/images/media__1786370258071.jpg', 8),
  ('Klassic Dark Cat Silhouette Wine Edition', 30000, 'Deep burgundy/wine heavyweight cotton tee with signature arched "DARK" insignia and eye graphic. Double-layered collar.', '/images/media__1786370258071_1.jpg', 10),
  ('Klassic Mindset Noir Signature Edition', 35000, 'Garment-dyed for a premium streetwear finish. Features "MINDSET OVER EVERYTHING" insignia and durable double-stitched hem.', '/images/media__1786370258071_2.jpg', 10),
  ('Klassic Never Noir Executive Edition', 40000, '300 GSM ultra-heavyweight combed cotton with "NEVER" minimalist insignia and tailored drape. Maximum durability.', '/images/media__1786369656046.jpg', 6),
  ('Klassic Never Minimalist Back-Print Edition', 30000, '240 GSM organic cotton featuring subtle rear back-collar branding and clean chest profile for versatile everyday layering.', '/images/media__1786369661997.jpg', 12),
  ('Klassic Dark Cat Royal Cobalt Tee', 35000, 'Electric royal cobalt blue heavyweight tee with luminescence dark cat silhouette insignia and arched serif lettering.', '/images/media__1786369606088.jpg', 15),
  ('Klassic Mindset Boxy Back-Graphic Tee', 40000, '280 GSM silk-cotton blend highlighting the bold high-contrast rear boxed statement typography for maximum visual impact.', '/images/media__1786370258071_3.jpg', 8),
  ('Klassic Whatever Relaxed Azure Edition', 30000, 'Airy azure blue heavyweight tee with white brush-stroke texture and relaxed neck ribbing for effortless styling.', '/images/media__1786369626673.jpg', 14),
  ('Klassic Sukuna Manga Contrast Tee', 35000, 'Crisp optic white tee showcasing precision black-ink anime character illustration with reinforced shoulder taping.', '/images/media__1786369649479.jpg', 11),
  ('Klassic Life Is Short Silk-Lustre Tee', 40000, '300 GSM silk-blend mercerized luxury white tee. Features clean typographic clock insignia and smooth satin drape.', '/images/media__1786370258071.jpg', 7),
  ('Klassic Dark Burgundy Velour-Touch Tee', 30000, 'Rich wine silhouette featuring brushed velvet-like hand feel and arched dark typography. Exceptional wash durability.', '/images/media__1786370258071_1.jpg', 10),
  ('Klassic Mindset Heavy Ribbed Knit Tee', 35000, 'Substantial 260 GSM vintage washed tee with custom high-density double ribbed collar and orange block text.', '/images/media__1786370258071_2.jpg', 9),
  ('Klassic Never Royal Drop-Shoulder Tee', 40000, '300 GSM executive archive edition. Dense interlock weave, deep obsidian black dye, and pristine drop-shoulder cut.', '/images/media__1786369656046.jpg', 5)
ON CONFLICT DO NOTHING;


