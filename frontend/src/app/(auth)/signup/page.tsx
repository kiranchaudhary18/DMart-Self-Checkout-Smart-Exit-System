"use client";

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AuthTabs } from "@/components/auth/AuthTabs"
import { SignupForm } from "@/components/auth/SignupForm"

export default function SignupPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
        <p className="text-slate-500">Join DMart for a seamless checkout experience</p>
      </div>

      <Card className="border-0 shadow-lg sm:border sm:shadow-card">
        <CardHeader className="space-y-4 pb-4">
          <AuthTabs
            activeTab="customer"
            tabs={[
              { id: "customer", label: "Customer", href: "/signup" },
              { id: "security", label: "Security", href: "/security/signup" },
            ]}
          />
        </CardHeader>
        <CardContent>
          <SignupForm />
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
