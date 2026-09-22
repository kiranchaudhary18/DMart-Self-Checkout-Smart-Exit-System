export type UserRole = "CUSTOMER" | "SECURITY" | "ADMIN";

export interface User {
  id: number;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  name?: string; // Optional depending on how the backend handles names
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BaseSignupRequest {
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  name?: string;
}

export interface CustomerSignupRequest extends BaseSignupRequest {
  role: "CUSTOMER";
}

export interface SecuritySignupRequest extends BaseSignupRequest {
  role: "SECURITY";
  access_code: string; // Will be passed here, even if backend ignores it for now
}
