import * as React from "react";
import { Product, Category } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onClearFilters?: () => void;
}

export function ProductGrid({ products, categories, onClearFilters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="We couldn't find any products matching your current filters. Try adjusting your search criteria."
        actionLabel={onClearFilters ? "Clear Filters" : undefined}
        onAction={onClearFilters}
        className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50"
      />
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
