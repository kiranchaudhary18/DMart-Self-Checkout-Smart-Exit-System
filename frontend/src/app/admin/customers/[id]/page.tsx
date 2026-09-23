"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, User as UserIcon, Receipt, Gift, Ban, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { getAdminCustomerDetail, AdminCustomer } from "@/lib/api/adminCustomers";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminCustomerDetail(id);
        setCustomer(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load customer details.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/customers">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              {customer?.name || "Customer Profile"}
              {customer?.is_active ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
              ) : customer ? (
                <Badge className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>
              ) : null}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Customer ID: {id}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error Loading Customer</span>
              {error}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <h3 className="text-lg font-medium text-slate-900">Loading customer details...</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <UserIcon className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{customer?.name || "--"}</h2>
                <p className="text-slate-500 text-sm mt-1">{customer?.email || "--"}</p>
              </div>
              <div className="p-6 bg-white text-sm space-y-4">
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Phone Number</span>
                  <span className="font-medium">{customer?.phone || "--"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Registration Date</span>
                  <span className="font-medium">
                    {customer?.registration_date ? new Date(customer.registration_date).toLocaleDateString() : "--"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Account Role</span>
                  <Badge variant="outline" className="bg-slate-50">{customer?.role || "CUSTOMER"}</Badge>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-white text-sm space-y-4">
                <h3 className="font-semibold text-slate-900 mb-2">Account Actions</h3>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 shadow-sm">
                  <Ban className="w-4 h-4 mr-2" /> Block Customer
                </Button>
                <Button variant="outline" className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100 shadow-sm">
                  <CheckCircle className="w-4 h-4 mr-2" /> Reactivate Account
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{customer?.order_count || 0}</p>
                </div>
              </Card>

              <Card className="border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Loyalty Points</p>
                  <p className="text-2xl font-bold text-slate-900">{customer?.loyalty_points || 0}</p>
                </div>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">Recent Orders</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 h-8" disabled>View All</Button>
              </div>
              <div className="p-0">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Order ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm bg-white">
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                        Loading orders or no orders found for this customer...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
