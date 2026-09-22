import * as React from "react"
import { APP_NAME } from "@/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Subtle Header / Branding */}
      <header className="flex h-16 items-center px-4 sm:px-8 bg-white border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          {/* Placeholder Logo Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white font-bold">
            D
          </div>
          <span className="text-xl font-bold tracking-tight text-primary-700">
            {APP_NAME}
          </span>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  )
}
