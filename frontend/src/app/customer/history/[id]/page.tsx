"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { ordersService } from "@/lib/api/orders";
import { paymentService } from "@/lib/api/payment";
import { Order } from "@/types/dashboard";
import { PaymentDetails } from "@/types/payment";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { 
  ArrowLeft, 
  Package, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: number } | null>(null);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const orderData = await ordersService.getOrderDetails(orderId);
      setOrder(orderData);

      // Attempt to fetch payment details if applicable
      try {
        const paymentData = await paymentService.getPaymentDetails(orderId);
        setPayment(paymentData);
      } catch (payErr: any) {
        // Payment might not exist yet, this is not a hard error
        console.warn("Could not fetch payment details:", payErr);
      }

    } catch (err: any) {
      console.error("Failed to fetch order details:", err);
      const status = err.response?.status;
      if (status === 404) {
        setError({ message: "Order not found.", code: 404 });
      } else if (status === 403) {
        setError({ message: "You don't have permission to view this order.", code: 403 });
      } else {
        setError({ message: "Unable to load order details. Please try again.", code: status });
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="min-h-screen p-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !order) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <CustomerDashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => router.push("/customer/history")} className="mb-6 -ml-4 text-slate-500">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {error?.code === 404 ? "Order Not Found" : error?.code === 403 ? "Access Denied" : "Oops!"}
            </h2>
            <p className="text-slate-500 mb-6">{error?.message || "Order not found."}</p>
            {(!error?.code || (error.code !== 404 && error.code !== 403)) && (
              <Button onClick={fetchOrderData}>Try Again</Button>
            )}
          </div>
        </div>
        </CustomerDashboardLayout>
      </ProtectedRoute>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-full">
        {/* Navigation - Hidden on Print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/customer/history" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <FileText className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button size="sm" className="gap-2" onClick={() => router.push("/customer/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* Print-only Branding */}
          <div className="hidden print:block text-center border-b border-slate-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-slate-900">DMart</h1>
            <p className="text-slate-500 mt-1">Digital Receipt</p>
          </div>

          {/* Header Summary Card */}
          <div className="p-6 mb-6 print:mb-0 print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1 print:text-lg">Order #{order.order_number}</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4 print:hidden" />
                  {orderDate}
                </div>
              </div>
              <div className="flex flex-row gap-3">
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Status</span>
                  <div className="print:hidden">
                    <OrderStatusBadge status={order.payment_status} type="payment" />
                  </div>
                  <span className="hidden print:inline-block font-bold text-slate-900 text-sm">
                    {order.payment_status === "PAID" ? "Payment Successful" : 
                     order.payment_status === "PENDING" ? "Payment Pending" :
                     order.payment_status === "FAILED" ? "Payment Failed" :
                     order.payment_status === "CANCELLED" ? "Payment Cancelled" : order.payment_status}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 mt-1 print:hidden"></div>
                <div className="flex flex-col items-start sm:items-end gap-1 print:hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Status</span>
                  <OrderStatusBadge status={order.status} type="order" />
                </div>
              </div>
            </div>
            
            {order.receipt && (
              <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 p-3 rounded-lg border border-primary-100 print:bg-transparent print:border-none print:p-0 print:text-slate-900">
                <FileText className="h-4 w-4 print:hidden" />
                <span className="font-medium">Receipt Generated:</span> {order.receipt.receipt_number}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 print:p-0 print:block">
            
            {/* Main Column: Items List */}
            <div className="lg:col-span-2 space-y-6 print:space-y-4">
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden print:border-none print:bg-transparent">
                <div className="p-4 border-b border-slate-100 print:p-0 print:pb-2 print:border-slate-800">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400 print:hidden" />
                    Order Items ({order.items?.length || 0})
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 print:divide-slate-200">
                  {order.items?.map((item) => (
                    <div key={item.id} className="p-4 flex items-start gap-4 print:p-2 print:px-0">
                      {/* Placeholder for Product Image - Hidden on print */}
                      <div className="h-16 w-16 bg-white rounded-md flex-shrink-0 border border-slate-200 flex items-center justify-center print:hidden">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate print:whitespace-normal">{item.product_name}</h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 print:text-slate-900">
                          <span>Qty: {item.quantity}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 print:hidden"></span>
                          <span className="hidden print:inline">×</span>
                          <span>₹{item.unit_price} each</span>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900">₹{item.total_amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Column: Pricing & Payment */}
            <div className="space-y-6 print:space-y-4 print:mt-6">
              {/* Pricing Breakdown */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5 print:border-none print:bg-transparent print:p-0">
                <h2 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 print:border-slate-800">Order Summary</h2>
                
                <div className="space-y-3 text-sm print:text-slate-900">
                  <div className="flex justify-between text-slate-600 print:text-slate-900">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">₹{order.subtotal}</span>
                  </div>
                  
                  {parseFloat(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-green-600 print:text-slate-900">
                      <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                      <span className="font-medium">-₹{order.discount_amount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-slate-600 print:text-slate-900">
                    <span>GST/Tax</span>
                    <span className="font-medium text-slate-900">₹{order.gst_amount}</span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-slate-200 print:border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-base">Final Total</span>
                    <span className="font-bold text-primary-700 text-xl print:text-slate-900">₹{order.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {payment && (
                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5 print:border-none print:bg-transparent print:p-0">
                  <h2 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 print:border-slate-800 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400 print:hidden" />
                    Payment Details
                  </h2>
                  
                  <div className="space-y-3 text-sm print:text-slate-900">
                    {payment.razorpay_payment_id && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider print:text-slate-600">Transaction ID</span>
                        <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-100 break-all print:border-none print:bg-transparent print:p-0">
                          {payment.razorpay_payment_id}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 mt-3 print:hidden">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status</span>
                      <div>
                         <OrderStatusBadge status={payment.status} type="payment" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-3">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider print:text-slate-600">Timestamp</span>
                      <span className="text-slate-700">
                        {new Date(payment.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Exit QR Placeholder */}
              {order.payment_status === "PAID" && (
                 <div className="bg-primary-50 rounded-xl border border-primary-100 p-5 text-center print:hidden">
                    <h3 className="font-bold text-primary-900 mb-2">Ready to Leave?</h3>
                    <p className="text-sm text-primary-700 mb-4">Use your Exit QR code at the security gates.</p>
                    <Button className="w-full" variant="primary" disabled>
                      View Exit QR (Coming Soon)
                    </Button>
                 </div>
              )}
            </div>
            
          </div>
        </div>
        
        {/* Print Footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-slate-500">
          <p>Thank you for shopping at DMart!</p>
          <p>For support, contact support@dmart.com</p>
        </div>
      </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
