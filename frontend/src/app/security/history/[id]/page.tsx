"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldX,
  Loader2,
  RefreshCcw,
  User,
  Hash,
  Info
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { VerificationDetail } from "@/types/securityHistory";

export default function SecurityHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);

  const loadDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { getVerificationDetail } = await import('@/lib/api/securityHistory');
      const data = await getVerificationDetail(id);
      if (!data) {
        setError("Verification record not found or unavailable.");
      } else {
        setDetail(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch detail:", err);
      setError(err.message || "An unexpected error occurred while loading details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-sm"><CheckCircle2 className="w-4 h-4 mr-2" /> {status}</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 py-1 text-sm"><XCircle className="w-4 h-4 mr-2" /> Rejected</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 text-sm"><Clock className="w-4 h-4 mr-2" /> Expired</Badge>;
      case 'INVALID':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 py-1 text-sm"><ShieldX className="w-4 h-4 mr-2" /> Invalid</Badge>;
      case 'SUSPICIOUS':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 py-1 text-sm"><AlertTriangle className="w-4 h-4 mr-2" /> Suspicious</Badge>;
      case 'ALREADY_USED':
      case 'USED':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3 py-1 text-sm"><AlertTriangle className="w-4 h-4 mr-2" /> Used</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500 px-3 py-1 text-sm">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/security/history')}
              className="px-2 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Verification Detail</h1>
              <p className="text-slate-500 text-sm mt-1">{id}</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm min-h-[400px]">
            {isLoading ? (
              <div className="p-16 text-center space-y-4">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                <p className="text-slate-500 text-sm">Loading verification details...</p>
              </div>
            ) : error || !detail ? (
              <div className="p-16 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-lg font-medium text-slate-900">Failed to load details</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadDetail}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div>
            ) : (
              <>
                <CardHeader className="border-b border-slate-100 pb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-slate-900">Record Information</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">Comprehensive view of the exit event.</p>
                    </div>
                    <div>
                      {getStatusBadge(detail.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Core Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 flex items-center mb-2">
                          <Hash className="w-4 h-4 mr-2" /> Reference IDs
                        </h4>
                        <div className="bg-slate-50 rounded-md p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Verification ID:</span>
                            <span className="text-sm font-mono text-slate-900">{detail.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Order Ref:</span>
                            <span className="text-sm font-mono text-slate-900">{detail.orderNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-500 flex items-center mb-2">
                          <Clock className="w-4 h-4 mr-2" /> Timestamps
                        </h4>
                        <div className="bg-slate-50 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Event Time:</span>
                            <span className="text-sm text-slate-900">{new Date(detail.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 flex items-center mb-2">
                          <Info className="w-4 h-4 mr-2" /> Resolution
                        </h4>
                        <div className="bg-slate-50 rounded-md p-3 space-y-2">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-500 mb-1">Reason / Result:</span>
                            <span className="text-sm text-slate-900">{detail.reason || "Standard completion."}</span>
                          </div>
                          {detail.isFraudulent && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" /> Marked as Suspicious/Fraudulent
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-500 flex items-center mb-2">
                          <User className="w-4 h-4 mr-2" /> Operator
                        </h4>
                        <div className="bg-slate-50 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Verified By:</span>
                            <span className="text-sm text-slate-900">{detail.verifiedBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}
