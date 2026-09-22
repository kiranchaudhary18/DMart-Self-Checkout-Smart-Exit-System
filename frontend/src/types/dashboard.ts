// types/dashboard.ts

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  stock_quantity: number;
  category?: any;
  image?: string;
}

export interface CartItem {
  id: number;
  product: number; // ID of the product
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: string;
  item_total: string;
}

export interface CartSummary {
  id: number;
  status: string;
  items: CartItem[];
  subtotal: string;
  total_item_count: number;
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer: number;
  status: "PENDING" | "PAID" | "VERIFIED" | "CANCELLED";
  total_amount: number;
  items: OrderItem[];
  created_at: string;
}

export interface LoyaltyBalance {
  points: number;
  tier: string;
}
