"use client";
import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block h-full flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <div 
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full min-w-0">
          <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} isOpen={isMobileMenuOpen} />
          
          <main className="flex-1 overflow-y-auto w-full relative">
            <div className="absolute inset-0">
              {children}
            </div>
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
