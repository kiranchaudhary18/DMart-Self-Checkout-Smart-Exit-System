"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Receipt, CreditCard, Box, User, AlertCircle, Loader2 } from "lucide-react";
import { Order } from "@/types/dashboard";
import { getAdminOrderDetail } from "@/lib/api/adminOrders";
import { ErrorState } from "@/components/shared/ErrorState";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminOrderDetail(id);
        setOrder(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load order details.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [id]);

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
        
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Order {order?.order_number || `#${id}`}
              {order && getStatusBadge(order.status)}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Placed on {order ? new Date(order.created_at).toLocaleString() : '--'}
            </p>
          </div>
        </div>



        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <h3 className="text-lg font-medium text-slate-900">Loading order details...</h3>
          </div>
        ) : error ? (
          <ErrorState 
            title="Error Loading Order" 
            message={error} 
            onRetry={() => window.location.reload()} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Order Items</h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Product</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Unit Price</th>
                      <th className="p-4 pr-6 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm bg-white">
                    {order?.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-medium text-slate-900">{item.product_name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{item.barcode}</div>
                        </td>
                        <td className="p-4 text-center font-medium">{item.quantity}</td>
                        <td className="p-4 text-right">₹{item.unit_price}</td>
                        <td className="p-4 pr-6 text-right font-medium">₹{item.total_amount}</td>
                      </tr>
                    ))}
                    {(!order || !order.items || order.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                          Loading items or no items found...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Order Summary</h2>
              </div>
              <div className="p-6 space-y-3 text-sm bg-white">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{order?.subtotal || "0.00"}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{order?.discount_amount || "0.00"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (GST)</span>
                  <span>₹{order?.gst_amount || "0.00"}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between font-bold text-lg text-slate-900">
                  <span>Total</span>
                  <span>₹{order?.total_amount || "0.00"}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Customer</h2>
              </div>
              <div className="p-6 bg-white text-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">
                    --
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Guest User / Unknown</div>
                    <div className="text-slate-500 text-xs">ID: --</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full shadow-sm text-sm" disabled>
                  View Customer Profile
                </Button>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Payment & Verification</h2>
              </div>
              <div className="p-6 bg-white text-sm space-y-4">
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Payment Status</span>
                  {order ? getStatusBadge(order.payment_status) : <Badge variant="outline">--</Badge>}
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Order Status</span>
                  {order ? getStatusBadge(order.status) : <Badge variant="outline">--</Badge>}
                </div>
                {order?.receipt && (
                  <div>
                    <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Receipt Number</span>
                    <span className="font-mono">{order.receipt.receipt_number}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100">
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-2">Exit Verification</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-center text-slate-500 italic">
                    Verification data not available.
                  </div>
                </div>
              </div>
            </Card>
          </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
