import { apiClient } from "./client";
import { LoyaltyBalance } from "@/types/dashboard";

export const loyaltyService = {
  /**
   * Fetch the current user's loyalty balance.
   * Maps to GET /api/loyalty/balance/
   */
  async getLoyaltyBalance(): Promise<LoyaltyBalance> {
    const response = await apiClient.get<LoyaltyBalance>("/loyalty/balance/");
    return response.data;
  },
};
