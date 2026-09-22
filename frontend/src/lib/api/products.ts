import { apiClient } from "./client";
import { Product, Category, ProductFilterParams, ProductPagination } from "@/types/product";

export const productsService = {
  /**
   * Fetch a list of products with optional filters.
   * Maps to GET /api/products/
   */
  async getProducts(filters: ProductFilterParams = {}): Promise<ProductPagination> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append("search", filters.search);
    if (filters.category) params.append("category", filters.category);
    if (filters.min_price) params.append("min_price", filters.min_price);
    if (filters.max_price) params.append("max_price", filters.max_price);
    if (filters.in_stock) params.append("in_stock", "true");
    if (filters.ordering) params.append("ordering", filters.ordering);
    if (filters.page) params.append("page", filters.page.toString());

    const queryString = params.toString();
    const url = queryString ? `/products/?${queryString}` : "/products/";
    
    const response = await apiClient.get<ProductPagination | Product[]>(url);
    
    // DRF generic list views sometimes return { count, next, previous, results: [] }
    // If it's paginated:
    if (response.data && 'results' in response.data) {
      return response.data as ProductPagination;
    }
    
    // If it's not paginated (array returned directly)
    return {
      count: (response.data as Product[]).length,
      next: null,
      previous: null,
      results: Array.isArray(response.data) ? response.data : [],
    };
  },

  /**
   * Fetch a single product by ID.
   * Maps to GET /api/products/{id}/
   */
  async getProductById(id: number | string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}/`);
    return response.data;
  },

  /**
   * Fetch a list of active categories.
   * Maps to GET /api/products/categories/
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[] | { results: Category[] }>("/products/categories/");
    
    if (response.data && 'results' in response.data) {
      return (response.data as any).results;
    }
    return Array.isArray(response.data) ? response.data : [];
  }
};
