"use client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Container } from "@/components/layout/container";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["SECURITY"]}>
      <PageWrapper>
        <Container>
          <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold">/security/alerts</h1>
            <p className="text-slate-500 mt-2">Placeholder for SECURITY route.</p>
          </div>
        </Container>
      </PageWrapper>
    </ProtectedRoute>
  );
}
