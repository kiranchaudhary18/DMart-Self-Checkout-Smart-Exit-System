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
  category: number | Category;
  image?: string | null;
  is_active: boolean;
}

export interface ProductPagination {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: boolean;
  ordering?: string;
  page?: number;
}
