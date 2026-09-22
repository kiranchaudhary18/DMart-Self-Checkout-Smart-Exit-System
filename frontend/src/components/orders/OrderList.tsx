import React from "react";
import { Order } from "@/types/dashboard";
import { OrderCard } from "./OrderCard";
import { OrderSkeleton } from "./OrderSkeleton";

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
