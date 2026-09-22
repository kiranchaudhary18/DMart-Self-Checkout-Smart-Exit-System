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
   * Maps to POST /api/auth/register/
   * 
   * // TODO: Backend support required.
   * Currently, the backend /api/auth/register/ endpoint does not validate or accept an 
   * 'access_code' field. This function passes the role and code, but backend changes 
   * are required to securely validate the access_code before creating the SECURITY role.
   */
  async registerSecurity(data: Omit<SecuritySignupRequest, "role">): Promise<User> {
    const payload: SecuritySignupRequest = {
      ...data,
      role: "SECURITY",
    };
    const response = await apiClient.post<User>("/auth/register/", payload);
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
    const response = await apiClient.get<User>("/auth/me/");
    return response.data;
  },

  /**
   * Log the user out by securely purging tokens.
   */
  logout(): void {
    removeTokens();
  }
};
