"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";

import { 
  getAdminCoupons, 
  createAdminCoupon, 
  updateAdminCoupon, 
  deleteAdminCoupon, 
  AdminCoupon 
} from "@/lib/api/adminCoupons";

export default function AdminCouponsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<AdminCoupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<AdminCoupon>>({
    code: "",
    description: "",
    discount_type: "PERCENTAGE",
    discount_value: "0.00",
    minimum_cart_value: "0.00",
    maximum_discount: null,
    usage_limit: null,
    valid_from: "",
    valid_until: "",
    is_active: true
  });

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminCoupons({
        page: currentPage,
        search: searchTerm,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined
      });
      setCoupons(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load coupons from server.");
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadCoupons();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadCoupons]);

  const handleAddClick = () => {
    setSelectedCoupon(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "PERCENTAGE",
      discount_value: "0.00",
      minimum_cart_value: "0.00",
      maximum_discount: null,
      usage_limit: null,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      is_active: true
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (coupon: AdminCoupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      ...coupon,
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: new Date(coupon.valid_until).toISOString().slice(0, 16),
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (coupon: AdminCoupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Coupons</h1>
            <p className="text-slate-500 text-sm mt-1">Create and manage discount codes for customers.</p>
          </div>
          <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Coupon
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error Loading Coupons</span>
              {error}
            </div>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search by coupon code..." 
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
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="UPCOMING">Upcoming</option>
                </select>

                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading coupons...</h3>
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                  <Tag className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No coupons found</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                    ? "Try adjusting your filters or search terms."
                    : "Create your first discount coupon to offer promotions."}
                </p>
                {!(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                  <Button onClick={handleAddClick} variant="outline" className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    Create Coupon
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Min. Order</th>
                    <th className="p-4 text-center">Usage</th>
                    <th className="p-4">Validity</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {/* Table body empty for now, waiting for APIs */}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" />
                {selectedCoupon ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                disabled={false} // isSaving would go here
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="couponForm" className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Coupon Code *</label>
                    <Input 
                      required
                      placeholder="e.g. SUMMER50" 
                      className="bg-white uppercase"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <Input 
                      placeholder="Brief description..." 
                      className="bg-white"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Discount Type *</label>
                    <select
                      className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      value={formData.discount_type}
                      onChange={e => setFormData({...formData, discount_type: e.target.value as "PERCENTAGE"|"FIXED"})}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Discount Value *</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      required
                      className="bg-white"
                      value={formData.discount_value}
                      onChange={e => setFormData({...formData, discount_value: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Max Discount (₹)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="bg-white"
                      placeholder="No limit"
                      value={formData.maximum_discount || ""}
                      onChange={e => setFormData({...formData, maximum_discount: e.target.value || null})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Min. Cart Value (₹) *</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      className="bg-white"
                      value={formData.minimum_cart_value}
                      onChange={e => setFormData({...formData, minimum_cart_value: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Usage Limit</label>
                    <Input 
                      type="number" 
                      min="1"
                      className="bg-white"
                      placeholder="Unlimited"
                      value={formData.usage_limit || ""}
                      onChange={e => setFormData({...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valid From *</label>
                    <Input 
                      type="datetime-local" 
                      required
                      className="bg-white"
                      value={formData.valid_from}
                      onChange={e => setFormData({...formData, valid_from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valid Until *</label>
                    <Input 
                      type="datetime-local" 
                      required
                      className="bg-white"
                      value={formData.valid_until}
                      onChange={e => setFormData({...formData, valid_until: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700 select-none">
                    Coupon is active and available for use
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="couponForm" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                Save Coupon
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Delete Coupon?</h2>
              <p className="text-slate-500 text-sm">
                Are you sure you want to delete <span className="font-semibold text-slate-700">{selectedCoupon?.code}</span>? 
                This action cannot be undone. Consider deactivating it instead.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
