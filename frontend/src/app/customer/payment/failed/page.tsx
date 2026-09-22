"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { XCircle, ShoppingCart, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function FailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment verification is pending or could not be completed.";

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center">
        
        {/* Header */}
        <div className="bg-red-50 p-8">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
          <p className="text-slate-600 text-sm max-w-xs mx-auto">
            {reason}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-500 text-sm mb-8">
            Don't worry, your cart is still saved. You can try your payment again or modify your items.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/customer/checkout" className="w-full">
              <Button className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center justify-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try Payment Again
              </Button>
            </Link>
            
            <Link href="/customer/cart" className="w-full">
              <Button variant="outline" className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Return to Cart
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Suspense fallback={<div>Loading...</div>}>
          <FailedContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
