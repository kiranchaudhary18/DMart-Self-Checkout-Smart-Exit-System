"use client";

import * as React from "react";
import { SecuritySidebar } from "./SecuritySidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SecurityDashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu when screen size increases
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Desktop Sidebar */}
      <SecuritySidebar className="hidden md:flex fixed inset-y-0 z-40" />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-2">
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SecuritySidebar 
          className="w-full border-r-0" 
          onNavigate={() => setMobileMenuOpen(false)} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64 min-w-0">
        {/* Mobile Header (Desktop header can just be the page header) */}
        <header className="md:hidden flex h-16 items-center border-b bg-white px-4 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2" 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="font-bold text-lg ml-4 text-slate-800">
            DMart Security
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
