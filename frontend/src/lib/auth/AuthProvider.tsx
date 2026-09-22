"use client";

import * as React from "react";
import { User, LoginRequest, LoginResponse } from "@/types/auth";
import { authService } from "@/lib/api/auth";
import { hasValidAuth, removeTokens } from "@/lib/auth/token";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fetchUser = React.useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to restore session", error);
      setUser(null);
      removeTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate session on mount
  React.useEffect(() => {
    if (hasValidAuth()) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === "ADMIN") router.push("/admin/dashboard");
      else if (response.user.role === "SECURITY") router.push("/security/dashboard");
      else router.push("/customer/dashboard");
      
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
