// types/dashboard.ts

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  stock_quantity: number;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface CartSummary {
  id: number;
  customer: number;
  items: CartItem[];
  total_price: number;
  created_at: string;
  updated_at: string;
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
