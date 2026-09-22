"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartSummaryProps {
  totalItems: number;
  subtotal: number;
}

export function CartSummary({ totalItems, subtotal }: CartSummaryProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-24">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Items ({totalItems})</span>
          <span className="font-medium text-slate-900">₹{subtotal}</span>
        </div>
        
        {/* Placeholder for future taxes/discounts */}
        <div className="flex justify-between text-slate-400">
          <span>Taxes & Fees</span>
          <span>Calculated at checkout</span>
        </div>
        
        <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-900">Subtotal</span>
          <span className="text-xl font-bold text-primary-700">₹{subtotal}</span>
        </div>
      </div>

      <Button 
        className="w-full mt-6 h-12 text-base font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
        onClick={() => router.push("/customer/checkout")}
      >
        Proceed to Checkout
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Secure checkout provided by DMart</span>
      </div>
    </div>
  );
}
