"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { ExitPass } from "@/types/exit-qr";
import { exitQrService } from "@/lib/api/exitQr";
import { ordersService } from "@/lib/api/orders";
import { Order } from "@/types/dashboard";
import { removeTokens } from "@/lib/auth/token";
import { Loader2, ShieldCheck, Clock, AlertCircle, RefreshCw, ArrowLeft, Receipt, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExitQRPage() {
  const router = useRouter();
  const [passes, setPasses] = useState<ExitPass[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPasses = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      // Use our newly updated API method that returns { passes, message }
      const response = await exitQrService.getAllEligibleExitPasses() as any;
      
      const fetchedPasses: ExitPass[] = response.passes || [];
      
      for (let p of fetchedPasses) {
        const cacheKey = `qr_data_${p.id}`;
        if (p.qr_data) {
          localStorage.setItem(cacheKey, p.qr_data);
        } else {
          const cachedQr = localStorage.getItem(cacheKey);
          if (cachedQr) p.qr_data = cachedQr;
        }
      }
      
      setPasses(fetchedPasses);
      
      if (fetchedPasses.length === 0 && response.message) {
        setErrorMessage(response.message);
      } else {
        // Fetch order details for the receipt
        const ordersData: Record<string, Order> = {};
        for (const pass of fetchedPasses) {
          try {
            const orderDetails = await ordersService.getOrderDetails(pass.order_number);
            ordersData[pass.order_number] = orderDetails;
          } catch (e) {
            console.error("Failed to load order details for", pass.order_number);
          }
        }
        setOrders(ordersData);
      }
    } catch (err: any) {
      console.error("Failed to fetch Exit QRs:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
        return;
      }
      setErrorMessage(err.response?.data?.message || "Failed to load your secure exit passes. Please try again.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPasses();
    // Auto refresh every 5 seconds to catch when security scans it
    const interval = setInterval(() => {
      fetchPasses();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPasses]);

  const handleManualRefresh = () => {
    fetchPasses();
  };

  const nextPass = () => {
    if (currentIndex < passes.length - 1) setCurrentIndex(prev => prev + 1);
  };
  
  const prevPass = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'USED': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EXPIRED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'REVOKED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentPass = passes[currentIndex];
  const currentOrder = currentPass ? orders[currentPass.order_number] : null;

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        <div className="w-full max-w-lg mx-auto pb-10">
          
          <div className="text-center mb-6 pt-4">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Secure Exit Pass</h1>
            <p className="text-slate-500 mt-2 text-sm px-4">
              Please present your QR code and receipt to the security staff at the exit gates.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            <div className="h-2 w-full bg-primary-600"></div>

            <div className="p-4 sm:p-6 min-h-[300px] flex flex-col relative">
              {isLoading && passes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
                  <p className="text-slate-500 font-medium">Loading exit passes...</p>
                </div>
              ) : errorMessage && passes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                    <AlertCircle className="h-10 w-10 text-red-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Notice</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {errorMessage}
                  </p>
                  <Button onClick={() => router.push('/customer/dashboard')} className="w-full bg-primary-600 hover:bg-primary-700">
                    Go to Dashboard
                  </Button>
                </div>
              ) : passes.length > 0 && currentPass ? (
                <div className="flex flex-col">
                  {/* Multi-pass pagination header */}
                  {passes.length > 1 && (
                    <div className="flex items-center justify-between mb-4 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <Button variant="ghost" size="icon" onClick={prevPass} disabled={currentIndex === 0} className="h-8 w-8">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="text-sm font-medium text-slate-700">
                        Pass {currentIndex + 1} of {passes.length}
                      </span>
                      <Button variant="ghost" size="icon" onClick={nextPass} disabled={currentIndex === passes.length - 1} className="h-8 w-8">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {/* Pass Status */}
                  <div className="flex justify-center mb-6">
                    <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide flex items-center gap-2 ${getStatusColor(currentPass.status)}`}>
                      {currentPass.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                      {currentPass.status === 'USED' && <CheckCircle2 className="w-4 h-4 text-slate-500" />}
                      {currentPass.status}
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className={`mx-auto p-4 bg-white border-2 rounded-xl mb-6 shadow-sm transition-all ${currentPass.status !== 'ACTIVE' ? 'opacity-40 grayscale border-slate-200' : 'border-primary-100'}`}>
                    {currentPass.status === 'ACTIVE' ? (
                       currentPass.qr_data ? (
                         <img src={`data:image/png;base64,${currentPass.qr_data}`} alt="Exit QR Code" width={220} height={220} className="mx-auto block" />
                       ) : (
                         <div className="w-[220px] h-[220px] bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center rounded-lg text-slate-400 p-4 text-center">
                           <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                           <span className="text-xs">QR Unavailable</span>
                         </div>
                       )
                    ) : (
                      <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center rounded-lg flex-col gap-2">
                        <ShieldCheck className="w-12 h-12 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">Pass {currentPass.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Receipt Section */}
                  <div className="w-full mt-2 border-t border-dashed border-slate-300 pt-6 relative">
                    {/* Cute receipt cutouts */}
                    <div className="absolute -top-3 -left-6 w-6 h-6 bg-slate-50 rounded-full shadow-inner z-10 hidden sm:block"></div>
                    <div className="absolute -top-3 -right-6 w-6 h-6 bg-slate-50 rounded-full shadow-inner z-10 hidden sm:block"></div>

                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Receipt className="h-4 w-4 text-slate-500" /> 
                      Order Receipt
                    </h3>

                    {currentOrder ? (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Order Ref</span>
                          <span className="font-bold text-slate-900">#{currentPass.order_number}</span>
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {currentOrder.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <span className="text-slate-700 truncate mr-2 font-medium">
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-bold text-slate-900 shrink-0">
                                ₹{item.total_amount}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                          <span className="font-bold text-slate-900 text-sm">Total Paid</span>
                          <span className="font-bold text-primary-700">₹{currentOrder.total_amount}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      </div>
                    )}

                    {currentPass.status !== 'ACTIVE' && (
                      <div className="flex items-start gap-2 text-sm p-3 bg-slate-100 rounded-lg text-slate-600 mt-4 border border-slate-200">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                        <p>This pass has already been processed by security.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button 
              variant="outline" 
              className="w-full bg-white shadow-sm border-slate-200 h-12"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing with Security...' : 'Refresh Status'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-slate-600 hover:text-slate-900 h-12"
              onClick={() => router.push('/customer/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
