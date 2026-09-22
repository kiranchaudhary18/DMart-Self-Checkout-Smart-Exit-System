"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingCart, Bell, Menu, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cartService } from "@/lib/api/cart";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAuth();
  const userName = user?.name || "Customer";

  const [cartCount, setCartCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchCart = async () => {
      try {
        const cartData = await cartService.getCartSummary();
        if (mounted) {
          const count = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(count);
        }
      } catch (err) {
        // Silently fail in header, just show 0 or hide badge
        if (mounted) setCartCount(0);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCart();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-8">
      {/* Mobile Menu Toggle */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="md:hidden text-slate-500 h-9 w-9 p-0" 
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Welcome Message (Hidden on small mobile) */}
      <div className="hidden sm:flex flex-1 flex-col">
        <h2 className="text-sm font-semibold text-slate-800">Welcome, {userName}</h2>
        <p className="text-xs text-slate-500">Ready to shop?</p>
      </div>

      <div className="flex flex-1 items-center gap-4 justify-end md:justify-end">
        {/* Search Placeholder */}
        <div className="relative hidden lg:flex w-full max-w-sm items-center">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="w-full bg-slate-50 pl-9 rounded-full focus-visible:ring-primary-500 border-slate-200" 
          />
        </div>

        {/* Search Icon for Mobile */}
        <Button variant="ghost" size="sm" className="lg:hidden text-slate-500 h-9 w-9 p-0">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications Placeholder */}
        <Button variant="ghost" size="sm" className="relative text-slate-500 h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" />
        </Button>

        {/* Cart */}
        <Button variant="ghost" size="sm" className="relative text-slate-500 h-9 w-9 p-0">
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

        {/* Profile Avatar Placeholder */}
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 overflow-hidden">
          <User className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </header>
  );
}
