export interface Product {
  id: string;
  name: string;
  title?: string;
  price: number | string;
  description: string;
  stock?: number;
  image?: string;
  fallbackImage?: string;
  gallery?: string[];
  category?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  created_at?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  delivery_status?: string;
  total_amount: number;
  created_at: string;
  items: CartItem[];
  shipping_address: any;
}
