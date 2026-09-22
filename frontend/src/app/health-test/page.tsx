"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Container } from "@/components/layout/container";

export default function HealthTestPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [data, setData] = useState<any>(null);

  const testConnection = async () => {
    setStatus("loading");
    try {
      const response = await apiClient.get("/health/");
      setData(response.data);
      setStatus("success");
    } catch (error: any) {
      setData(error);
      setStatus("error");
    }
  };

  return (
    <PageWrapper>
      <Container className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Backend Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              This is a development-only page to verify that the Next.js frontend can communicate with the Django backend.
            </p>
            <Button 
              onClick={testConnection} 
              disabled={status === "loading"}
              variant={status === "error" ? "danger" : "primary"}
            >
              {status === "loading" ? "Testing..." : "Ping Backend /api/health/"}
            </Button>
            
            {status !== "idle" && (
              <div className="mt-4 rounded-md bg-slate-900 p-4 text-sm text-green-400 overflow-auto">
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </PageWrapper>
  );
}
