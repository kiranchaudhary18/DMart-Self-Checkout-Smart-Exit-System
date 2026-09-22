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
  product: number;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: string;
  gst_percentage: string;
  discount_amount: string;
  taxable_amount: string;
  gst_amount: string;
  total_amount: string;
}

export interface Receipt {
  id: number;
  receipt_number: string;
  generated_at: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: "PENDING" | "PAID" | "VERIFIED" | "CANCELLED";
  payment_status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  subtotal: string;
  discount_amount: string;
  taxable_amount: string;
  gst_amount: string;
  total_amount: string;
  coupon_code: string | null;
  created_at: string;
  receipt: Receipt | null;
  items?: OrderItem[]; // Present in detail view
}

export interface LoyaltyBalance {
  points: number;
  tier: string;
}
