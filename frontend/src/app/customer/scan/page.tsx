"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { ManualBarcodeEntry } from "@/components/scanner/ManualBarcodeEntry";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, PackageX, Search, AlertCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productsService } from "@/lib/api/products";
import { Product } from "@/types/product";
import Image from "next/image";

import { useCart } from "@/context/CartContext";

export default function ScanPage() {
  const router = useRouter();
  const { addItemByBarcode } = useCart();
  
  const [showScanner, setShowScanner] = useState(true);
  
  // Lookup states
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleScan = async (barcode: string) => {
    // Stop the scanner immediately upon receiving a scan
    setShowScanner(false);
    setIsLookingUp(true);
    setScannedBarcode(barcode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProduct(null);
    
    try {
      const foundProduct = await productsService.getProductByBarcode(barcode);
      setProduct(foundProduct);
    } catch (err: any) {
      if (err.code === '404') {
        setErrorMsg("We couldn't find a product with this barcode.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred while looking up this product.");
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleManualEntryRequested = () => {
    setShowScanner(false);
  };

  const handleReset = () => {
    setScannedBarcode(null);
    setProduct(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowScanner(true);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAddingToCart(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await addItemByBarcode({ barcode: product.barcode, quantity: 1 });
      setSuccessMsg("Product added to cart.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add product to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const renderProductSuccess = () => {
    if (!product) return null;
    
    const isOutOfStock = product.stock_quantity <= 0;
    
    const categoryName = typeof product.category === 'object' && product.category?.name 
      ? product.category.name 
      : "Uncategorized";

    return (
      <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="relative aspect-square w-48 bg-slate-50 rounded-xl mb-6 flex items-center justify-center p-4 border border-slate-100">
            {product.image ? (
              <Image 
                src={product.image} 
                alt={product.name} 
                fill
                className="object-contain p-4 mix-blend-multiply"
                sizes="192px"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <PackageX className="h-12 w-12 mb-2" />
                <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
              </div>
            )}
            
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                <Badge variant="error" className="px-3 py-1.5 text-sm font-bold shadow-sm">
                  OUT OF STOCK
                </Badge>
              </div>
            )}
          </div>
          
          <div className="mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{categoryName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">
            {product.name}
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-black text-slate-900">₹{product.price}</span>
          </div>
          
          <p className="text-sm text-slate-500 mb-6 font-mono bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
            Barcode: {product.barcode}
          </p>
          
          <div className="flex flex-col w-full gap-3">
            <Button 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white h-12 text-base shadow-sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
            
            {successMsg && (
              <Link href="/customer/cart" className="w-full">
                <Button 
                  variant="primary"
                  className="w-full h-12 text-base bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                >
                  View Cart
                </Button>
              </Link>
            )}
            
            <div className="flex gap-3 mt-2">
              <Button 
                variant="outline"
                className="flex-1 h-12 text-sm bg-white font-medium"
                onClick={handleReset} 
              >
                Continue Scanning
              </Button>
              <Link href={`/customer/products/${product.id}`} className="flex-1">
                <Button 
                  variant="outline"
                  className="w-full h-12 text-sm bg-white font-medium"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotFound = () => {
    return (
      <div className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in fade-in duration-300">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-600 mb-6">{errorMsg}</p>
        
        {scannedBarcode && (
           <p className="text-sm text-slate-500 mb-8 font-mono bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block">
             Scanned: {scannedBarcode}
           </p>
        )}
        
        <div className="flex flex-col sm:flex-row w-full gap-3 justify-center mt-2">
          <Button 
            onClick={handleReset} 
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white h-11 px-8"
          >
            Scan Again
          </Button>
          <Button 
            variant="outline"
            onClick={handleManualEntryRequested} 
            className="w-full sm:w-auto h-11 px-8"
          >
            Enter Barcode Manually
          </Button>
        </div>
      </div>
    );
  };

  const renderLoading = () => {
    return (
      <div className="w-full bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative h-16 w-16 mb-6">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Looking up product...</h2>
        <p className="text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-md">{scannedBarcode}</p>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                href="/customer/dashboard"
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scan Product</h1>
            </div>
            <p className="text-sm text-slate-500">
              Scan the barcode on a product to add it to your shopping experience.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-xl mx-auto w-full flex flex-col items-center">
          
          {isLookingUp ? (
            renderLoading()
          ) : product ? (
            renderProductSuccess()
          ) : errorMsg ? (
            renderNotFound()
          ) : showScanner ? (
            <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-full">
                <BarcodeScanner 
                  onScan={handleScan} 
                  onManualEntryRequested={handleManualEntryRequested}
                />
                <p className="text-center text-sm text-slate-500 mt-6 font-medium">
                  Point your camera at the product barcode
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-full min-h-[300px] flex flex-col justify-center">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Manual Entry</h3>
                  <p className="text-sm text-slate-500 mt-1">If the barcode won't scan, type it here.</p>
                </div>
                
                <ManualBarcodeEntry onSearch={handleScan} />
                
                <div className="mt-10 text-center">
                  <Button 
                    variant="ghost" 
                    onClick={handleReset}
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  >
                    Return to Camera Scanner
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Manual Entry Fallback (always visible below scanner if scanning is active) */}
          {showScanner && !isLookingUp && !product && !errorMsg && (
            <div className="w-full mt-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <ManualBarcodeEntry onSearch={handleScan} />
            </div>
          )}

        </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
