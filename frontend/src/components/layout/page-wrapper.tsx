import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageWrapperProps extends React.HTMLAttributes<HTMLElement> {}

export function PageWrapper({ className, children, ...props }: PageWrapperProps) {
  return (
    <main className={cn("flex min-h-screen flex-col pt-16 pb-12", className)} {...props}>
      {children}
    </main>
  )
}
