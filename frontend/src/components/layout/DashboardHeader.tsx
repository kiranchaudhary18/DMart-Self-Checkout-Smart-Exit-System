"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingCart, Bell, Menu, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  isOpen?: boolean;
}

export function DashboardHeader({ onMenuClick, isOpen = false }: DashboardHeaderProps) {
  const { user } = useAuth();
  const userName = user?.name || "Customer";

  const { cart, isLoading } = useCart();
  const cartCount = cart?.total_item_count || 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-8">
      {/* Mobile Menu Toggle */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="md:hidden text-slate-500 h-9 w-9 p-0" 
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Welcome Message (Hidden on small mobile) */}
      <div className="hidden sm:flex flex-1 flex-col">
        <h2 className="text-sm font-semibold text-slate-800">Welcome, {userName}</h2>
        <p className="text-xs text-slate-500">Ready to shop?</p>
      </div>

      <div className="flex flex-1 items-center gap-4 justify-end md:justify-end">

        {/* Cart */}
        <Link href="/customer/cart" passHref aria-label={`View cart, ${cartCount} items`}>
          <Button variant="ghost" size="sm" className="relative text-slate-500 h-9 w-9 p-0" tabIndex={-1}>
            <ShoppingCart className="h-5 w-5" />
            {!isLoading && cartCount !== null && cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
            {isLoading && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              </span>
            )}
          </Button>
        </Link>

        {/* Profile Avatar */}
        <Link href="/customer/profile" aria-label="View profile">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 overflow-hidden hover:border-primary-400 transition-colors">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-slate-500" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
