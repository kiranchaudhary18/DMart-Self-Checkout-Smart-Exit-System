"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowUpDown, 
  Eye, 
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Receipt,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Order } from "@/types/dashboard";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAdminOrders } from "@/lib/api/adminOrders";

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders({ 
        page: currentPage, 
        search: searchTerm,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        payment_status: paymentFilter !== "ALL" ? paymentFilter : undefined
      });
      setOrders(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load orders from server.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, paymentFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadOrders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "PAID":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{status}</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{status}</Badge>;
      case "CANCELLED":
      case "FAILED":
        return <Badge className="bg-red-50 text-red-700 border-red-200">{status}</Badge>;
      case "REFUNDED":
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200">{status}</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track customer transactions.</p>
          </div>
        </div>



        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search order ID or customer..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Order Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading orders...</h3>
              </div>
            ) : error ? (
              <ErrorState 
                title="Error Loading Orders" 
                message={error} 
                onRetry={loadOrders} 
              />
            ) : orders.length === 0 ? (
              <EmptyState 
                icon={Receipt}
                title="No orders found"
                description={searchTerm || statusFilter !== "ALL" || paymentFilter !== "ALL" 
                  ? "Try adjusting your filters or search terms."
                  : "Orders will appear here once customers complete checkout."}
              />
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Date <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4 text-right">Items</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group text-right">
                      <div className="flex items-center justify-end">Amount <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4 text-center">Payment</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-medium text-slate-900">{order.order_number}</td>
                      <td className="p-4 text-slate-600">--</td>
                      <td className="p-4 text-slate-500">{new Date(order.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-600">--</td>
                      <td className="p-4 font-medium text-right">₹{order.total_amount}</td>
                      <td className="p-4 text-center">{getStatusBadge(order.payment_status)}</td>
                      <td className="p-4 text-center">{getStatusBadge(order.status)}</td>
                      <td className="p-4 pr-6 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-blue-600 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {orders.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-sm text-slate-500">
              <div>Showing page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
