"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyCart() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="bg-slate-50 p-6 rounded-full mb-6 border border-slate-100">
        <ShoppingCart className="h-12 w-12 text-slate-300" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
      <p className="text-slate-500 mb-8">
        Scan a product or browse products to start shopping.
      </p>

      <div className="flex flex-col sm:flex-row w-full gap-3">
        <Button 
          className="flex-1 h-12"
          onClick={() => router.push("/customer/scan")}
        >
          <ScanBarcode className="mr-2 h-5 w-5" />
          Scan Product
        </Button>
        
        <Button 
          variant="outline"
          className="flex-1 h-12 bg-white"
          onClick={() => router.push("/customer/products")}
        >
          <Search className="mr-2 h-5 w-5" />
          Browse Products
        </Button>
      </div>
    </div>
  );
}
