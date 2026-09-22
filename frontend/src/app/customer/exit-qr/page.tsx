"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ExitPass } from "@/types/exit-qr";
import { exitQrService } from "@/lib/api/exitQr";
import { removeTokens } from "@/lib/auth/token";
import { Loader2, ShieldCheck, Clock, AlertCircle, RefreshCw, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExitQRPage() {
  const router = useRouter();
  const [pass, setPass] = useState<ExitPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  const fetchPassStatus = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const response = await exitQrService.getLatestEligibleExitPass();
      
      let fetchedPass = response.pass;
      if (fetchedPass) {
        // Handle local caching of the base64 QR data since backend only returns it once
        const cacheKey = `qr_data_${fetchedPass.id}`;
        if (fetchedPass.qr_data) {
          localStorage.setItem(cacheKey, fetchedPass.qr_data);
        } else {
          const cachedQr = localStorage.getItem(cacheKey);
          if (cachedQr) {
            fetchedPass.qr_data = cachedQr;
          }
        }
      }
      setPass(fetchedPass);
      if (!fetchedPass && response.message) {
        setErrorMessage(response.message);
      }
    } catch (err: any) {
      console.error("Failed to fetch Exit QR:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
        return;
      }
      setErrorMessage(err.response?.data?.message || "Failed to load your secure exit pass. Please try again.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPassStatus();
  }, [fetchPassStatus]);

  // Live Countdown Timer Effect
  useEffect(() => {
    if (!pass?.expires_at || pass.status !== 'ACTIVE') {
      setTimeLeftStr("");
      return;
    }

    // Immediate calculation so it doesn't wait 1s to show
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(pass.expires_at!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeftStr("0m 0s");
        fetchPassStatus(); // Auto-refresh when it expires
        return false;
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(`${minutes}m ${seconds}s`);
        return true;
      }
    };

    let intervalId: NodeJS.Timeout;
    if (calculateTimeLeft()) {
      intervalId = setInterval(() => {
        if (!calculateTimeLeft()) {
          clearInterval(intervalId);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pass?.expires_at, pass?.status, fetchPassStatus]);

  const handleManualRefresh = () => {
    if (refreshCooldown || isRefreshing) return;
    setRefreshCooldown(true);
    fetchPassStatus();
    // Prevent rapid clicks for 3 seconds
    setTimeout(() => setRefreshCooldown(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 border-green-200";
      case "USED": return "bg-slate-100 text-slate-800 border-slate-200";
      case "EXPIRED": return "bg-red-100 text-red-800 border-red-200";
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      case "INVALID": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col px-4 py-8 items-center justify-center">
        
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary-700" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Secure Exit Pass</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Please present this pass to the security staff at the exit gates.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            
            {/* Top decorative stripe */}
            <div className="h-2 w-full bg-primary-600"></div>

            <div className="p-6 sm:p-8 min-h-[300px] flex flex-col justify-center relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
                  <p className="text-slate-500 font-medium">Loading exit pass...</p>
                </div>
              ) : errorMessage && !pass ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                    <AlertCircle className="h-10 w-10 text-red-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Notice</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {errorMessage}
                  </p>
                  <Button 
                    onClick={() => router.push('/customer/dashboard')}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : !pass ? (
                /* Empty State */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                    <ShieldCheck className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Pass</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    You currently have no eligible paid orders. Your Secure Exit Pass will appear here automatically once your payment is confirmed.
                  </p>
                  <Button 
                    onClick={() => router.push('/customer/cart')}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    Go to Cart
                  </Button>
                </div>
              ) : (
                /* Pass Exists */
                <div className="flex flex-col items-center">
                  
                  {/* Status Badge */}
                  <div className={`mb-6 px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide flex items-center gap-2 ${getStatusColor(pass.status)}`}>
                    {pass.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                    {pass.status}
                  </div>

                  {/* QR Code Area */}
                  <div className={`p-4 bg-white border-2 rounded-xl mb-6 shadow-sm transition-opacity ${pass.status !== 'ACTIVE' ? 'opacity-40 grayscale' : 'border-primary-100'}`}>
                    {pass.status === 'ACTIVE' || pass.status === 'PENDING' ? (
                       pass.qr_data ? (
                         <img 
                           src={`data:image/png;base64,${pass.qr_data}`} 
                           alt="Exit QR Code" 
                           width={200} 
                           height={200} 
                           className="mx-auto block" 
                         />
                       ) : (
                         <div className="w-[200px] h-[200px] bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center rounded-lg text-slate-400 p-4 text-center">
                           <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                           <span className="text-xs">QR Data Unavailable</span>
                         </div>
                       )
                    ) : (
                      <div className="w-[200px] h-[200px] bg-slate-100 flex items-center justify-center rounded-lg">
                        <ShieldCheck className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Pass Metadata */}
                  <div className="w-full space-y-4 border-t border-dashed border-slate-200 pt-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Order Reference</span>
                      <span className="font-bold text-slate-900">#{pass.order_number}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Generated</span>
                      <span className="font-medium text-slate-900">
                        {new Date(pass.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {pass.expires_at && pass.status === 'ACTIVE' && (
                      <div className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-lg text-amber-800 border border-amber-100 mt-2">
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Expires In</span>
                        <span className="font-bold">
                          {timeLeftStr || "Calculating..."}
                        </span>
                      </div>
                    )}

                    {pass.status !== 'ACTIVE' && (
                      <div className="flex items-start gap-2 text-sm p-3 bg-slate-50 rounded-lg text-slate-600 mt-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>This pass is no longer active. Please contact a staff member if you need assistance.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Cutouts for receipt aesthetic */}
            <div className="absolute top-[65%] -left-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner z-10"></div>
            <div className="absolute top-[65%] -right-3 w-6 h-6 bg-slate-50 rounded-full shadow-inner z-10"></div>
            
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Button 
              variant="outline" 
              className="w-full bg-white shadow-sm border-slate-200 h-12"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading || refreshCooldown}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
            
            {pass && (
              <Button 
                variant="ghost" 
                className="w-full text-slate-600 hover:text-slate-900 h-12"
                onClick={() => router.push(`/customer/history/${pass.order_number}`)}
              >
                <Receipt className="w-4 h-4 mr-2" />
                View Receipt
              </Button>
            )}

            {!pass && !isLoading && !errorMessage && (
              <Button 
                variant="ghost" 
                className="w-full text-slate-600 hover:text-slate-900 h-12"
                onClick={() => router.push('/customer/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
