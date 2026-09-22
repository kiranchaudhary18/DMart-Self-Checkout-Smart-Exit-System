"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsService } from "@/lib/api/products";
import { Product, Category } from "@/types/product";
import { 
  ArrowLeft, 
  ShoppingCart, 
  PackageX, 
  Barcode, 
  AlertCircle,
  Minus,
  Plus
} from "lucide-react";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  
  // UI-only quantity selector
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchProductData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(false);
      
      try {
        const [prodData, catsData] = await Promise.all([
          productsService.getProductById(id),
          productsService.getCategories()
        ]);
        
        if (mounted) {
          setProduct(prodData);
          setCategories(catsData);
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    fetchProductData();
    return () => { mounted = false; };
  }, [id]);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    // Arbitrary limit for UI purposes, could be tied to stock
    const limit = product?.stock_quantity || 10;
    if (quantity < limit) setQuantity(quantity + 1);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-24 h-6 bg-slate-200 animate-pulse rounded"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            <div className="aspect-square bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="space-y-6">
              <div className="w-3/4 h-10 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-1/4 h-8 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-full h-32 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-1/2 h-12 bg-slate-200 animate-pulse rounded"></div>
            </div>
          </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
            <p className="text-slate-500 mb-8 max-w-sm">
              We couldn't load the details for this product. It may have been removed or is currently unavailable.
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>
          </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  const categoryId = typeof product.category === 'object' ? product.category?.id : product.category;
  const categoryName = categories.find(c => c.id === categoryId)?.name || "Uncategorized";
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 md:mb-8">
          <Link 
            href="/products"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Products
          </Link>
        </div>

        {/* Product Details Layout */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          
          {/* Left Column: Image */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center aspect-square relative p-8">
            {product.image ? (
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                className="object-contain p-8 mix-blend-multiply"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <PackageX className="h-24 w-24 mb-4" />
                <span className="text-sm font-medium uppercase tracking-wider">No Image Available</span>
              </div>
            )}
            
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <Badge variant="error" className="px-6 py-2 text-lg font-bold shadow-sm">
                  OUT OF STOCK
                </Badge>
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col justify-center space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                  {categoryName}
                </span>
                <div className="flex items-center text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100" title="Barcode">
                  <Barcode className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-mono">{product.barcode}</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-slate-900">₹{product.price}</span>
            </div>

            <p className="text-base text-slate-600 leading-relaxed">
              {product.description || "No description provided for this product."}
            </p>

            <div className="py-6 border-y border-slate-100 space-y-6">
              
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Availability:</span>
                {isOutOfStock ? (
                  <span className="text-sm font-bold text-red-500">Currently unavailable</span>
                ) : (
                  <span className="text-sm font-bold text-green-600">{product.stock_quantity} in stock</span>
                )}
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Quantity Selector (UI Only) */}
                <div className="flex items-center justify-between border border-slate-200 rounded-lg p-1 bg-white">
                  <button 
                    onClick={handleDecrease}
                    disabled={isOutOfStock || quantity <= 1}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-900 w-8 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button 
                    onClick={handleIncrease}
                    disabled={isOutOfStock || quantity >= (product.stock_quantity || 10)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart */}
                <Button 
                  className="sm:col-span-2 h-12 text-base font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
                
              </div>
            </div>
            
          </div>
        </div>

      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
