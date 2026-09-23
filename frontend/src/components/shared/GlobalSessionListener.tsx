"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

export function GlobalSessionListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { warning } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    const handleAuthExpired = () => {
      // Don't trigger on public routes like login or signup to prevent loops
      if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
        return;
      }
      
      // We clear state in useAuth manually here to ensure React context knows we logged out
      logout();
      
      warning("Your session has expired. Please log in again.", "Session Expired", { duration: 6000 });
      router.push("/login");
    };

    window.addEventListener("auth:expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth:expired", handleAuthExpired);
    };
  }, [router, pathname, warning, logout]);

  return null;
}
