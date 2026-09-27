"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { CartList } from "@/components/cart/CartList";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { handleApiError } from "@/lib/utils/errorHandler";
import { ErrorState } from "@/components/shared/ErrorState";

export default function CartPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const { cart, isLoading, error, fetchCart, updateItemQuantity, removeItem, clearCart } = useCart();
  const { success, error: toastError, info } = useToast();
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    setUpdatingItemId(id);
    try {
      await updateItemQuantity(id, quantity);
    } catch (err: any) {
      toastError(handleApiError(err), "Update Failed");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (id: number) => {
    if (!window.confirm("Remove this product from your cart?")) return;
    
    setUpdatingItemId(id);
    try {
      await removeItem(id);
      info("Product removed from cart");
    } catch (err: any) {
      toastError(handleApiError(err), "Remove Failed");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;
    
    setIsClearing(true);
    try {
      await clearCart();
      success("Cart has been cleared");
    } catch (err: any) {
      toastError(handleApiError(err), "Clear Failed");
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary-100 text-primary-700 rounded-xl">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
              <p className="text-sm text-slate-500 mt-1">Review the products you've selected before checkout.</p>
            </div>
          </div>
          <CartSkeleton />
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <ErrorState 
            title="Unable to load your cart"
            message={error || "There was a problem communicating with our servers. Please try again."}
            onRetry={fetchCart}
          />
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  const items = cart?.items || [];
  
  // Use authoritative totals from backend API
  const totalItems = cart?.total_item_count || 0;
  const subtotal = cart?.subtotal ? parseFloat(cart.subtotal) : 0;

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 text-primary-700 rounded-xl">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
              <p className="text-sm text-slate-500 mt-1">Review the products you've selected before checkout.</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
              onClick={handleClearCart}
              disabled={isClearing}
            >
              {isClearing ? "Clearing..." : "Clear Cart"}
            </Button>
          )}
        </div>



        {/* Content */}
        {authIsLoading || isLoading ? (
          <CartSkeleton />
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
            <div className="lg:col-span-8">
              <CartList 
                items={items}
                updatingItemId={updatingItemId}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            </div>
            
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <CartSummary 
                totalItems={totalItems}
                subtotal={subtotal}
              />
            </div>
          </div>
        )}
        
      </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}


