import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'primary';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-slate-100 text-slate-900",
    primary: "border-transparent bg-primary-100 text-primary-800",
    success: "border-transparent bg-green-100 text-green-800",
    warning: "border-transparent bg-amber-100 text-amber-800",
    error: "border-transparent bg-red-100 text-red-800",
    outline: "text-foreground",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />
  )
}
export { Badge }
