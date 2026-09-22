import React from "react";
import Link from "next/link";
import { Order } from "@/types/dashboard";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Calendar, ReceiptText, ChevronRight } from "lucide-react";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-lg">Order #{order.order_number}</h3>
            {order.receipt && (
              <span className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded flex items-center gap-1">
                <ReceiptText className="h-3 w-3" />
                Receipt
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>{orderDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Payment</span>
            <OrderStatusBadge status={order.payment_status} type="payment" />
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</span>
            <OrderStatusBadge status={order.status} type="order" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm text-slate-500 mb-1">Total Amount</span>
          <span className="text-xl font-bold text-slate-900">₹{order.total_amount}</span>
        </div>
        
        <Link 
          href={`/customer/history/${order.order_number}`}
          className="flex items-center justify-center sm:justify-end gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 w-full sm:w-auto"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
