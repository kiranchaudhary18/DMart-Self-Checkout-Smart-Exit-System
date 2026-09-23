"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ArrowUpDown, 
  Gift, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from "lucide-react";

import { 
  getAdminLoyaltyAccounts, 
  getAdminLoyaltyTransactions, 
  AdminLoyaltyAccount, 
  AdminLoyaltyTransaction 
} from "@/lib/api/adminLoyalty";

export default function AdminLoyaltyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "ACCOUNTS">("TRANSACTIONS");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<AdminLoyaltyTransaction[]>([]);
  const [accounts, setAccounts] = useState<AdminLoyaltyAccount[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "EARN":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Earn</Badge>;
      case "REDEEM":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Redeem</Badge>;
      case "ADJUSTMENT":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Adjustment</Badge>;
      case "REVERSAL":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Reversal</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 border-slate-200">{type}</Badge>;
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "TRANSACTIONS") {
        const data = await getAdminLoyaltyTransactions({
          page: currentPage,
          search: searchTerm,
          type: typeFilter !== "ALL" ? typeFilter : undefined
        });
        setTransactions(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
      } else {
        const data = await getAdminLoyaltyAccounts({
          page: currentPage,
          search: searchTerm
        });
        setAccounts(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load loyalty data from server.");
      setTransactions([]);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, searchTerm, typeFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadData]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Loyalty Program</h1>
            <p className="text-slate-500 text-sm mt-1">Manage customer points and view transaction history.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error Loading Loyalty Data</span>
              {error}
            </div>
          </div>
        )}

        {/* Global System Stats (Dummy) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 p-6 flex flex-col justify-center bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Issued</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 ml-13">--</p>
          </Card>
          <Card className="border-slate-200 p-6 flex flex-col justify-center bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Redeemed</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 ml-13">--</p>
          </Card>
          <Card className="border-slate-200 p-6 flex flex-col justify-center bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 ml-13">--</p>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button 
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "TRANSACTIONS" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setActiveTab("TRANSACTIONS")}
            >
              Transaction History
            </button>
            <button 
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "ACCOUNTS" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setActiveTab("ACCOUNTS")}
            >
              Customer Accounts
            </button>
          </div>

          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder={activeTab === "TRANSACTIONS" ? "Search order ref or customer..." : "Search customer email..."}
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {activeTab === "TRANSACTIONS" && (
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="EARN">Earned</option>
                    <option value="REDEEM">Redeemed</option>
                    <option value="ADJUSTMENT">Adjustments</option>
                    <option value="REVERSAL">Reversals</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading {activeTab.toLowerCase()}...</h3>
              </div>
            ) : activeTab === "TRANSACTIONS" ? (
              transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No transactions found</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    {searchTerm || typeFilter !== "ALL"
                      ? "Try adjusting your filters or search terms."
                      : "Points transactions will appear here once customers start earning or redeeming."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4 text-right">Points</th>
                      <th className="p-4 pr-6 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {/* Empty for now */}
                  </tbody>
                </table>
              )
            ) : (
              accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <Gift className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No loyalty accounts found</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    {searchTerm ? "No customers found matching that email." : "Loyalty accounts will be created automatically."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center">Customer <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                      </th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center justify-end">Current Balance <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                      </th>
                      <th className="p-4 text-right">Lifetime Earned</th>
                      <th className="p-4 pr-6 text-right">Lifetime Redeemed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {/* Empty for now */}
                  </tbody>
                </table>
              )
            )}
          </div>
          
          {((activeTab === "TRANSACTIONS" && transactions.length > 0) || (activeTab === "ACCOUNTS" && accounts.length > 0)) && (
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
