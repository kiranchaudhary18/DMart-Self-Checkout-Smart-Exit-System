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
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Loader2
} from "lucide-react";
import { User } from "@/types/auth";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { getAdminCustomers, AdminCustomer } from "@/lib/api/adminCustomers";

export default function AdminCustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminCustomers({ 
        page: currentPage, 
        search: searchTerm,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setCustomers(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load customers from server.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadCustomers]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm mt-1">Manage user accounts and view shopping history.</p>
          </div>
        </div>



        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search by name, email or phone..." 
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
                  <option value="ALL">All Accounts</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive / Blocked</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading customers...</h3>
              </div>
            ) : error ? (
              <ErrorState 
                title="Error Loading Customers" 
                message={error} 
                onRetry={loadCustomers} 
              />
            ) : customers.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="No customers found"
                description={searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your filters or search terms."
                  : "Customer accounts will appear here once they register."}
              />
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Customer <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Registration Date <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4 text-center">Points</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-medium text-slate-900">{customer.name || "Guest User"}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {customer.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-600">{customer.email}</div>
                        <div className="text-xs text-slate-500">{customer.phone}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {customer.registration_date ? new Date(customer.registration_date).toLocaleDateString() : '--'}
                      </td>
                      <td className="p-4 text-center font-medium">{customer.order_count ?? '--'}</td>
                      <td className="p-4 text-center text-emerald-600 font-medium">{customer.loyalty_points ?? '--'}</td>
                      <td className="p-4 text-center">
                        {customer.is_active ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Link href={`/admin/customers/${customer.id}`}>
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
          
          {customers.length > 0 && (
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
