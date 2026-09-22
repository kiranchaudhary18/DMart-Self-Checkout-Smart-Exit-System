"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  ScanBarcode, 
  PackageSearch, 
  ShoppingCart, 
  Clock, 
  Award, 
  QrCode, 
  User, 
  LogOut,
  Store,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
  { title: "Scan Product", href: "/customer/scan", icon: ScanBarcode },
  { title: "Products", href: "/customer/products", icon: PackageSearch },
  { title: "Cart", href: "/customer/cart", icon: ShoppingCart },
  { title: "Orders & History", href: "/customer/history", icon: Clock },
  { title: "Loyalty", href: "/customer/loyalty", icon: Star },
  { title: "Exit QR", href: "/customer/exit-qr", icon: QrCode },
  { title: "Profile", href: "/customer/profile", icon: User },
];

export function DashboardSidebar({ className, onNavigate }: { className?: string, onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className={cn("flex flex-col border-r bg-white w-64 min-h-screen", className)}>
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900 group">
          <div className="bg-primary-600 rounded-lg p-1.5 text-white group-hover:bg-primary-700 transition-colors">
            <Store className="h-5 w-5" />
          </div>
          <span className="tracking-tight text-primary-700">DMart</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" 
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
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-600" : "text-slate-400")} />
                {item.title}
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
