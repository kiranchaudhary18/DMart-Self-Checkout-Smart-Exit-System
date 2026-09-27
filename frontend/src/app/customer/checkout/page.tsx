"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { checkoutService } from "@/lib/api/checkout";
import { CheckoutSummary } from "@/types/checkout";
import { CheckoutSkeleton } from "@/components/checkout/CheckoutSkeleton";
import { OrderItemsList } from "@/components/checkout/OrderItemsList";
import { CouponSection } from "@/components/checkout/CouponSection";
import { PriceSummary } from "@/components/checkout/PriceSummary";
import { ShieldCheck, AlertCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCouponActionLoading, setIsCouponActionLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await checkoutService.getCheckoutSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load checkout summary:", err);
      const msg = err.response?.data?.message || "Unable to load checkout details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleApplyCoupon = async (code: string) => {
    setIsCouponActionLoading(true);
    try {
      await checkoutService.applyCoupon({ code });
      await fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to apply coupon.";
      throw new Error(msg);
    } finally {
      setIsCouponActionLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsCouponActionLoading(true);
    try {
      await checkoutService.removeCoupon();
      await fetchSummary();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to remove coupon.";
      throw new Error(msg);
    } finally {
      setIsCouponActionLoading(false);
    }
  };

  const handleContinueToPayment = async () => {
    setIsContinuing(true);
    setPaymentError(null);
    try {
      const response = await checkoutService.createOrder();
      const orderNumber = response.data.order_number;
      // Navigate to future payment flow (Phase 8 placeholder)
      router.push(`/customer/payment/${orderNumber}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "An error occurred during checkout validation.";
      setPaymentError(msg);
      // Re-fetch summary to show stale state if any items were removed or prices changed
      await fetchSummary();
    } finally {
      setIsContinuing(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
            <p className="text-slate-500 mt-2">Preparing your order summary...</p>
          </div>
          <CheckoutSkeleton />
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-red-50 text-red-600 rounded-full mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Checkout Error</h2>
          <p className="text-slate-500 mb-6 max-w-sm">
            {error}
          </p>
          <div className="flex gap-4">
            <Link href="/customer/cart">
              <Button variant="outline">Return to Cart</Button>
            </Link>
            <Button onClick={fetchSummary}>Try Again</Button>
          </div>
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center text-center">
          <div className="p-6 bg-slate-100 text-slate-400 rounded-full mb-6">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Your cart is empty.</h2>
          <p className="text-slate-500 mb-8 max-w-md">
            You don't have any items to checkout. Add some items to your cart to proceed.
          </p>
          <Link href="/customer/dashboard">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white h-12 px-8">
              Back to Products
            </Button>
          </Link>
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Link href="/customer/cart" className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              Checkout
            </h1>
            <p className="text-slate-500 mt-2 ml-9">Review your order before payment.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 px-4 py-2 rounded-full w-fit">
            <ShieldCheck className="h-5 w-5" />
            100% Secure Checkout
          </div>
        </div>

        {/* Content */}
        {paymentError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Validation Error</p>
              <p className="text-sm">{paymentError}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          
          <div className="lg:col-span-8">
            <OrderItemsList items={summary.items} />
          </div>
          
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <CouponSection 
              coupon={summary.coupon} 
              onApply={handleApplyCoupon} 
              onRemove={handleRemoveCoupon} 
              isLoading={isCouponActionLoading}
            />
            
            <PriceSummary 
              summary={summary}
              onContinue={handleContinueToPayment}
              isContinuing={isContinuing}
            />
          </div>
          
        </div>
        
      </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
