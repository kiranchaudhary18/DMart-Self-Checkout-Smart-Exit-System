import React from "react";
import { CheckoutSummary } from "@/types/checkout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface PriceSummaryProps {
  summary: CheckoutSummary;
  onContinue: () => void;
  isContinuing?: boolean;
}

export function PriceSummary({ summary, onContinue, isContinuing }: PriceSummaryProps) {
  const hasDiscount = parseFloat(summary.discount) > 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 sticky top-24">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Price Details</h2>
      
      <div className="space-y-4 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between text-slate-600">
          <span>Subtotal ({summary.items.length} items)</span>
          <span className="font-medium text-slate-900">₹{summary.subtotal}</span>
        </div>
        
        {/* Discount */}
        {hasDiscount && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Coupon Discount</span>
            <span>-₹{summary.discount}</span>
          </div>
        )}
        
        {/* Taxable Amount (Optional - only show if discount exists to explain GST calculation) */}
        {hasDiscount && (
          <div className="flex justify-between text-slate-500 text-xs pt-2 border-t border-slate-100">
            <span>Taxable Amount</span>
            <span>₹{summary.taxable_amount}</span>
          </div>
        )}
        
        {/* GST */}
        <div className="flex justify-between text-slate-600">
          <span className="flex flex-col">
            <span>GST</span>
            <span className="text-[10px] text-slate-400">Included in item price</span>
          </span>
          <span className="font-medium text-slate-900">₹{summary.gst}</span>
        </div>
        
        {/* Total */}
        <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-center">
          <span className="text-base font-bold text-slate-900">Total Payable</span>
          <span className="text-2xl font-bold text-primary-700">₹{summary.final_total}</span>
        </div>
      </div>

      <p className="text-xs text-center text-slate-500 mt-6 mb-3">
        Please review your order details before continuing to payment.
      </p>

      <Button 
        className="w-full h-14 text-lg font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
        onClick={onContinue}
        disabled={isContinuing}
      >
        {isContinuing ? "Processing..." : "Continue to Payment"}
        {!isContinuing && <ArrowRight className="ml-2 h-5 w-5" />}
      </Button>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 py-3 rounded-lg border border-slate-100">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Safe & Secure Checkout</span>
      </div>
    </div>
  );
}
