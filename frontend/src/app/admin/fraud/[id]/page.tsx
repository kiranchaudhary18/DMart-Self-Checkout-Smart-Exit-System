"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  ShieldAlert, 
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Server,
  Eye
} from "lucide-react";

import { 
  getAdminFraudEventDetail,
  updateAdminFraudEventStatus,
  FraudEvent 
} from "@/lib/api/adminFraud";

export default function AdminFraudDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<FraudEvent | null>(null);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminFraudEventDetail(id);
      setEvent(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load fraud event details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (newStatus: FraudEvent['status']) => {
    setIsSaving(true);
    setError(null);
    try {
      const data = await updateAdminFraudEventStatus(id, newStatus);
      setEvent(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update fraud event status.");
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-sm px-3 py-1">Critical</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-sm px-3 py-1">High</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-sm px-3 py-1">Medium</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-sm px-3 py-1">Low</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
        
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/fraud')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Fraud Event Details</h1>
            <p className="text-slate-500 text-sm mt-1">Review and resolve suspicious activity.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error</span>
              {error}
            </div>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <h3 className="text-lg font-medium text-slate-900">Loading details...</h3>
            </div>
          ) : !event ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2 text-red-600">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Event Not Found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                The requested fraud event details could not be retrieved from the backend.
              </p>
            </div>
          ) : (
            <div>
              {/* Loaded State Design */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityBadge(event.severity)}
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-white">{event.status}</Badge>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{event.activity_type.replace(/_/g, ' ')}</h2>
                </div>
                
                {/* Actions strictly bound to backend supported enums */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    disabled={isSaving || event.status === 'REVIEWED'}
                    onClick={() => handleUpdateStatus('REVIEWED')}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Mark Reviewed
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    disabled={isSaving || event.status === 'RESOLVED'}
                    onClick={() => handleUpdateStatus('RESOLVED')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    disabled={isSaving || event.status === 'FALSE_POSITIVE'}
                    onClick={() => handleUpdateStatus('FALSE_POSITIVE')}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> False Positive
                  </Button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-500" /> Event Information
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500">Event ID</span>
                        <span className="col-span-2 font-medium text-slate-900">#{event.id}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500">Reference</span>
                        <span className="col-span-2 font-mono text-slate-900">{event.order_reference || "--"}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500">Detected</span>
                        <span className="col-span-2 font-medium text-slate-900">{new Date(event.detected_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-red-500" /> Description
                    </h3>
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-100 text-sm text-slate-700">
                      {event.description || "No description provided by backend."}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                      <Server className="w-4 h-4 text-slate-500" /> Technical Context
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500">IP Address</span>
                        <span className="col-span-2 font-mono text-slate-900">{event.ip_address || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
