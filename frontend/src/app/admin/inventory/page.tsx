"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Layers,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  PackageSearch
} from "lucide-react";
import { Inventory, StockTransactionType } from "@/types/inventory";
import { getInventoryList, adjustStock } from "@/lib/api/inventory";

export default function AdminInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);

  // Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  
  // Adjustment Form State
  const [adjType, setAdjType] = useState<StockTransactionType>(StockTransactionType.RESTOCK);
  const [adjQuantity, setAdjQuantity] = useState<number>(0);
  const [adjReason, setAdjReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const data = await getInventoryList(params);
      
      // Filter locally for status if backend doesn't support stock status filter directly
      let filteredData = data;
      if (statusFilter === "IN_STOCK") {
        filteredData = data.filter(inv => (inv.current_stock - inv.reserved_stock) > inv.low_stock_threshold);
      } else if (statusFilter === "LOW_STOCK") {
        filteredData = data.filter(inv => {
          const available = inv.current_stock - inv.reserved_stock;
          return available > 0 && available <= inv.low_stock_threshold;
        });
      } else if (statusFilter === "OUT_OF_STOCK") {
        filteredData = data.filter(inv => (inv.current_stock - inv.reserved_stock) <= 0);
      }

      setInventoryList(filteredData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load inventory from server.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadInventory();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadInventory]);

  const handleAdjustClick = (inv: Inventory) => {
    setSelectedInventory(inv);
    setAdjType(StockTransactionType.RESTOCK);
    setAdjQuantity(0);
    setAdjReason("");
    setFormError(null);
    setIsAdjustOpen(true);
  };

  const handleCloseModal = () => {
    setIsAdjustOpen(false);
    setSelectedInventory(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory || adjQuantity <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }
    
    setIsSaving(true);
    setFormError(null);
    
    try {
      await adjustStock({
        product: selectedInventory.product.id,
        quantity: adjQuantity,
        transaction_type: adjType,
        reason: adjReason
      });
      setIsAdjustOpen(false);
      loadInventory(); // Refresh the grid
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.detail || "Failed to adjust stock.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStockStatus = (inv: Inventory) => {
    const available = inv.current_stock - inv.reserved_stock;
    if (available <= 0) return { label: "Out of Stock", variant: "danger", bg: "bg-red-50 text-red-700 border-red-200" };
    if (available <= inv.low_stock_threshold) return { label: "Low Stock", variant: "warning", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "In Stock", variant: "success", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Inventory Management</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor real-time stock levels and perform manual adjustments.</p>
          </div>
          <Button onClick={() => loadInventory()} variant="outline" className="shadow-sm bg-white">
            <RefreshCw className="w-4 h-4 mr-2 text-slate-500" /> Refresh Stock
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search by product name or barcode..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                <p className="text-slate-500 text-sm">Loading inventory...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Failed to load inventory</h3>
                <p className="text-slate-500 text-sm max-w-sm">{error}</p>
                <Button variant="outline" onClick={loadInventory}>Try Again</Button>
              </div>
            ) : inventoryList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                  <PackageSearch className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No inventory found</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Try adjusting your filters or search terms. If the catalog is empty, add products first.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Product <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4">SKU/Barcode</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Available Stock <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4">Reserved Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {inventoryList.map(inv => {
                    const status = getStockStatus(inv);
                    const available = inv.current_stock - inv.reserved_stock;
                    return (
                      <tr key={inv.product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-medium text-slate-900">
                          {inv.product.name}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-xs">
                          <div>{inv.product.sku}</div>
                          <div className="text-[10px] text-slate-400">{inv.product.barcode}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-900">
                          {available} <span className="text-xs text-slate-500 font-normal">{inv.product.unit}</span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {inv.reserved_stock} <span className="text-xs">{inv.product.unit}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={status.bg}>{status.label}</Badge>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={() => handleAdjustClick(inv)}>
                            <Layers className="w-4 h-4 mr-2 text-slate-500" /> Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Adjust Stock Modal */}
        {isAdjustOpen && selectedInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-start sm:pt-16 overflow-y-auto">
            <form onSubmit={handleAdjustSubmit} className="w-full max-w-md">
              <Card className="w-full shadow-xl border-none mb-16">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
                  <h2 className="text-xl font-bold text-slate-900">
                    Adjust Stock
                  </h2>
                  <Button type="button" variant="ghost" size="sm" onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900">
                    ✕
                  </Button>
                </div>
                <div className="p-6 space-y-6 bg-slate-50">
                  <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <h3 className="font-medium text-slate-900">{selectedInventory.product.name}</h3>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-slate-500">Current Available:</span>
                      <span className="font-semibold text-slate-900">
                        {selectedInventory.current_stock - selectedInventory.reserved_stock} {selectedInventory.product.unit}
                      </span>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Transaction Type *</label>
                    <select 
                      required
                      className="w-full p-2.5 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={adjType}
                      onChange={e => setAdjType(e.target.value as StockTransactionType)}
                    >
                      <optgroup label="Add Stock">
                        <option value={StockTransactionType.RESTOCK}>Restock (Add)</option>
                        <option value={StockTransactionType.RETURN}>Customer Return (Add)</option>
                      </optgroup>
                      <optgroup label="Remove Stock">
                        <option value={StockTransactionType.DAMAGE}>Damaged Goods (Remove)</option>
                        <option value={StockTransactionType.EXPIRED}>Expired Goods (Remove)</option>
                        <option value={StockTransactionType.ADJUSTMENT}>Manual Adjustment (Remove)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Absolute Quantity *</label>
                    <div className="relative">
                      <Input 
                        required
                        type="number" 
                        min="1"
                        step="1"
                        placeholder="0" 
                        className="bg-white pl-10" 
                        value={adjQuantity || ''}
                        onChange={e => setAdjQuantity(parseInt(e.target.value) || 0)}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {[StockTransactionType.RESTOCK, StockTransactionType.RETURN].includes(adjType) ? (
                          <PackagePlus className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <PackageMinus className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {[StockTransactionType.RESTOCK, StockTransactionType.RETURN].includes(adjType) 
                        ? `This will ADD ${adjQuantity || 0} units to inventory.` 
                        : `This will REMOVE ${adjQuantity || 0} units from inventory.`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Reason (Optional)</label>
                    <textarea 
                      className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Why is this stock being adjusted manually?"
                      value={adjReason}
                      onChange={e => setAdjReason(e.target.value)}
                    />
                  </div>

                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                  <Button type="submit" disabled={isSaving || adjQuantity <= 0} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirm Adjustment
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
