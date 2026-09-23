"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ShoppingCart, 
  Users, 
  Tag, 
  Gift, 
  ShieldCheck, 
  BarChart3, 
  AlertTriangle,
  UserCircle,
  LogOut,
  Store
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className = '', onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Inventory', href: '/admin/inventory', icon: Layers },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Loyalty', href: '/admin/loyalty', icon: Gift },
    { label: 'Security', href: '/admin/security', icon: ShieldCheck },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Fraud Alerts', href: '/admin/fraud', icon: AlertTriangle, destructive: true },
  ];

  return (
    <aside className={`flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800 ${className}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight" onClick={onNavigate}>
          <Store className="w-6 h-6 text-blue-500" />
          <span>DMart <span className="text-blue-500">Admin</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? item.destructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-600 text-white' 
                  : item.destructive ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 mb-4 px-2">
          <UserCircle className="w-8 h-8 text-slate-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || 'admin@dmart.com'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-slate-300 border-slate-700 bg-transparent hover:bg-slate-800 hover:text-white" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
