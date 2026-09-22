"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function SecurityProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <Card className="text-center py-16 shadow-sm border-dashed">
            <CardHeader>
              <div className="mx-auto bg-slate-100 p-4 rounded-full mb-4">
                <User className="w-12 h-12 text-slate-400" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Security Profile</CardTitle>
              <p className="text-base mt-2 text-slate-500">
                This feature is planned for a future update.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 max-w-md mx-auto">
                Soon, you will be able to manage your security personnel profile, adjust notification settings, and review your shift activity here.
              </p>
            </CardContent>
          </Card>
        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}
