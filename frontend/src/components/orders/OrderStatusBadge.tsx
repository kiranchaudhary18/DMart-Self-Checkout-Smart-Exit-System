import React from "react";
import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: string;
  type?: "order" | "payment";
}

export function OrderStatusBadge({ status, type = "order" }: OrderStatusBadgeProps) {
  let colorClass = "bg-slate-100 text-slate-800"; // default

  const normalizedStatus = status.toUpperCase();

  if (type === "payment") {
    switch (normalizedStatus) {
      case "PAID":
        colorClass = "bg-green-100 text-green-800 border-green-200";
        break;
      case "PENDING":
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        break;
      case "FAILED":
      case "CANCELLED":
        colorClass = "bg-red-100 text-red-800 border-red-200";
        break;
      case "REFUNDED":
        colorClass = "bg-purple-100 text-purple-800 border-purple-200";
        break;
    }
  } else {
    // Order status
    switch (normalizedStatus) {
      case "VERIFIED":
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        break;
      case "PAID":
        colorClass = "bg-green-100 text-green-800 border-green-200";
        break;
      case "PENDING":
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        break;
      case "CANCELLED":
        colorClass = "bg-red-100 text-red-800 border-red-200";
        break;
    }
  }

  return (
    <Badge variant="outline" className={`${colorClass} font-medium tracking-wide text-xs px-2.5 py-0.5`}>
      {normalizedStatus}
    </Badge>
  );
}
