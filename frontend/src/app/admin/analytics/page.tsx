"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  CreditCard,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Calendar,
  IndianRupee
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import { 
  getDashboardAnalytics, 
  getSalesAnalytics, 
  getProductsAnalytics,
  getInventoryAnalytics,
  DashboardAnalytics 
} from "@/lib/api/adminAnalytics";

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7_DAYS");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardAnalytics | null>(null);
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculate date filters
      const end = new Date();
      const start = new Date();
      if (dateRange === "TODAY") {
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === "7_DAYS") {
        start.setDate(end.getDate() - 7);
      } else if (dateRange === "30_DAYS") {
        start.setDate(end.getDate() - 30);
      }

      const params = {
        start_date: start.toISOString(),
        end_date: end.toISOString()
      };

      // In a real app we'd fetch all of these in parallel with Promise.all
      // But we wrap in try/catch safely
      const [dash, sales, products, inventory] = await Promise.all([
        getDashboardAnalytics(),
        getSalesAnalytics(params),
        getProductsAnalytics(params),
        getInventoryAnalytics()
      ]);

      setSummary(dash);
      
      // Transform Sales Data for Charts
      if (sales.daily_sales) {
        const revArr = sales.daily_sales.map((item: any) => ({
          date: item.date,
          revenue: item.total_revenue,
          orders: item.total_orders
        }));
        setRevenueData(revArr);
      }

      // Transform Categories
      if (products.sales_by_category) {
        const catArr = products.sales_by_category.map((item: any) => ({
          name: item.product__category,
          value: item.total_revenue
        }));
        setCategoryData(catArr);
      }

      // Products
      if (products.highest_revenue_products) {
        setTopProducts(products.highest_revenue_products);
      }

      // Inventory
      // The API doesn't list the exact products in getInventoryAnalytics, just counts.
      // We will show empty lists unless the endpoint supports fetching the actual items.
      setLowStockProducts([]);
      setOutOfStockProducts([]);

    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load analytics data from server.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Store performance, sales, and inventory insights.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select
              className="px-2 py-1.5 text-sm bg-transparent outline-none text-slate-700 font-medium"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="TODAY">Today</option>
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error Loading Analytics Data</span>
              {error}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? `₹${summary.sales.total?.total_revenue?.toLocaleString() || '0'}` : "--"}
            </h3>
          </Card>
          
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? summary.orders.total_orders?.toLocaleString() || '0' : "--"}
            </h3>
          </Card>
          
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Completed Orders</p>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? summary.orders.completed_orders?.toLocaleString() || '0' : "--"}
            </h3>
          </Card>
          
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Average Order Value</p>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? `₹${summary.sales.total?.average_order_value?.toLocaleString() || '0'}` : "--"}
            </h3>
          </Card>
          
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Total Customers</p>
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? summary.customers.total?.toLocaleString() || '0' : "--"}
            </h3>
          </Card>
          
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-slate-500">Products Sold</p>
              <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {summary ? summary.orders.total_items_sold?.toLocaleString() || '0' : "--"}
            </h3>
          </Card>
        </div>

        {/* Sales Analytics Charts */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Sales Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-slate-200 shadow-sm min-h-[350px] flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 mb-6">Revenue & Orders Over Time</h3>
            {revenueData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No data available for selected range</p>
              </div>
            ) : (
              <div className="flex-1 w-full min-h-[250px]">
                <div className="sr-only">
                  Line chart showing revenue and orders over time. 
                  {summary ? `Total revenue is ₹${summary.sales.total?.total_revenue || 0} from ${summary.orders.completed_orders || 0} completed orders.` : ''}
                </div>
                <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
                  <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                    <YAxis yAxisId="left" tick={{fontSize: 12}} stroke="#94a3b8" />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} name="Revenue (₹)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm min-h-[350px] flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 mb-6">Sales by Category</h3>
            {categoryData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <PieChart className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="flex-1 w-full min-h-[250px]">
                <div className="sr-only">
                  Pie chart showing sales by category.
                  {categoryData.length > 0 && ` Top categories include: ${categoryData.slice(0, 3).map(c => `${c.name} (₹${c.value})`).join(', ')}.`}
                </div>
                <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm min-h-[350px] flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 mb-6">Payment Status Distribution</h3>
            {paymentData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="flex-1 w-full min-h-[250px]">
                <div className="sr-only">
                  Bar chart showing payment status distribution.
                  {paymentData.length > 0 && ` Payment statuses include: ${paymentData.map(p => `${p.name} (${p.value})`).join(', ')}.`}
                </div>
                <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
                  <BarChart data={paymentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm min-h-[350px] flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 mb-6">Top Selling Products</h3>
            {topProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No products data available</p>
              </div>
            ) : (
              <div className="flex-1 w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium text-right">Sold</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-3 text-slate-700 font-medium">{p.product__name}</td>
                        <td className="py-3 text-right text-slate-500">{p.total_quantity}</td>
                        <td className="py-3 text-right font-medium text-slate-900">₹{p.total_revenue?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Inventory Insights */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Inventory Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-amber-900">Low Stock Products</h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No low stock items</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-3 pl-4 font-medium">Product</th>
                      <th className="p-3 font-medium">SKU</th>
                      <th className="p-3 pr-4 font-medium text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Rows */}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-red-50/50 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-semibold text-red-900">Out of Stock Products</h3>
            </div>
            {outOfStockProducts.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No out of stock items</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-3 pl-4 font-medium">Product</th>
                      <th className="p-3 font-medium">SKU</th>
                      <th className="p-3 pr-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Rows */}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}
