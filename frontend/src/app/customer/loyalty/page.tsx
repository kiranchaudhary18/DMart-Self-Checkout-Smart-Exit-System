"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoyaltySummary, LoyaltyTransaction } from "@/types/loyalty";
import { loyaltyService } from "@/lib/api/loyalty";
import { removeTokens } from "@/lib/auth/token";
import { Gift, Award, ArrowUpRight, ArrowDownRight, Info, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoyaltyPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [balanceData, txData] = await Promise.all([
        loyaltyService.getLoyaltyBalance(),
        loyaltyService.getLoyaltyTransactions()
      ]);
      setSummary(balanceData);
      setTransactions(txData);
    } catch (err: any) {
      console.error("Failed to fetch loyalty data:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
        return;
      }
      setError("Unable to load your loyalty rewards. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary-600" />
            Loyalty Rewards
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm">
            <Info className="h-4 w-4" />
            Earn 1 point for every ₹100 spent. 1 point = ₹1 off your next purchase.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading your rewards...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-800 font-medium">{error}</p>
            <button onClick={fetchData} className="mt-4 text-sm font-semibold text-red-700 hover:text-red-800 underline">
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Award className="w-32 h-32" />
                </div>
                <h3 className="text-primary-100 font-medium mb-1 relative z-10">Current Balance</h3>
                <div className="text-4xl font-bold mb-1 relative z-10">{summary?.points_balance || 0}</div>
                <p className="text-primary-200 text-sm relative z-10">points available</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-slate-500 font-medium mb-1">Total Earned</h3>
                    <div className="text-2xl font-bold text-slate-900">{summary?.lifetime_earned || 0}</div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-slate-500 font-medium mb-1">Total Redeemed</h3>
                    <div className="text-2xl font-bold text-slate-900">{summary?.lifetime_redeemed || 0}</div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900">Points History</h2>
              </div>
              
              {(!transactions || transactions.length === 0) ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Gift className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-medium mb-1">No loyalty transactions yet</h3>
                  <p className="text-slate-500 text-sm">Make your first purchase to start earning points!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx, idx) => (
                    <div key={tx.reference_id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tx.transaction_type === 'EARNED' ? 'bg-green-100 text-green-600' : 
                          tx.transaction_type === 'REDEEMED' ? 'bg-amber-100 text-amber-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.transaction_type === 'EARNED' ? <ArrowUpRight className="h-4 w-4" /> : 
                           tx.transaction_type === 'REDEEMED' ? <ArrowDownRight className="h-4 w-4" /> : 
                           <Info className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{tx.description || tx.transaction_type}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                            {tx.order_number && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>Order #{tx.order_number}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        tx.transaction_type === 'EARNED' ? 'text-green-600' : 
                        tx.transaction_type === 'REDEEMED' ? 'text-slate-900' : 
                        'text-slate-500'
                      }`}>
                        {tx.transaction_type === 'EARNED' ? '+' : tx.transaction_type === 'REDEEMED' ? '-' : ''}{tx.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
