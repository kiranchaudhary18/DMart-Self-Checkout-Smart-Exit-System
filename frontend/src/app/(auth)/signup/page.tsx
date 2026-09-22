"use client";

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SignupForm } from "@/components/auth/SignupForm"
import { SecuritySignupForm } from "@/components/auth/SecuritySignupForm"
import { Loader2 } from "lucide-react"

function SignupContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "customer";

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {role === "security" ? "Security Access" : "Create an account"}
        </h1>
        <p className="text-slate-500">
          {role === "security" 
            ? "Apply for security personnel credentials" 
            : "Join DMart for a seamless checkout experience"}
        </p>
      </div>

      <Card className="border-0 shadow-lg sm:border sm:shadow-card">
        <CardHeader className="space-y-4 pb-4">
          <AuthTabs
            activeTab={role as any}
            tabs={[
              { id: "customer", label: "Customer", href: "/signup?role=customer" },
              { id: "security", label: "Security", href: "/signup?role=security" },
            ]}
          />
        </CardHeader>
        <CardContent>
          {role === "security" ? <SecuritySignupForm /> : <SignupForm />}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Login
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>}>
      <SignupContent />
    </Suspense>
  )
}
