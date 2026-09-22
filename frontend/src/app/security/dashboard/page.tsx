"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ScanBarcode, 
  History, 
  Bell, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { VerificationRecord, VerificationStatus } from "@/types/security";

export default function SecurityDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    totalScans: string | number;
    successful: string | number;
    rejected: string | number;
    suspicious: string | number;
  }>({
    totalScans: "--",
    successful: "--",
    rejected: "--",
    suspicious: "--"
  });

  const [recentActivity, setRecentActivity] = useState<VerificationRecord[] | null>(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    // Prevent duplicate requests
    if (isManualRefresh && isRefreshing) return;
    
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const { getSecurityDashboardStats, getRecentVerificationActivity } = await import('@/lib/api/security');
      
      const [statsData, activityData] = await Promise.all([
        getSecurityDashboardStats(),
        getRecentVerificationActivity()
      ]);

      if (statsData) {
        setStats({
          totalScans: statsData.total_scans_today,
          successful: statsData.successful_verifications,
          rejected: statsData.rejected_verifications,
          suspicious: statsData.suspicious_attempts
        });
      }
      
      if (activityData) {
        setRecentActivity(activityData);
      } else {
        setRecentActivity([]); // Or null to indicate unavailable
      }
    } catch (err: any) {
      setError("Failed to load dashboard data. Please try again.");
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Wrap to respect isMounted
    const initialFetch = async () => {
      await fetchDashboardData(false);
    };
    
    initialFetch();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Verified</Badge>;
      case 'REJECTED': return <Badge variant="error">Rejected</Badge>;
      case 'EXPIRED': return <Badge variant="outline" className="text-amber-600 border-amber-200">Expired</Badge>;
      case 'INVALID': return <Badge variant="default" className="bg-slate-200 text-slate-800 hover:bg-slate-300">Invalid QR</Badge>;
      case 'SUSPICIOUS': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Suspicious</Badge>;
      case 'PENDING': return <Badge variant="outline" className="text-slate-500">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'EXPIRED': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'INVALID': return <ShieldX className="w-4 h-4 text-slate-500" />;
      case 'SUSPICIOUS': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Dashboard</h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className={cn("px-2 text-slate-400 hover:text-slate-700", isRefreshing && "animate-spin")}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="sr-only">Refresh Dashboard</span>
                </Button>
              </div>
              <p className="text-slate-500 mt-1">
                Welcome back, <span className="font-medium text-slate-700">{user?.email || "Officer"}</span>.
                System time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
            <Button onClick={() => router.push('/security/scan')} className="bg-slate-800 hover:bg-slate-900 text-white shrink-0">
              <ScanBarcode className="w-4 h-4 mr-2" />
              Scan Exit QR
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-100 flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-red-700 hover:text-red-800 hover:bg-red-100">
                Retry
              </Button>
            </div>
          )}

          {/* Instructions Card */}
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Operational Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-1">
                <li>Ask the customer to present their Exit QR code from their mobile device.</li>
                <li>Tap <strong>Scan Exit QR</strong> to open the secure scanner.</li>
                <li>Verify the backend result on the screen. Do not accept screenshots without scanning.</li>
                <li>Allow exit <strong>only</strong> when the system shows a green <span className="font-bold">VERIFIED</span> status.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                  Total Scans Today
                  <ScanBarcode className="w-4 h-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-slate-900">
                  {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div> : stats.totalScans}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                  Successful
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div> : stats.successful}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                  Rejected
                  <ShieldX className="w-4 h-4 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded"></div> : stats.rejected}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-orange-100">
              <CardHeader className="p-4 pb-2 bg-orange-50/50 rounded-t-xl">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center justify-between">
                  Suspicious
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 bg-orange-50/50 rounded-b-xl border-t border-orange-100">
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <div className="h-8 w-16 bg-orange-100 animate-pulse rounded"></div> : stats.suspicious}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions */}
            <Card className="shadow-sm lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  onClick={() => router.push('/security/scan')}
                >
                  <span className="flex items-center gap-3 text-slate-700">
                    <ScanBarcode className="w-5 h-5 text-slate-500" />
                    Scan Exit QR
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  onClick={() => router.push('/security/history')}
                >
                  <span className="flex items-center gap-3 text-slate-700">
                    <History className="w-5 h-5 text-slate-500" />
                    Verification History
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  onClick={() => router.push('/security/alerts')}
                >
                  <span className="flex items-center gap-3 text-slate-700">
                    <Bell className="w-5 h-5 text-slate-500" />
                    Security Alerts
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity Table */}
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Verification Activity</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Latest exit gate scans</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex text-slate-500"
                  onClick={() => router.push('/security/history')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="w-24 h-4 bg-slate-100 animate-pulse rounded"></div>
                            <div className="w-16 h-3 bg-slate-50 animate-pulse rounded"></div>
                          </div>
                        </div>
                        <div className="w-20 h-6 bg-slate-100 animate-pulse rounded-full"></div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity === null ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50 mt-2">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium text-sm">Activity Unavailable</p>
                    <p className="text-slate-400 text-xs mt-1">Recent verification data is currently not available.</p>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50 mt-2">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium text-sm">No recent activity</p>
                    <p className="text-slate-400 text-xs mt-1">Verification records will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentActivity.map((record) => (
                      <div key={record.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                            {getStatusIcon(record.status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Order <span className="font-mono text-xs">{record.order_number || "N/A"}</span>
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString() : "--"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {getStatusBadge(record.status)}
                          {record.result && (
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{record.result}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 sm:hidden">
                  <Button 
                    variant="outline" 
                    className="w-full text-xs" 
                    onClick={() => router.push('/security/history')}
                  >
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}
