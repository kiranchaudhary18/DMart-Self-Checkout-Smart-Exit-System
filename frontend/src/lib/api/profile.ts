import { apiClient } from "./client";
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from "@/types/profile";

export const profileService = {
  /**
   * Fetch current user's profile
   * GET /api/accounts/me/
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<any>("/auth/me/");
    // Support unwrapping if the backend wraps in `data` (which it does via get_success_response)
    return response.data.data ? response.data.data : response.data;
  },

  /**
   * Update current user's profile
   * PUT /api/auth/me/
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    let payload: any = data;
    let config: any = {};

    // If profile_picture is specifically present (even if null to clear it) or if it's a File
    if (data.profile_picture !== undefined) {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.phone) formData.append("phone", data.phone);
      
      if (data.profile_picture) {
        formData.append("profile_picture", data.profile_picture);
      }
      
      payload = formData;
      config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
    }

    // Use PATCH for partial updates to avoid DRF validation errors for missing fields
    const response = await apiClient.patch<any>("/auth/me/", payload, config);
    return response.data.data ? response.data.data : response.data;
  },

  /**
   * Change user password
   * POST /api/auth/change-password/
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ status: string; message: string }> {
    const response = await apiClient.post<{ status: string; message: string }>("/auth/change-password/", data);
    return response.data;
  }
};
