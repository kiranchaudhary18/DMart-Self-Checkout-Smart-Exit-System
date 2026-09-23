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
  Shield, 
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";

import { 
  getAdminSecurityStaff, 
  toggleAdminSecurityStaffStatus,
  getAdminSecurityAccessCode,
  AdminSecurityStaff 
} from "@/lib/api/adminSecurity";

export default function AdminSecurityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"STAFF" | "ACCESS_CODE">("STAFF");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [staffList, setStaffList] = useState<AdminSecurityStaff[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [isAccessCodeVisible, setIsAccessCodeVisible] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "STAFF") {
        const data = await getAdminSecurityStaff({
          page: currentPage,
          search: searchTerm,
          status: statusFilter !== "ALL" ? statusFilter : undefined
        });
        setStaffList(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
      } else {
        const data = await getAdminSecurityAccessCode();
        setAccessCode(data.code);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load security management data from server.");
      setStaffList([]);
      setAccessCode(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadData]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setIsAccessCodeVisible(false); // Re-hide code for security
  }, [activeTab]);

  const handleToggleStatus = async (staff: AdminSecurityStaff) => {
    try {
      // In a real implementation this would wait for the API
      await toggleAdminSecurityStaffStatus(staff.id, !staff.is_active);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update staff status.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Security Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage store security personnel and access codes.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block mb-1">Error Loading Security Data</span>
              {error}
            </div>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button 
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "STAFF" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setActiveTab("STAFF")}
            >
              Security Personnel
            </button>
            <button 
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "ACCESS_CODE" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
              onClick={() => setActiveTab("ACCESS_CODE")}
            >
              Access Code
            </button>
          </div>

          {activeTab === "STAFF" && (
            <div className="p-4 border-b border-slate-100 bg-white space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Search personnel by name or email..." 
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
                    <option value="ALL">All Accounts</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="w-full bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-slate-900">Loading {activeTab.toLowerCase()}...</h3>
              </div>
            ) : activeTab === "STAFF" ? (
              <div className="w-full overflow-x-auto">
                {staffList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                      <Shield className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No security personnel found</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                      {searchTerm ? "No records matched your search." : "No users are currently assigned the SECURITY role."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <th className="p-4 pl-6">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {/* Empty for now, API handles this state */}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] p-6 max-w-lg mx-auto text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                  <Key className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Security Access Code</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    This code is required by security personnel to register for an account. Keep it strictly confidential.
                  </p>
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-3 w-full">
                    <div className="flex-1 bg-white border border-slate-200 rounded-md h-12 flex items-center justify-center text-lg font-mono font-bold tracking-widest text-slate-800">
                      {accessCode ? (isAccessCodeVisible ? accessCode : "••••••••") : "--"}
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-12 w-12 p-0 shrink-0" 
                      onClick={() => setIsAccessCodeVisible(!isAccessCodeVisible)}
                      disabled={!accessCode && !error} // Keep disabled if there's no code but no error, though error state handles rendering differently
                    >
                      {isAccessCodeVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full">
                    Generate New Code
                  </Button>
                  <p className="text-xs text-slate-400">
                    Generating a new code will instantly invalidate the old one for future signups.
                  </p>
                </div>
              </div>
            )}
          </div>
          
        </Card>
      </div>
    </AdminLayout>
  );
}
