"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Layers, 
  ShoppingCart, 
  Users, 
  Tag, 
  ShieldCheck, 
  BarChart3, 
  AlertTriangle,
  Activity,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { getDashboardAnalytics, DashboardAnalytics } from "@/lib/api/adminAnalytics";

export default function AdminDashboardPage() {
  const quickActions = [
    { title: "Manage Products", icon: Package, href: "/admin/products", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Manage Inventory", icon: Layers, href: "/admin/inventory", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "View Orders", icon: ShoppingCart, href: "/admin/orders", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "View Customers", icon: Users, href: "/admin/customers", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Manage Coupons", icon: Tag, href: "/admin/coupons", color: "text-pink-600", bg: "bg-pink-50" },
    { title: "View Security", icon: ShieldCheck, href: "/admin/security", color: "text-slate-600", bg: "bg-slate-100" },
    { title: "Analytics", icon: BarChart3, href: "/admin/analytics", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Fraud Alerts", icon: AlertTriangle, href: "/admin/fraud", color: "text-red-600", bg: "bg-red-50" },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardAnalytics();
        if (isMounted) setSummary(data);
      } catch (err: any) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load system overview.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">System Overview</h2>
            <p className="text-slate-500 mt-1">Monitor high-level metrics across the DMart infrastructure.</p>
          </div>
          {isLoading && (
            <div className="flex items-center text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" /> Syncing data...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Connection Error</span>
              {error}
            </div>
          </div>
        )}

        {/* Overview Cards (Real data via backend) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-slate-500">Total Products</p>
              <div className="text-2xl md:text-3xl font-bold mt-2 text-slate-900">
                {summary ? summary.inventory.total_products?.toLocaleString() : "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-slate-500">Low Stock</p>
              <div className="text-2xl md:text-3xl font-bold mt-2 text-slate-900">
                {summary ? summary.inventory.low_stock?.toLocaleString() : "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-slate-500">Active Orders</p>
              <div className="text-2xl md:text-3xl font-bold mt-2 text-slate-900">
                {summary ? summary.orders.total_orders?.toLocaleString() : "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-slate-500">Total Customers</p>
              <div className="text-2xl md:text-3xl font-bold mt-2 text-slate-900">
                {summary ? summary.customers.total?.toLocaleString() : "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-slate-500">Gross Revenue</p>
              <div className="text-xl md:text-2xl font-bold mt-2 text-slate-900">
                {summary ? `₹${summary.sales.total?.total_revenue?.toLocaleString() || 0}` : "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-red-100 bg-red-50/30">
            <CardContent className="p-4 md:p-6">
              <p className="text-sm font-medium text-red-700">Fraud Alerts</p>
              <div className="text-2xl md:text-3xl font-bold mt-2 text-red-900">
                {summary ? summary.fraud.open_suspicious : "--"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href} className="block group">
                  <div className="flex items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <div className={`p-3 rounded-lg ${action.bg} ${action.color} mr-4`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{action.title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Side Panel (Recent Activity & System Status) */}
          <div className="space-y-8">
            
            {/* System Status */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">System Status</h3>
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0 divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Core API Connection</span>
                    </div>
                    <div className="flex items-center">
                      {isLoading ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                          <span className="text-xs text-slate-500">Connecting...</span>
                        </>
                      ) : error ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                          <span className="text-xs text-red-600">Offline</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-xs text-emerald-600">Online</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheck className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Security Module</span>
                    </div>
                    <div className="flex items-center">
                      {isLoading ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-slate-300 mr-2"></span>
                          <span className="text-xs text-slate-500">Checking</span>
                        </>
                      ) : error ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-slate-300 mr-2"></span>
                          <span className="text-xs text-slate-500">Unknown</span>
                        </>
                      ) : summary?.fraud?.open_suspicious && summary.fraud.open_suspicious > 0 ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                          <span className="text-xs text-amber-600">Alerts Open</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-xs text-emerald-600">Secure</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No recent activity</p>
                  <p className="text-xs text-slate-500 mt-1">Activity logs will appear here once connected to the backend.</p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
