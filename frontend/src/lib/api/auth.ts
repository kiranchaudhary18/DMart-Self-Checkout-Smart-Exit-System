import { apiClient } from "./client";
import { setTokens, removeTokens } from "@/lib/auth/token";
import { 
  CustomerSignupRequest, 
  SecuritySignupRequest, 
  LoginRequest, 
  LoginResponse,
  User 
} from "@/types/auth";

export const authService = {
  /**
   * Register a new Customer.
   * Maps to POST /api/auth/register/
   */
  async registerCustomer(data: Omit<CustomerSignupRequest, "role">): Promise<User> {
    const payload: CustomerSignupRequest = {
      ...data,
      role: "CUSTOMER",
    };
    const response = await apiClient.post<User>("/auth/register/", payload);
    return response.data;
  },

  /**
   * Register a new Security Guard.
   * Maps to POST /api/auth/security/register/
   */
  async registerSecurity(data: Omit<SecuritySignupRequest, "role"> & { confirm_password?: string }): Promise<User> {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirm_password: data.confirm_password || data.password,
      access_code: data.access_code
    };
    const response = await apiClient.post<User>("/auth/security/register/", payload);
    return response.data;
  },

  /**
   * Unified Login for all roles.
   * Maps to POST /api/auth/login/
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login/", data);
    if (response.data.access && response.data.refresh) {
      setTokens({ access: response.data.access, refresh: response.data.refresh });
    }
    return response.data;
  },

  /**
   * Get the current authenticated user's profile.
   * Maps to GET /api/auth/me/
   * The interceptor automatically attaches the Authorization header.
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<any>("/auth/me/");
    // The backend wraps the user object in a 'data' property for this endpoint
    return response.data.data ? response.data.data : response.data;
  },

  /**
   * Log the user out by securely purging tokens.
   */
  logout(): void {
    removeTokens();
  }
};
