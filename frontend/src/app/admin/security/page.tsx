"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Shield, Key, Eye, EyeOff, AlertCircle, Loader2,
  Plus, Mail, Edit2, Send, CheckCircle2, Clock, Ban, Trash2
} from "lucide-react";

import { 
  getAdminSecurityStaff, 
  toggleAdminSecurityStaffStatus,
  AdminSecurityStaff,
  getSecurityAccessCodes,
  generateSecurityAccessCode,
  updateSecurityAccessCode,
  deleteSecurityAccessCode,
  sendSecurityAccessCodeEmail,
  SecurityAccessCode
} from "@/lib/api/adminSecurity";
import { useToast } from "@/hooks/useToast";

// Modal Components
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function AdminSecurityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"STAFF" | "ACCESS_CODE">("STAFF");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [staffList, setStaffList] = useState<AdminSecurityStaff[]>([]);
  const [accessCodes, setAccessCodes] = useState<SecurityAccessCode[]>([]);
  const [visibleCodes, setVisibleCodes] = useState<Record<number, boolean>>({});

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<SecurityAccessCode | null>(null);
  
  // Forms state
  const [newSecurityName, setNewSecurityName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "STAFF") {
        const data = await getAdminSecurityStaff({
          search: searchTerm,
          status: statusFilter !== "ALL" ? statusFilter : undefined
        });
        setStaffList(data.results || []);
      } else {
        const data = await getSecurityAccessCodes();
        setAccessCodes(data.results || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load security management data from server.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadData]);

  const handleToggleCodeVisibility = (id: number) => {
    setVisibleCodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleGenerateCode = async () => {
    if (!newSecurityName.trim()) {
      toastError("Security name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await generateSecurityAccessCode(newSecurityName);
      success("Access code generated successfully");
      setIsGenerateModalOpen(false);
      setNewSecurityName("");
      loadData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to generate access code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!selectedCode) return;
    if (!editEmail.trim() || !editEmail.includes('@')) {
      toastError("Valid email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSecurityAccessCode(selectedCode.id, { security_email: editEmail });
      success("Email updated successfully");
      setIsEmailModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to update email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCode) return;
    
    setIsSubmitting(true);
    try {
      await sendSecurityAccessCodeEmail(selectedCode.id);
      success("Code sent successfully.");
      setIsSendEmailModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to send email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateCode = async (code: SecurityAccessCode) => {
    if (!confirm(`Are you sure you want to ${code.is_active ? 'block' : 'unblock'} this access code?`)) return;
    setIsLoading(true);
    try {
      await updateSecurityAccessCode(code.id, { is_active: !code.is_active });
      success(`Code ${code.is_active ? 'blocked' : 'unblocked'} successfully.`);
      loadData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to update code status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!selectedCode) return;
    setIsSubmitting(true);
    try {
      await deleteSecurityAccessCode(selectedCode.id);
      success("Code deleted successfully.");
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to delete code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEmailModal = (code: SecurityAccessCode) => {
    setSelectedCode(code);
    setEditEmail(code.security_email || "");
    setIsEmailModalOpen(true);
  };

  const openSendEmailModal = (code: SecurityAccessCode) => {
    setSelectedCode(code);
    setIsSendEmailModalOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'UNUSED': return <Badge variant="outline" className="bg-slate-100 text-slate-700">UNUSED</Badge>;
      case 'USED': return <Badge variant="outline" className="bg-green-100 text-green-700">USED</Badge>;
      case 'INACTIVE': return <Badge variant="outline" className="bg-red-100 text-red-700">INACTIVE</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
              Access Codes
            </button>
          </div>

          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {activeTab === "STAFF" ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex-1" /> {/* Spacer */}
                  <Button onClick={() => setIsGenerateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Generate Access Code
                  </Button>
                </>
              )}
            </div>
          </div>

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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {staffList.map(staff => (
                        <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-medium text-slate-900">{staff.name}</td>
                          <td className="p-4 text-slate-600">{staff.email}</td>
                          <td className="p-4 text-slate-600">{staff.phone || "-"}</td>
                          <td className="p-4 text-center">
                            <Badge variant="outline" className={staff.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                              {staff.is_active ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="w-full">
                {accessCodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                      <Key className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No access codes generated yet.</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                      Click the button above to generate a new secure access code.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <th className="p-4 pl-6">Security Name</th>
                            <th className="p-4">Access Code</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4">Timeline</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {accessCodes.map(code => (
                            <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 font-medium text-slate-900">{code.security_name}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                                    {visibleCodes[code.id] ? (code.raw_code || code.masked_code) : "••••••••"}
                                  </span>
                                  <button onClick={() => handleToggleCodeVisibility(code.id)} className="text-slate-400 hover:text-slate-600">
                                    {visibleCodes[code.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600">{code.security_email || <span className="text-slate-400 italic">Not set</span>}</td>
                              <td className="p-4 text-center">{renderStatusBadge(code.status)}</td>
                              <td className="p-4 text-slate-500 text-xs space-y-1">
                                <div><span className="font-medium">Created:</span> {formatDate(code.created_at)}</div>
                                <div><span className="font-medium">Emailed:</span> {formatDate(code.email_sent_at)}</div>
                                {code.used_at && <div><span className="font-medium">Used:</span> {formatDate(code.used_at)}</div>}
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => openEmailModal(code)} className="gap-1">
                                  {code.security_email ? <><Edit2 className="w-3 h-3" /> Edit</> : <><Plus className="w-3 h-3" /> Email</>}
                                </Button>
                                {code.security_email && code.status === 'UNUSED' && code.is_active && (
                                  <Button variant="primary" size="sm" onClick={() => openSendEmailModal(code)} className="gap-1 bg-blue-600 hover:bg-blue-700">
                                    <Send className="w-3 h-3" /> Send
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleDeactivateCode(code)} className={`gap-1 ${code.is_active ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}>
                                  <Ban className="w-3 h-3" /> {code.is_active ? 'Block' : 'Unblock'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setSelectedCode(code); setIsDeleteModalOpen(true); }} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-3 h-3" /> Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden p-4 space-y-4">
                      {accessCodes.map(code => (
                        <div key={code.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900">{code.security_name}</h4>
                              <p className="text-sm text-slate-500">{code.security_email || "No email set"}</p>
                            </div>
                            {renderStatusBadge(code.status)}
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-md flex justify-between items-center overflow-hidden">
                            <span className="font-mono text-slate-700 font-medium break-all mr-2">
                              {visibleCodes[code.id] ? (code.raw_code || code.masked_code) : "••••••••"}
                            </span>
                            <button onClick={() => handleToggleCodeVisibility(code.id)} className="text-slate-500">
                              {visibleCodes[code.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <div><Clock className="w-3 h-3 inline mr-1"/> Created: {formatDate(code.created_at)}</div>
                            <div><Mail className="w-3 h-3 inline mr-1"/> Emailed: {formatDate(code.email_sent_at)}</div>
                            {code.used_at && <div className="col-span-2"><CheckCircle2 className="w-3 h-3 inline mr-1 text-green-500"/> Used: {formatDate(code.used_at)}</div>}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEmailModal(code)}>
                              {code.security_email ? "Edit Email" : "Add Email"}
                            </Button>
                            {code.security_email && code.status === 'UNUSED' && code.is_active && (
                              <Button variant="primary" size="sm" className="flex-1 bg-blue-600" onClick={() => openSendEmailModal(code)}>
                                Send Code
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className={`flex-1 ${code.is_active ? 'text-amber-600' : 'text-green-600'}`} onClick={() => handleDeactivateCode(code)}>
                              {code.is_active ? 'Block' : 'Unblock'}
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-red-600" onClick={() => { setSelectedCode(code); setIsDeleteModalOpen(true); }}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Generate Code Modal */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Access Code">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Security Name *</label>
            <Input 
              value={newSecurityName}
              onChange={(e) => setNewSecurityName(e.target.value)}
              placeholder="e.g. John Doe"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleGenerateCode} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate Code
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Add/Edit Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={selectedCode?.security_email ? "Edit Email" : "Add Email"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Security Personnel Email *</label>
            <Input 
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="security@example.com"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSaveEmail} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send Email Confirmation Modal */}
      <Modal isOpen={isSendEmailModalOpen} onClose={() => setIsSendEmailModalOpen(false)} title="Confirm Send Email">
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Send this security access code to <span className="font-semibold text-slate-900">{selectedCode?.security_email}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsSendEmailModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Code
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Are you sure you want to permanently delete the access code for <span className="font-semibold text-slate-900">{selectedCode?.security_name}</span>?
          </p>
          <p className="text-red-600">
            This action cannot be undone. If this code was already used by a security personnel, they will lose access.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleDeleteCode} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Code
            </Button>
          </div>
        </div>
      </Modal>

    </AdminLayout>
  );
}
