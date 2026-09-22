import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type TabType = "customer" | "security" | "admin"

export interface AuthTabItem {
  id: TabType;
  label: string;
  href: string;
}

interface AuthTabsProps {
  activeTab: TabType;
  tabs: AuthTabItem[];
  className?: string;
}

export function AuthTabs({ activeTab, tabs, className }: AuthTabsProps) {
  return (
    <div className={cn("flex space-x-1 rounded-lg bg-slate-100 p-1", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
