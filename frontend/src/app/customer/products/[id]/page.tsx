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
import { useCart } from "@/context/CartContext";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { addItem } = useCart();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  
  // UI-only quantity selector
  const [quantity, setQuantity] = React.useState(1);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

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

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await addItem({ product_id: product.id, quantity });
      setActionSuccess("Product added to cart.");
      // Reset quantity
      setQuantity(1);
    } catch (err: any) {
      setActionError(err.message || "Failed to add product to cart.");
    } finally {
      setIsAddingToCart(false);
    }
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
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="p-0 h-auto hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
            <p className="text-slate-500 mb-6">
              The product you are looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/customer/products')}>
              Browse Products
            </Button>
          </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  // Parse category mapping
  let categoryName = "Uncategorized";
  if (product.category) {
    if (typeof product.category === 'object' && product.category.name) {
      categoryName = product.category.name;
    } else {
      const cat = categories.find(c => c.id === product.category);
      if (cat) categoryName = cat.name;
    }
  }

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="p-0 h-auto hover:bg-transparent text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        {/* Global Action Messages */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 text-green-800">
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{actionSuccess}</p>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{actionError}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          
          {/* Image Section */}
          <div className="relative aspect-square w-full bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-8 shadow-sm overflow-hidden">
            {product.image ? (
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                className="object-contain p-8 mix-blend-multiply"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <PackageX className="h-20 w-20 mb-4 opacity-50" />
                <span className="text-sm font-medium uppercase tracking-wider">No Image Available</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <Badge variant="error" className="px-4 py-2 text-lg font-bold shadow-sm">
                  OUT OF STOCK
                </Badge>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col h-full">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                  {categoryName}
                </span>
                {product.is_active ? (
                  <Badge variant="success" className="bg-green-100 text-green-800 border-0">Active</Badge>
                ) : (
                  <Badge variant="warning">Inactive</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">₹{product.price}</span>
              </div>
            </div>

            <div className="prose prose-slate prose-sm text-slate-600 mb-8 max-w-none">
              <p>{product.description || "No description provided for this product."}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Barcode className="h-5 w-5" />
                <span className="font-mono text-sm font-medium">{product.barcode}</span>
              </div>
              <div className="text-sm font-medium">
                <span className="text-slate-500 mr-2">Stock:</span>
                <span className={isOutOfStock ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {product.stock_quantity} available
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    disabled={quantity <= 1 || isOutOfStock || isAddingToCart}
                    onClick={handleDecrease}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="w-16 text-center font-bold text-lg text-slate-900">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    disabled={quantity >= product.stock_quantity || isOutOfStock || isAddingToCart}
                    onClick={handleIncrease}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <Button 
                  className="w-full sm:flex-1 h-14 text-lg font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                  disabled={isOutOfStock || isAddingToCart}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAddingToCart ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
              
              {actionSuccess && (
                <Link href="/customer/cart" className="block w-full">
                  <Button 
                    variant="primary"
                    className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm mt-4"
                  >
                    View Cart
                  </Button>
                </Link>
              )}
              
              {isOutOfStock && (
                <p className="text-sm text-red-600 text-center font-medium mt-4">
                  This product is currently out of stock and cannot be added to your cart.
                </p>
              )}
            </div>
          </div>

        </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
