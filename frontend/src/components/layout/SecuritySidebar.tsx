"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  ScanBarcode, 
  History, 
  Bell, 
  User, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/security/dashboard", icon: LayoutDashboard },
  { title: "Scan Exit QR", href: "/security/scan", icon: ScanBarcode },
  { title: "Verification History", href: "/security/history", icon: History },
  { title: "Alerts", href: "/security/alerts", icon: Bell },
  { title: "Profile", href: "/security/profile", icon: User },
];

export function SecuritySidebar({ className, onNavigate }: { className?: string, onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className={cn("flex flex-col border-r bg-white w-64 min-h-screen shadow-sm", className)}>
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <Link href="/security/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900 group">
          <div className="bg-slate-800 rounded-lg p-1.5 text-white group-hover:bg-slate-900 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="tracking-tight text-slate-800">DMart <span className="text-primary-600">Security</span></span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/security/dashboard" 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                <span className="flex-1">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4 text-slate-400 group-hover:text-red-600" />
          Logout
        </Button>
      </div>
    </div>
  );
}
