-- database_setup.sql
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create or update the 'products' table
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  category text NOT NULL DEFAULT 'T-Shirts',
  description text,
  image_url text,
  stock integer DEFAULT 10,
  gsm text,
  material text,
  fit text,
  sizes jsonb DEFAULT '["S","M","L","XL","XXL"]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist if the table was created previously
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text DEFAULT 'T-Shirts';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gsm text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes jsonb DEFAULT '["S","M","L","XL","XXL"]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- Enable Row Level Security (RLS) on 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from 'products' (so customers can see the store)
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Allow authenticated users / service role / admin to manage products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" 
ON public.products FOR INSERT 
TO authenticated, service_role, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" 
ON public.products FOR UPDATE 
TO authenticated, service_role, anon
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" 
ON public.products FOR DELETE 
TO authenticated, service_role, anon
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

-- Ensure required columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending Transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'Processing';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Enable Row Level Security (RLS) on 'orders'
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert for orders" ON public.orders;
CREATE POLICY "Allow public insert for orders" 
ON public.orders FOR INSERT 
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for orders" ON public.orders;
CREATE POLICY "Allow select for orders" 
ON public.orders FOR SELECT 
TO public
USING (true);

DROP POLICY IF EXISTS "Allow update for orders" ON public.orders;
CREATE POLICY "Allow update for orders" 
ON public.orders FOR UPDATE 
TO public
USING (true);


-- 3. Stock Decrement RPC Function
CREATE OR REPLACE FUNCTION decrement_stock(p_id text, qty int)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, COALESCE(stock, 10) - qty)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;


