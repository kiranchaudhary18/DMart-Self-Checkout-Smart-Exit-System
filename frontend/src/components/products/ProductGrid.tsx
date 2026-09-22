import * as React from "react";
import { Product, Category } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onClearFilters?: () => void;
}

export function ProductGrid({ products, categories, onClearFilters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <PackageSearch className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-500 max-w-sm mb-6 text-sm">
          We couldn't find any products matching your current filters. Try adjusting your search criteria.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} className="text-primary-600 border-primary-200 hover:bg-primary-50">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          categories={categories} 
        />
      ))}
    </div>
  );
}
