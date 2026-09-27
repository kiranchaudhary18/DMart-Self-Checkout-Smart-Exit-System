import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckoutPricingItem } from "@/types/checkout";
import { Button } from "@/components/ui/button";

interface OrderItemsListProps {
  items: CheckoutPricingItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
        <Link href="/customer/cart">
          <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
            Edit Cart
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.item_id} className="flex gap-4">
            <div className="h-20 w-20 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative">
              {item.product_image ? (
                <img 
                  src={item.product_image} 
                  alt={item.product_name}
                  className="w-full h-full object-contain p-1 mix-blend-multiply"
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 line-clamp-1">{item.product_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Barcode: {item.barcode}</p>
              </div>
              <div className="text-sm font-medium text-slate-600">
                Qty: {item.quantity}
              </div>
            </div>
            
            <div className="text-right flex flex-col justify-between">
              <p className="font-bold text-slate-900">₹{item.item_final}</p>
              <p className="text-xs text-slate-500">₹{item.unit_price} / ea</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
