"use client";

import React from "react";
import { CartItem } from "./CartItem";
import { CartItem as CartItemType } from "@/types/dashboard";

interface CartListProps {
  items: CartItemType[];
  updatingItemId: number | null;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export function CartList({ items, updatingItemId, onUpdateQuantity, onRemove }: CartListProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          isUpdating={updatingItemId === item.id}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
