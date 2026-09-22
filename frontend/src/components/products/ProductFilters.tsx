import * as React from "react";
import { Category, ProductFilterParams as FilterState } from "@/types/product";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

export function ProductFilters({ categories, filters, onChange, className }: ProductFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-3">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 uppercase tracking-wide">Category</label>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start font-medium",
              !filters.category ? "bg-primary-50 text-primary-700 hover:bg-primary-100" : "text-slate-600 hover:bg-slate-100"
            )}
            onClick={() => updateFilter("category", undefined)}
          >
            All Products
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start font-medium",
                filters.category === cat.id.toString() 
                  ? "bg-primary-50 text-primary-700 hover:bg-primary-100" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => updateFilter("category", cat.id.toString())}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="block text-sm font-medium text-slate-700 uppercase tracking-wide">Sort By</label>
        <select 
          className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={filters.ordering || "name"} 
          onChange={(e) => updateFilter("ordering", e.target.value)}
        >
          <option value="name">Name (A-Z)</option>
          <option value="-name">Name (Z-A)</option>
          <option value="price">Price (Low to High)</option>
          <option value="-price">Price (High to Low)</option>
        </select>
      </div>

      {/* Availability */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label htmlFor="in-stock" className="text-sm font-medium text-slate-700 cursor-pointer">
            In Stock Only
          </label>
          <input
            type="checkbox"
            id="in-stock"
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
            checked={filters.in_stock || false}
            onChange={(e) => updateFilter("in_stock", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
