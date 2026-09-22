"use client";

import React from "react";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "@/types/dashboard";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  isUpdating?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, isUpdating = false }: CartItemProps) {
  const { product_name, barcode, quantity, unit_price, item_total } = item;

  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-opacity ${isUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Product Placeholder Image since API doesn't return one directly yet */}
      <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center justify-center text-slate-300">
          <Package className="h-8 w-8 mb-1" />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Barcode: {barcode}</p>
            <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2">{product_name}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">₹{unit_price}</p>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-lg font-bold text-slate-900">₹{item_total}</p>
          </div>
        </div>

        {/* Controls & Total */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <Button
              variant="ghost"
              className="h-8 w-8 p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-50"
              disabled={quantity <= 1 || isUpdating}
              onClick={() => onUpdateQuantity(item.id, quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="w-10 text-center font-semibold text-slate-900 text-sm">
              {quantity}
            </div>
            
            <Button
              variant="ghost"
              className="h-8 w-8 p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-50"
              disabled={isUpdating}
              onClick={() => onUpdateQuantity(item.id, quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right sm:hidden">
              <p className="text-lg font-bold text-slate-900">₹{item_total}</p>
            </div>
            <Button
              variant="ghost"
              className="h-9 w-9 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
              disabled={isUpdating}
              onClick={() => onRemove(item.id)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
