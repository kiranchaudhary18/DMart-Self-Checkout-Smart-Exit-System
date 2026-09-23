"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShieldAlert, 
  AlertCircle,
  Loader2,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

import { 
  getAdminFraudEvents, 
  FraudEvent 
} from "@/lib/api/adminFraud";

export default function AdminFraudPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminFraudEvents({
        page: currentPage,
        search: searchTerm,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        severity: severityFilter !== "ALL" ? severityFilter : undefined
      });
      setEvents(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load fraud events from server.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, severityFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadData]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Medium</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>;
      case "REVIEWED":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Reviewed</Badge>;
      case "RESOLVED":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Resolved</Badge>;
      case "FALSE_POSITIVE":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">False Positive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Fraud & Suspicious Activity</h1>
            <p className="text-slate-500 text-sm mt-1">Monitor invalid QR scans, token abuse, and payment mismatches.</p>
          </div>
        </div>



        <Card className="border-slate-200 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search by order ref or IP..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading events...</h3>
              </div>
            ) : error ? (
              <ErrorState 
                title="Error Loading Security Data" 
                message={error} 
                onRetry={loadData} 
              />
            ) : (
              <div className="w-full overflow-x-auto">
                {events.length === 0 ? (
                  <EmptyState 
                    icon={ShieldAlert}
                    title="No suspicious events found"
                    description={searchTerm ? "No records matched your search filters." : "The system has not logged any fraudulent or suspicious activity."}
                  />
                ) : (
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <th className="p-4 pl-6">Event</th>
                        <th className="p-4">Reference</th>
                        <th className="p-4">Date/Time</th>
                        <th className="p-4 text-center">Severity</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="font-medium text-slate-900">{event.activity_type.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-slate-500 mt-1">{event.ip_address || "Unknown IP"}</div>
                          </td>
                          <td className="p-4 font-mono text-slate-600">
                            {event.order_reference || "--"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {new Date(event.detected_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            {getSeverityBadge(event.severity)}
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(event.status)}
                          </td>
                          <td className="p-4 pr-6 text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8"
                              onClick={() => router.push(`/admin/fraud/${event.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
          
        </Card>
      </div>
    </AdminLayout>
  );
}
