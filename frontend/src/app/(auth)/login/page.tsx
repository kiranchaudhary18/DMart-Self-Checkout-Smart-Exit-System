"use client";

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-slate-500">Sign in to your account to continue</p>
      </div>

      <Card className="border-0 shadow-lg sm:border sm:shadow-card">
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
          Create account
        </Link>
      </p>
    </div>
  )
}