-- 4. Set up Storage Bucket for 'products' (Supabase Backend Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'products' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Public and Auth Upload" ON storage.objects;
CREATE POLICY "Public and Auth Upload" 
ON storage.objects FOR INSERT 
TO authenticated, service_role, anon
WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Public and Auth Update" ON storage.objects;
CREATE POLICY "Public and Auth Update" 
ON storage.objects FOR UPDATE 
TO authenticated, service_role, anon
USING (bucket_id = 'products');


-- 5. Seed Real Klassic Wardrobe Catalog (Categorized by Product Type)
INSERT INTO public.products (id, name, price, category, description, image_url, stock, gsm, material, fit)
VALUES 
  -- T-Shirts
  ('kwt-01', 'Klassic Wonderland Textured Crochet Shirt', 35000, 'T-Shirts', 'Crafted from textured pointelle crochet cotton knit with custom vintage script and baroque cross insignia. Features camp collar and luxury openwork weave drape.', '/images/wonderland-shirt-front.jpg', 15, '260 GSM Textured Knit', '100% Textured Pointelle Cotton', 'Relaxed Camp-Collar Fit'),
  ('kwt-02', 'Klassic Mindset Over Everything Heavyweight Tee', 35000, 'T-Shirts', '260 GSM dense organic cotton featuring high-contrast orange and white "MINDSET OVER EVERYTHING" box typography.', '/images/media__1786370258071_2.jpg', 12, '260 GSM Vintage Wash', 'Custom Washed Heavy Cotton', 'Boxy Streetwear Fit'),
  ('kwt-03', 'Klassic Dark Cat Silhouette Heavyweight Tee', 40000, 'T-Shirts', '280 GSM luxury combed cotton with arched "DARK" typography and luminous cat silhouette graphic.', '/images/media__1786369606088.jpg', 10, '280 GSM Silk-Cotton Blend', '80% Organic Cotton, 20% Mulberry Silk', 'Tailored Drop-Shoulder'),
  ('kwt-04', 'Klassic Whatever Brush-Stroke Sky Blue Tee', 30000, 'T-Shirts', 'Minimalist streetwear graphic tee in Sky Blue with distinctive white brush-stroke overlay and bold typography.', '/images/media__1786369626673.jpg', 18, '240 GSM Heavyweight', '100% Combed Organic Cotton', 'Oversized Drop-Shoulder'),
  ('kwt-05', 'Klassic Sukuna Graphic Heavyweight Tee', 35000, 'T-Shirts', '260 GSM heavyweight cotton tee in pure white with high-definition anime character illustration and reinforced neckline.', '/images/media__1786369649479.jpg', 14, '260 GSM Heavyweight', '100% Combed Organic Cotton', 'Boxy Drop-Shoulder'),
  ('kwt-06', 'Klassic Life Is Short Minimalist Clock Tee', 40000, 'T-Shirts', '300 GSM luxury structured white tee with modern minimalist geometric clock motif: "Life is short. LIVE IT".', '/images/media__1786370258071.jpg', 8, '300 GSM Ultra-Heavyweight', 'Mercerized Organic Cotton', 'Structured Relaxed Fit'),
  ('kwt-07', 'Klassic Dark Cat Silhouette Wine Edition', 30000, 'T-Shirts', 'Deep burgundy/wine heavyweight cotton tee with signature arched "DARK" insignia and eye graphic. Double-layered collar.', '/images/media__1786370258071_1.jpg', 10, '240 GSM Heavyweight', '100% Combed Organic Cotton', 'Oversized Drop-Shoulder'),
  ('kwt-08', 'Klassic Mindset Noir Signature Edition', 35000, 'T-Shirts', 'Garment-dyed for a premium streetwear finish. Features "MINDSET OVER EVERYTHING" insignia and durable double-stitched hem.', '/images/media__1786370258071_2.jpg', 10, '260 GSM Vintage Wash', 'Custom Washed Heavy Cotton', 'Boxy Streetwear Fit'),
  ('kwt-09', 'Klassic Never Noir Executive Edition', 40000, 'T-Shirts', '300 GSM ultra-heavyweight combed cotton with "NEVER" minimalist insignia and tailored drape. Maximum durability.', '/images/media__1786369656046.jpg', 6, '300 GSM Executive Interlock', '85% Long-Staple Cotton, 15% Silk', 'Executive Tailored Fit'),
  ('kwt-10', 'Klassic Never Minimalist Back-Print Edition', 30000, 'T-Shirts', '240 GSM organic cotton featuring subtle rear back-collar branding and clean chest profile for versatile everyday layering.', '/images/media__1786369661997.jpg', 12, '240 GSM Heavyweight', '100% Combed Organic Cotton', 'Oversized Drop-Shoulder'),
  ('kwt-11', 'Klassic Dark Cat Royal Cobalt Tee', 35000, 'T-Shirts', 'Electric royal cobalt blue heavyweight tee with luminescence dark cat silhouette insignia and arched serif lettering.', '/images/media__1786369606088.jpg', 15, '260 GSM Heavyweight', '100% Combed Organic Cotton', 'Boxy Drop-Shoulder'),
  ('kwt-12', 'Klassic Mindset Boxy Back-Graphic Tee', 40000, 'T-Shirts', '280 GSM silk-cotton blend highlighting the bold high-contrast rear boxed statement typography for maximum visual impact.', '/images/media__1786370258071_3.jpg', 8, '280 GSM Silk-Cotton Blend', '80% Organic Cotton, 20% Mulberry Silk', 'Tailored Drop-Shoulder'),
  ('kwt-13', 'Klassic Whatever Relaxed Azure Edition', 30000, 'T-Shirts', 'Airy azure blue heavyweight tee with white brush-stroke texture and relaxed neck ribbing for effortless styling.', '/images/media__1786369626673.jpg', 14, '240 GSM Heavyweight', '100% Combed Organic Cotton', 'Relaxed Streetwear Drape'),
  ('kwt-14', 'Klassic Sukuna Manga Contrast Tee', 35000, 'T-Shirts', 'Crisp optic white tee showcasing precision black-ink anime character illustration with reinforced shoulder taping.', '/images/media__1786369649479.jpg', 11, '260 GSM Heavyweight', '100% Combed Organic Cotton', 'Boxy Drop-Shoulder'),
  ('kwt-15', 'Klassic Life Is Short Silk-Lustre Tee', 40000, 'T-Shirts', '300 GSM silk-blend mercerized luxury white tee. Features clean typographic clock insignia and smooth satin drape.', '/images/media__1786370258071.jpg', 7, '300 GSM Ultra-Heavyweight', 'Silk Mercerized Blend', 'Executive Tailored Fit'),
  ('kwt-16', 'Klassic Dark Burgundy Velour-Touch Tee', 30000, 'T-Shirts', 'Rich wine silhouette featuring brushed velvet-like hand feel and arched dark typography. Exceptional wash durability.', '/images/media__1786370258071_1.jpg', 10, '240 GSM Heavyweight', 'Brushed Velvet Cotton', 'Oversized Drop-Shoulder'),
  ('kwt-17', 'Klassic Mindset Heavy Ribbed Knit Tee', 35000, 'T-Shirts', 'Substantial 260 GSM vintage washed tee with custom high-density double ribbed collar and orange block text.', '/images/media__1786370258071_2.jpg', 9, '260 GSM Vintage Wash', 'Custom Washed Heavy Cotton', 'Boxy Streetwear Fit'),
  ('kwt-18', 'Klassic Never Royal Drop-Shoulder Tee', 40000, 'T-Shirts', '300 GSM executive archive edition. Dense interlock weave, deep obsidian black dye, and pristine drop-shoulder cut.', '/images/media__1786369656046.jpg', 5, '300 GSM Executive Interlock', '85% Long-Staple Cotton, 15% Silk', 'Executive Tailored Fit'),
  
  -- Jeans
  ('kwt-jeans-01', 'Klassic Raw Indigo Selvedge Denim Jeans', 65000, 'Jeans', 'Crafted from 14.5oz shuttle-loom Japanese selvedge denim. Features a relaxed straight-leg drape, custom antique brass hardware, red-line selvedge ID cuff, and deep indigo dye designed to develop unique patina fades.', '/images/jeans-raw-indigo.jpg', 12, '14.5oz Heavyweight Denim', '100% Shuttle-Loom Selvedge Cotton', 'Relaxed Straight Leg'),
  ('kwt-jeans-02', 'Klassic Washed Obsidian Black Denim Jeans', 60000, 'Jeans', '13.5oz vintage washed black denim featuring subtle whiskering, tailored loose fit, and reinforced double-needle chainstitching. Finished with signature embossed leather back patch.', '/images/jeans-washed-black.jpg', 14, '13.5oz Vintage Wash Denim', '100% Ringspun Cotton Denim', 'Modern Loose Straight'),

  -- Short Jeans
  ('kwt-short-01', 'Klassic Vintage Heavyweight Denim Jorts', 45000, 'Short Jeans', '13oz heavyweight vintage washed denim shorts with signature raw frayed hem, relaxed baggy streetwear silhouette, deep five-pocket styling, and durable brass rivet accents.', '/images/short-jeans-jorts.jpg', 16, '13oz Heavyweight Denim', '100% Vintage Washed Cotton', 'Baggy Knee-Length Jorts'),

  -- Beach Pants
  ('kwt-beach-01', 'Klassic Pure Linen Drawstring Beach Pants', 50000, 'Beach Pants', 'Tailored from 240 GSM pure European flax linen. Features an elasticated waistband with natural braided cotton drawstrings, breathable flowy wide-leg drape, and deep side slant pockets for effortless coastal luxury.', '/images/beach-pants-linen.jpg', 18, '240 GSM Pure Flax Linen', '100% Breathable European Linen', 'Relaxed Wide-Leg Flow')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock,
  gsm = EXCLUDED.gsm,
  material = EXCLUDED.material,
  fit = EXCLUDED.fit;



