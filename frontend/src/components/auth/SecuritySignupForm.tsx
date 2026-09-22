"use client";

import * as React from "react"
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useAuth } from "@/hooks/useAuth"

export function SecuritySignupForm() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [accessCode, setAccessCode] = React.useState("")
  
  const [showPassword, setShowPassword] = React.useState(false)
  
  // Hardcoded to false because backend doesn't support this securely yet
  const isLoading = false;
  const [error, setError] = React.useState<string | null>(null)
  
  const validate = () => {
    if (!name.trim()) return "Full Name is required"
    if (!email) return "Email is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address"
    if (!phone) return "Phone number is required"
    if (!/^\d{10,}$/.test(phone)) return "Please enter a valid phone number (min 10 digits)"
    
    const trimmedCode = accessCode.trim()
    if (!trimmedCode) return "Security Access Code is required"
    if (trimmedCode.length < 6) return "Security Access Code is too short (min 6 characters)"
    if (trimmedCode.length > 32) return "Security Access Code is too long (max 32 characters)"
    
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters long"
    if (password !== confirmPassword) return "Passwords do not match"
    
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

    // Explicitly block as per requirements because backend is missing the verification implementation
    setError("Security registration is currently unavailable. The backend system requires updates to securely validate the access code.")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700 mb-4 border border-blue-200">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Security access is restricted. Enter the access code provided personally by the administrator.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="accessCode" className="text-sm font-medium text-slate-700">
          Security Access Code
        </label>
        <Input
          id="accessCode"
          type="password"
          placeholder="Enter authorization code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="guard@dmart.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-slate-700">
          Phone Number
        </label>
        <Input
          id="phone"
          type="tel"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          disabled={isLoading}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full mt-2 bg-slate-800 hover:bg-slate-900 focus-visible:ring-slate-900" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying Access Code...
          </>
        ) : (
          "Register Security Account"
        )}
      </Button>
    </form>
  )
}
