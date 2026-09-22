import { apiClient } from "./client";
import { Order } from "@/types/dashboard";

export const ordersService = {
  /**
   * Fetch the current user's order history.
   * Maps to GET /api/orders/
   */
  async getRecentOrders(): Promise<Order[]> {
    const response = await apiClient.get<any>("/orders/");
    // Handle DRF PageNumberPagination
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
  },
};
