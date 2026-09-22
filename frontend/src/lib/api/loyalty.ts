import { apiClient } from "./client";
import { LoyaltySummary, LoyaltyTransaction } from "@/types/loyalty";

export const loyaltyService = {
  /**
   * Fetch the current user's loyalty balance.
   * GET /api/loyalty/
   */
  async getLoyaltyBalance(): Promise<LoyaltySummary> {
    const response = await apiClient.get<{ status: string; message: string; data: LoyaltySummary }>("/loyalty/");
    return response.data.data;
  },

  /**
   * Fetch the current user's loyalty transactions.
   * GET /api/loyalty/transactions/
   */
  async getLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
    const response = await apiClient.get<{ status: string; message: string; data: LoyaltyTransaction[] }>("/loyalty/transactions/");
    return response.data.data;
  }
};
