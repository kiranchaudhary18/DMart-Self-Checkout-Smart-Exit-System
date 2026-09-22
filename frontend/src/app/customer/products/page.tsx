"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { ProductSearch } from "@/components/products/ProductSearch";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/products/ProductSkeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Filter } from "lucide-react";
import { productsService } from "@/lib/api/products";
import { Product, Category, ProductFilterParams as FilterState } from "@/types/product";

// Simple hook for debouncing values (like search input)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductsPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [hasPrevPage, setHasPrevPage] = React.useState(false);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [filters, setFilters] = React.useState<FilterState>({ page: 1 });

  // 1. Fetch categories once on mount
  React.useEffect(() => {
    let mounted = true;
    const fetchCats = async () => {
      try {
        const data = await productsService.getCategories();
        if (mounted) setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCats();
    return () => { mounted = false; };
  }, []);

  // 2. Fetch products whenever relevant filters or debounced search changes
  React.useEffect(() => {
    let mounted = true;
    const fetchProds = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const activeFilters: FilterState = { ...filters };
        if (debouncedSearchTerm) {
          activeFilters.search = debouncedSearchTerm;
        }
        const data = await productsService.getProducts(activeFilters);
        if (mounted) {
          setProducts(data.results);
          setHasNextPage(!!data.next);
          setHasPrevPage(!!data.previous);
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchProds();
    return () => { mounted = false; };
  }, [debouncedSearchTerm, filters]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({});
  };

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-2 text-slate-500">Browse products and add items to your shopping cart.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              className="w-full text-slate-600 bg-white" 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Left Sidebar: Filters */}
          <div className={`lg:w-64 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
              <ProductFilters 
                categories={categories}
                filters={filters}
                onChange={setFilters}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            
            {/* Search Bar */}
            <ProductSearch 
              value={searchTerm}
              onChange={setSearchTerm}
            />

            {/* Product Grid / States */}
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-red-100 rounded-xl bg-red-50">
                <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to load products.</h3>
                <p className="text-sm text-red-600 mb-6">There was a network error communicating with the server.</p>
                <Button onClick={() => setFilters({...filters})} className="bg-red-600 hover:bg-red-700">
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <>
                <ProductGrid 
                  products={products} 
                  categories={categories} 
                  onClearFilters={handleClearFilters}
                />
                
                {/* Pagination Controls */}
                {products.length > 0 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                    <Button
                      variant="outline"
                      disabled={!hasPrevPage}
                      onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                      className="text-slate-600"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-500 font-medium">
                      Page {filters.page || 1}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!hasNextPage}
                      onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                      className="text-slate-600"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
            
          </div>
        </div>

      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
