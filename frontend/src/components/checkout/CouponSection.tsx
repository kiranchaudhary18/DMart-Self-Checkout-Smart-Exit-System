"use client";

import React, { useState } from "react";
import { CouponData } from "@/types/checkout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Tag, X } from "lucide-react";

interface CouponSectionProps {
  coupon: CouponData | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  isLoading: boolean;
}

export function CouponSection({ coupon, onApply, onRemove, isLoading }: CouponSectionProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setError(null);
    try {
      await onApply(code.trim().toUpperCase());
      setCode("");
    } catch (err: any) {
      setError(err.message || "Failed to apply coupon.");
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await onRemove();
    } catch (err: any) {
      setError(err.message || "Failed to remove coupon.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Have a coupon?
      </h3>

      {coupon ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg gap-3">
          <div>
            <p className="text-sm font-semibold text-green-800">
              Coupon applied: <span className="uppercase">{coupon.code}</span>
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Discount applied to your order.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2 w-full sm:w-auto"
            onClick={handleRemove}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />}
            Remove
          </Button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-3">
          <div className="flex gap-2">
            <Input 
              placeholder="Enter coupon code" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              className="uppercase"
            />
            <Button 
              type="submit" 
              disabled={!code.trim() || isLoading}
              className="bg-slate-900 text-white hover:bg-slate-800 shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </form>
      )}
    </div>
  );
}
