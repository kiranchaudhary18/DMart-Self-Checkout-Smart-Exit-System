"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  AlertTriangle,
  Clock,
  ShieldAlert,
  Loader2,
  RefreshCcw,
  FileSearch
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SecurityAlert } from "@/types/securityAlert";

export default function SecurityAlertsPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { getSecurityAlerts } = await import('@/lib/api/securityAlerts');
      const data = await getSecurityAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error("Failed to fetch alerts:", err);
      setError(err.message || "An unexpected error occurred while loading alerts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-600 text-white hover:bg-red-600 border-none">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">LOW</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center">
                  Security Alerts <ShieldAlert className="w-6 h-6 ml-3 text-red-500" />
                </h1>
                <p className="text-slate-500 text-sm mt-1">Review flagged suspicious activity and security events.</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={loadAlerts} disabled={isLoading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
              Refresh
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm min-h-[400px]">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-16 text-center space-y-4">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
                  <p className="text-slate-500 text-sm">Loading security alerts...</p>
                </div>
              ) : error ? (
                <div className="p-16 text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                  <h3 className="text-lg font-medium text-slate-900">Failed to load alerts</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={loadAlerts}>
                    <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSearch className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No Security Alerts</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    There are no open security alerts or suspicious activities detected.
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <th className="p-4 pl-6">Detected At</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Alert Type</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Reference</th>
                        <th className="p-4 pr-6 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 text-sm text-slate-700 whitespace-nowrap">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-slate-400" />
                              {new Date(alert.detectedAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            {getSeverityBadge(alert.severity)}
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-900">
                            {alert.type}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-slate-500">{alert.status}</Badge>
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-600">
                            {alert.orderReference || "-"}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}
