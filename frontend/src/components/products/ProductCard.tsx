import * as React from "react";
import { Product, Category } from "@/types/product";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, PackageX, Barcode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  categories: Category[];
}

export function ProductCard({ product, categories }: ProductCardProps) {
  const categoryId = typeof product.category === 'object' ? product.category?.id : product.category;
  const categoryName = categories.find(c => c.id === categoryId)?.name || "Uncategorized";
  
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group bg-white">
      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4">
        {product.image ? (
          <Image 
            src={product.image} 
            alt={product.name} 
            fill
            className="object-contain p-4 mix-blend-multiply"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <PackageX className="h-16 w-16 mb-2" />
            <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="error" className="px-3 py-1 text-sm font-bold shadow-sm">
              OUT OF STOCK
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-0 flex-none">
        <div className="flex justify-between items-start gap-2 mb-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{categoryName}</span>
          <div className="flex items-center text-slate-400" title={`Barcode: ${product.barcode}`}>
            <Barcode className="h-3.5 w-3.5 mr-1" />
            <span className="text-[10px] font-mono">{product.barcode.slice(-6)}</span>
          </div>
        </div>
        <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
      </CardHeader>

      <CardContent className="p-4 flex-grow flex flex-col justify-end">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900">₹{product.price}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isOutOfStock ? (
            <span className="text-red-500 font-medium">Currently unavailable</span>
          ) : (
            <span className="text-green-600 font-medium">{product.stock_quantity} in stock</span>
          )}
        </p>
      </CardContent>

      <div className="flex p-4 pt-0 gap-2">
        <Link 
          href={`/products/${product.id}`}
          className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 text-slate-600 hover:text-primary-700 hover:bg-primary-50 h-10 px-4 py-2"
        >
          <Eye className="h-4 w-4 mr-2" />
          Details
        </Link>
        <Button 
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"  
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </Card>
  );
}
