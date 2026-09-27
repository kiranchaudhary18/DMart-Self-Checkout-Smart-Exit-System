"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ordersService } from "@/lib/api/orders";
import { Order } from "@/types/dashboard";
import { CheckCircle2, FileText, ShoppingBag, Loader2, Calendar, Receipt, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setError("No order number provided.");
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await ordersService.getOrderDetails(orderNumber);
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to load order details:", err);
        setError("Could not load order details, but your payment was successful.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
        <h2 className="text-xl font-medium text-slate-700">Finalizing your order...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-green-500 p-8 text-center text-white">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful</h1>
          <p className="text-green-100">Thank you for your purchase.</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {error ? (
            <p className="text-center text-slate-500 mb-8">{error}</p>
          ) : order ? (
            <>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
                <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-3">Order Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID</span>
                    <span className="font-medium text-slate-900">{order.order_number}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">
                      {order.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1"><Calendar className="h-4 w-4"/> Date</span>
                    <span className="font-medium text-slate-900">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-base">Total Amount Paid</span>
                    <span className="font-bold text-primary-700 text-lg">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
              
              {order.items && order.items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                  <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-3 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-slate-500" /> 
                    Receipt Details
                  </h3>
                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 rounded-lg">
                        <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative">
                          {item.product_image ? (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="w-full h-full object-contain p-1 mix-blend-multiply"
                            />
                          ) : (
                            <span className="text-xl">📦</span>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{item.product_name}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs font-medium text-slate-500">Qty: {item.quantity} × ₹{item.unit_price}</span>
                            <span className="font-bold text-slate-900 text-sm">₹{item.total_amount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/customer/exit-qr" className="flex-1">
              <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                Show Exit QR
              </Button>
            </Link>

            <Link href="/customer/history" className="flex-1">
              <Button variant="outline" className="w-full h-12 border-primary-200 text-primary-700 hover:bg-primary-50 flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" />
                View Order History
              </Button>
            </Link>
            
            <Link href="/customer/products" className="flex-1">
              <Button variant="outline" className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
