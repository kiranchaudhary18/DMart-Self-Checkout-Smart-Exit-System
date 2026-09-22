import { apiClient } from "./client";
import { Order } from "@/types/dashboard";

export const ordersService = {
  /**
   * Fetch the current user's order history.
   * Maps to GET /api/orders/
   */
  async getRecentOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>("/orders/");
    return response.data;
  },
};
