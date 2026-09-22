"use client";

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  
  const { login, isLoading } = useAuth()
  const [error, setError] = React.useState<string | null>(null)
  
  const validate = () => {
    if (!email) return "Email is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address"
    if (!password) return "Password is required"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await login({ email, password })
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <Link 
            href="#" 
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
            tabIndex={-1} // Skip in normal form flow
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          disabled={isLoading}
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
          Remember me
        </label>
      </div>

      <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {/* Development Quick Login Helpers */}
      {process.env.NODE_ENV === "development" && (
        <div className="pt-6 mt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
            Development Quick Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-slate-50 hover:bg-slate-100"
              onClick={() => {
                setEmail("kiran.chaudhary.cg@gmail.com");
                setPassword("Test@123");
              }}
            >
              Kiran (Customer)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-slate-50 hover:bg-slate-100"
              onClick={() => {
                setEmail("customer@dmart.com");
                setPassword("Test@123");
              }}
            >
              Test Customer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
              onClick={() => {
                setEmail("security@dmart.com");
                setPassword("Test@123");
              }}
            >
              Security
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              onClick={() => {
                setEmail("admin@dmart.com");
                setPassword("Admin@123");
              }}
            >
              Admin
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Click a button to auto-fill credentials.
          </p>
        </div>
      )}
    </form>
  )
}
