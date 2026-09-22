export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  barcode: string;
  stock_quantity: number;
  category: number | Category; // Depends on if it's nested or just ID. Usually just ID from DRF unless depth is set. We'll handle it flexibly.
  image?: string | null;
  is_active: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string; // category ID
  min_price?: string;
  max_price?: string;
  in_stock?: boolean;
  ordering?: string; // e.g., 'price', '-price', 'name', '-name'
}
