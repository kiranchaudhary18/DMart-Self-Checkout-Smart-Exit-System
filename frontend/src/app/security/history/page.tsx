"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldX,
  FileSearch,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

// Define what the history record will look like when connected
export interface VerificationHistoryRecord {
  id: string;
  orderNumber: string;
  status: string; // 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'INVALID' | 'SUSPICIOUS' | 'ALREADY_USED'
  reason?: string;
  verifiedBy: string;
  timestamp: string;
}

export default function SecurityHistoryPage() {
  const router = useRouter();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Data State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<VerificationHistoryRecord[]>([]);

  // Fetch data
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { getVerificationHistory } = await import('@/lib/api/securityHistory');
      const data = await getVerificationHistory({ search: searchTerm, status: statusFilter });
      setRecords(data);
      setTotalPages(1); // Would be updated from backend pagination metadata if supported
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      setError(err.message || "An unexpected error occurred while loading history.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Debounce search input
    const delayDebounceFn = setTimeout(() => {
      loadHistory();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, currentPage]);

  // Stats (Unconnected - Backend doesn't support list-wide stats here yet, using derived)
  const stats = {
    total: records.length || "--",
    verified: records.filter(r => r.status === 'VERIFIED').length || "--",
    rejected: records.filter(r => r.status === 'REJECTED').length || "--",
    invalid: records.filter(r => ['INVALID', 'EXPIRED'].includes(r.status)).length || "--",
    suspicious: records.filter(r => r.status === 'SUSPICIOUS').length || "--"
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'INVALID':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><ShieldX className="w-3 h-3 mr-1" /> Invalid</Badge>;
      case 'SUSPICIOUS':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="w-3 h-3 mr-1" /> Suspicious</Badge>;
      case 'ALREADY_USED':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="w-3 h-3 mr-1" /> Used</Badge>;
      case 'PENDING':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500">{status}</Badge>;
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const navigateToDetail = (id: string) => {
    router.push(`/security/history/${id}`);
  };

  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/security/dashboard')}
              className="px-2 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Verification History</h1>
              <p className="text-slate-500 text-sm mt-1">Review all recent customer exit verification records.</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-slate-50 border-slate-100 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <p className="text-sm font-medium text-slate-500">Total Scans</p>
                <div className="text-2xl font-bold mt-1 text-slate-900">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <p className="text-sm font-medium text-green-700">Verified</p>
                <div className="text-2xl font-bold mt-1 text-green-900">{stats.verified}</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <p className="text-sm font-medium text-red-700">Rejected</p>
                <div className="text-2xl font-bold mt-1 text-red-900">{stats.rejected}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-100 border-slate-200 shadow-sm">
              <CardContent className="p-4 md:p-6">
                <p className="text-sm font-medium text-slate-700">Invalid / Expired</p>
                <div className="text-2xl font-bold mt-1 text-slate-900">{stats.invalid}</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100 shadow-sm col-span-2 md:col-span-1">
              <CardContent className="p-4 md:p-6">
                <p className="text-sm font-medium text-orange-700">Suspicious</p>
                <div className="text-2xl font-bold mt-1 text-orange-900">{stats.suspicious}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 shadow-sm">
            
            {/* Filters and Search */}
            <div className="p-4 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Search by Order ID or Reference..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select 
                    className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                    <option value="Invalid">Invalid</option>
                    <option value="Suspicious">Suspicious</option>
                    <option value="Already Used">Already Used</option>
                    <option value="Pending">Pending</option>
                  </select>
                  
                  <Button variant="outline" className="text-slate-600 bg-white" disabled>
                    <Calendar className="w-4 h-4 mr-2" />
                    Date Filter
                  </Button>
                </div>
              </div>
            </div>

            {/* List / Table Area */}
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center space-y-4 min-h-[300px] flex flex-col justify-center">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                  <p className="text-slate-500 text-sm">Loading verification history...</p>
                </div>
              ) : error ? (
                <ErrorState 
                  title="Failed to load history" 
                  message={error} 
                  onRetry={loadHistory} 
                  className="min-h-[300px]"
                />
              ) : records.length === 0 ? (
                <EmptyState 
                  icon={FileSearch}
                  title="No Records Found"
                  description={searchTerm || statusFilter !== "All" 
                    ? "There are no verification records matching your current filters."
                    : "No exit verification records have been created yet."}
                  actionLabel={(searchTerm || statusFilter !== "All") ? "Clear Filters" : undefined}
                  onAction={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                    setCurrentPage(1);
                  }}
                  className="min-h-[300px]"
                />
              ) : (
                <div className="w-full overflow-x-auto">
                  {/* Desktop Table */}
                  <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <th className="p-4 pl-6">Date & Time</th>
                        <th className="p-4">Reference ID</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Result / Reason</th>
                        <th className="p-4">Verified By</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigateToDetail(record.id)}>
                          <td className="p-4 pl-6 text-sm text-slate-700 whitespace-nowrap">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-700">
                            {record.orderNumber || record.id}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="p-4 text-sm text-slate-600 truncate max-w-[200px]">
                            {record.reason || "-"}
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {record.verifiedBy}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToDetail(record.id);
                              }}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="flex flex-col divide-y divide-slate-100 md:hidden">
                    {records.map((record) => (
                      <div key={record.id} className="p-4 space-y-3 active:bg-slate-50" onClick={() => navigateToDetail(record.id)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</p>
                            <p className="font-mono text-sm font-medium text-slate-900 mt-0.5">{record.orderNumber || record.id}</p>
                          </div>
                          {getStatusBadge(record.status)}
                        </div>
                        
                        {record.reason && (
                          <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                            {record.reason}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-sm pt-2">
                          <div className="text-slate-500">By: {record.verifiedBy}</div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-blue-600 px-2 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToDetail(record.id);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {records.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <div>Showing page {currentPage} of {totalPages}</div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage <= 1} onClick={handlePrevPage}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage >= totalPages} onClick={handleNextPage}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}
