"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserProfile, UpdateProfileRequest } from "@/types/profile";
import { profileService } from "@/lib/api/profile";
import { removeTokens } from "@/lib/auth/token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Lock, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({
    name: "",
    phone: "",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditToggle = () => {
    if (!isEditing && profile) {
      setEditForm({
        name: profile.name,
        phone: profile.phone,
      });
      setSaveStatus(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      if (!editForm.name?.trim()) {
        setSaveStatus({ type: 'error', message: 'Name is required.' });
        setIsSaving(false);
        return;
      }

      const updated = await profileService.updateProfile(editForm);
      setProfile(updated);
      setSaveStatus({ type: 'success', message: 'Profile updated successfully.' });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update profile failed:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
        return;
      }
      setSaveStatus({ 
        type: 'error', 
        message: err.message || err.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER"]}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage your personal information and security.</p>
          </div>
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {saveStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
            saveStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
            <div>
              <h3 className="font-medium">{saveStatus.type === 'success' ? 'Success' : 'Error'}</h3>
              <p className="text-sm mt-0.5 opacity-90">{saveStatus.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Personal Information
              </h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditToggle}>Edit Profile</Button>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <Input 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <Input 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2 opacity-60">
                    <label className="text-sm font-medium text-slate-700">Email Address (Cannot be changed)</label>
                    <Input value={profile?.email || ""} disabled />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <Button type="button" variant="ghost" onClick={handleEditToggle} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Full Name</p>
                      <p className="font-medium text-slate-900">{profile?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Customer ID</p>
                      <p className="font-medium text-slate-900">{profile?.id}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><Mail className="h-4 w-4 text-slate-400" /></div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Email Address</p>
                        <p className="font-medium text-slate-900">{profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><Phone className="h-4 w-4 text-slate-400" /></div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Phone Number</p>
                        <p className="font-medium text-slate-900">{profile?.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                Security
              </h2>
            </div>
            <div className="p-6">
              <form className="space-y-4 max-w-md" onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const old_password = (form.elements.namedItem('old_password') as HTMLInputElement).value;
                const new_password = (form.elements.namedItem('new_password') as HTMLInputElement).value;
                const confirm_password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
                
                if (new_password !== confirm_password) {
                  setSaveStatus({ type: 'error', message: 'New passwords do not match.' });
                  return;
                }
                
                setIsSaving(true);
                setSaveStatus(null);
                try {
                  await profileService.changePassword({ old_password, new_password, confirm_password });
                  setSaveStatus({ type: 'success', message: 'Password updated successfully.' });
                  form.reset();
                } catch (err: any) {
                  const errorMsg = err.response?.data?.message || err.response?.data?.errors?.new_password?.[0] || err.response?.data?.errors?.old_password?.[0] || 'Failed to update password.';
                  setSaveStatus({ type: 'error', message: errorMsg });
                } finally {
                  setIsSaving(false);
                }
              }}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Password</label>
                  <Input name="old_password" type="password" required placeholder="••••••••" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <Input name="new_password" type="password" required placeholder="••••••••" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                  <Input name="confirm_password" type="password" required placeholder="••••••••" disabled={isSaving} />
                </div>
                <Button type="submit" variant="outline" className="mt-2" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
