"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ordersService } from "@/lib/api/orders";
import { Order } from "@/types/dashboard";
import { OrderList } from "@/components/orders/OrderList";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { PackageX, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ordersService.getRecentOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError("Unable to load order history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Client-side filtering and sorting
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== "ALL") {
      // The requirement didn't specify whether the filter applies to Order status or Payment status.
      // We will map it generally, or assume the user meant payment_status based on the filter options (Paid, Pending, Failed, Cancelled)
      result = result.filter(o => o.payment_status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(o => o.order_number.toLowerCase().includes(lowerTerm));
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, statusFilter, searchTerm, sortOrder]);

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Order History</h1>
          <p className="text-slate-500">View your previous purchases and payment details.</p>
        </div>

        {error ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Oops! Something went wrong.</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Button onClick={fetchOrders} className="bg-slate-900 text-white px-8">
              Try Again
            </Button>
          </div>
        ) : !isLoading && orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <PackageX className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm">
              Your completed purchases will appear here once you've checked out.
            </p>
            <Link href="/customer/products">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <OrderFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
            
            {!isLoading && filteredAndSortedOrders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">No orders match your filters.</p>
                <Button variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <OrderList 
                orders={filteredAndSortedOrders} 
                isLoading={isLoading} 
              />
            )}
          </>
        )}
        
      </div>
    </ProtectedRoute>
  );
}
