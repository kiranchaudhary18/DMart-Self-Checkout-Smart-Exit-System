"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserProfile, UpdateProfileRequest } from "@/types/profile";
import { profileService } from "@/lib/api/profile";
import { removeTokens } from "@/lib/auth/token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Camera, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { handleApiError } from "@/lib/utils/errorHandler";

export default function AdminProfilePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({
    name: "",
    profile_picture: null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: toastError } = useToast();

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
        profile_picture: null,
      });
      setPreviewImage(profile.profile_picture || null);
    }
    setIsEditing(!isEditing);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditForm({ ...editForm, profile_picture: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (!editForm.name?.trim()) {
        toastError("Name is required.", "Validation Error");
        setIsSaving(false);
        return;
      }

      const updated = await profileService.updateProfile(editForm);
      setProfile(updated);
      await refreshUser(); // Update global auth context for DashboardHeader avatar
      success("Admin profile has been updated successfully.", "Profile Updated");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update profile failed:", err);
      if (err.status === 401 || err.response?.status === 401 || err.originalStatus === 401) {
        removeTokens();
        router.push('/login');
        return;
      }
      toastError(handleApiError(err), "Update Failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-full flex items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20 md:pb-8 h-full overflow-y-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage your administrator details.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Administrator Details
              </h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditToggle}>Edit Profile</Button>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-sm group">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-medium">Change</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isSaving} />
                      </label>
                    </div>
                    <div className="text-sm text-slate-500">
                      <p className="font-medium text-slate-700 mb-1">Profile Picture</p>
                      <p>Click the avatar to upload a new image. (Max 2MB)</p>
                    </div>
                  </div>
                  
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

                  <div className="space-y-2 opacity-60 pt-2">
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
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="h-24 w-24 shrink-0 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                      {profile?.profile_picture ? (
                        <img src={profile.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-6 mt-2">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Full Name</p>
                        <p className="font-medium text-slate-900">{profile?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Email Address</p>
                        <p className="font-medium text-slate-900">{profile?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Role</p>
                        <p className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block text-xs uppercase tracking-wider">{profile?.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
