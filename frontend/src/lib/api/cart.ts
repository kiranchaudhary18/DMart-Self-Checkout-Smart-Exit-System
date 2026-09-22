import { apiClient } from "./client";
import { CartSummary } from "@/types/dashboard";

export const cartService = {
  /**
   * Fetch the current user's active cart.
   * Maps to GET /api/cart/
   */
  async getCartSummary(): Promise<CartSummary> {
    const response = await apiClient.get<CartSummary>("/cart/");
    return response.data;
  },
};
