export interface CheckoutPricingItem {
  item_id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  barcode: string;
  quantity: number;
  unit_price: string;
  item_subtotal: string;
  gst_percentage: string;
  item_discount: string;
  item_taxable: string;
  item_gst: string;
  item_final: string;
}

export interface CouponData {
  code: string;
  discount_type: string;
}

export interface CheckoutSummary {
  items: CheckoutPricingItem[];
  coupon: CouponData | null;
  subtotal: string;
  discount: string;
  taxable_amount: string;
  gst: string;
  final_total: string;
}

export interface ApplyCouponRequest {
  code: string;
}
