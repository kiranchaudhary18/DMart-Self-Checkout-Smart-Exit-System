"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { Store, ShieldCheck } from "lucide-react";
import { PageWrapper } from "@/components/layout/page-wrapper";

export default function AdminLoginPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already authenticated and is an ADMIN, redirect to dashboard
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        // Technically they shouldn't be here if they have another role,
        // but we'll let the role protection bounce them, or we can just redirect to their respective dashboards.
        if (user.role === "CUSTOMER") router.replace("/customer/dashboard");
        if (user.role === "SECURITY") router.replace("/security/dashboard");
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Avoid rendering login form briefly if we're going to redirect anyway
  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <Store className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 shadow-xl mb-6">
              <Store className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              DMart Admin
            </h1>
            <p className="text-slate-500 mt-2">
              Secure control panel access
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Authorized Personnel Only
              </span>
            </div>
            
            <AdminLoginForm />
          </div>
          
          {/* Footer Text */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>Protected by industry standard encryption.</p>
            <p className="mt-1">&copy; {new Date().getFullYear()} DMart Systems</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
