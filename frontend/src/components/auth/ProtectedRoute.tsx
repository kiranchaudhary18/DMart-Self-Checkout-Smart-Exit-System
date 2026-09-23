"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (pathname.startsWith('/admin')) {
        router.push('/admin/login');
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="mt-4 text-sm text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-xl border shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">403 Forbidden</h2>
          <p className="text-slate-500">
            You do not have permission to access this page. This area is restricted to {allowedRoles.join(" or ")} accounts.
          </p>
          <Button 
            onClick={() => {
              if (pathname.startsWith('/admin')) {
                router.push("/admin/login");
              } else {
                router.push("/login");
              }
            }} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
