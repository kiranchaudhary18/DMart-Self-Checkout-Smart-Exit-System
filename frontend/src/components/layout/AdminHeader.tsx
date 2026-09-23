"use client";
import React from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

interface AdminHeaderProps {
  onMenuClick: () => void;
  isOpen?: boolean;
}

export function AdminHeader({ onMenuClick, isOpen = false }: AdminHeaderProps) {
  const pathname = usePathname();

  // Helper to get a nice title based on route
  const getPageTitle = () => {
    if (pathname.includes('/admin/products')) return 'Products Management';
    if (pathname.includes('/admin/inventory')) return 'Inventory Control';
    if (pathname.includes('/admin/orders')) return 'Order History';
    if (pathname.includes('/admin/customers')) return 'Customer Directory';
    if (pathname.includes('/admin/coupons')) return 'Coupons & Promos';
    if (pathname.includes('/admin/loyalty')) return 'Loyalty Program';
    if (pathname.includes('/admin/security')) return 'Security Settings';
    if (pathname.includes('/admin/analytics')) return 'Analytics & Reports';
    if (pathname.includes('/admin/fraud')) return 'Fraud Alerts';
    return 'Admin Dashboard';
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden p-1 -ml-2 text-slate-500 hover:text-slate-900"
          onClick={onMenuClick}
          aria-label="Toggle admin menu"
          aria-expanded={isOpen}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="text-lg md:text-xl font-semibold text-slate-800">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="w-9 h-9 p-0 text-slate-500 rounded-full hover:bg-slate-100" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 ml-2">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
