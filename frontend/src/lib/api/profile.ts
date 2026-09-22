import { apiClient } from "./client";
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from "@/types/profile";

export const profileService = {
  /**
   * Fetch current user's profile
   * GET /api/accounts/me/
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{ status: string; message: string; data: UserProfile }>("/accounts/me/");
    return response.data.data;
  },

  /**
   * Update current user's profile
   * PUT /api/accounts/me/
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put<{ status: string; message: string; data: UserProfile }>("/accounts/me/", data);
    return response.data.data;
  },

  /**
   * Change user password
   * POST /api/accounts/change-password/
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ status: string; message: string }> {
    const response = await apiClient.post<{ status: string; message: string }>("/accounts/change-password/", data);
    return response.data;
  }
};
