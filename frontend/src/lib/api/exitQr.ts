import { apiClient } from "./client";
import { ExitPassResponse, ExitPass } from "@/types/exit-qr";
import { ordersService } from "./orders";

export const exitQrService = {
  /**
   * Generates or fetches the exit QR for a specific order.
   * Maps to POST /api/exit_verification/generate/
   */
  async generateExitToken(orderNumber: string): Promise<ExitPass> {
    const response = await apiClient.post<any>("/exit_verification/generate/", {
      order_number: orderNumber
    });
    
    // Map backend response to our ExitPass type
    const data = response.data.data;
    
    return {
      id: data.token_reference,
      order_number: data.order_number,
      status: "ACTIVE", // Freshly generated is ACTIVE
      qr_data: data.qr_data || "", 
      created_at: new Date().toISOString(),
      expires_at: data.expires_at,
    };
  },

  /**
   * Fetches the current status of an exit token for a specific order.
   * Maps to GET /api/exit_verification/<order_number>/
   */
  async getExitTokenStatus(orderNumber: string): Promise<ExitPass> {
    const response = await apiClient.get<any>(`/exit_verification/${orderNumber}/`);
    
    const data = response.data.data;
    
    return {
      id: data.token_reference,
      order_number: data.order_number,
      status: data.status,
      qr_data: "", // Status endpoint does not return qr_data
      created_at: new Date().toISOString(), // Fallback
      expires_at: data.expires_at,
    };
  },

  /**
   * Helper to find the latest eligible paid order and get its QR.
   * This bridges the gap when the user directly visits /exit-qr.
   */
  async getLatestEligibleExitPass(): Promise<ExitPassResponse> {
    try {
      // 1. Fetch recent orders
      const recentOrders = await ordersService.getRecentOrders();
      
      // 2. Find the most recent PAID order
      // Assuming orders are sorted newest first.
      const latestPaidOrder = recentOrders.find(
        (order) => order.payment_status === "PAID"
      );

      if (!latestPaidOrder) {
        return { pass: null, message: "No eligible paid orders found." };
      }

      // 3. Try to get its token status first
      try {
        const statusPass = await this.getExitTokenStatus(latestPaidOrder.order_number);
        
        // If it's active but we don't have the QR data here (since status doesn't return it),
        // we might try to call generate again. However, backend won't return qr_data on subsequent generates.
        // For this frontend assignment, we will rely on localStorage to persist the QR data across refreshes,
        // or just accept that if they refresh, the backend requires them to have saved it.
        // Let's attempt to generate to get the token if possible.
        
        if (statusPass.status === "ACTIVE") {
           // We have an active token. We can't fetch the QR string again from the API if it's already generated.
           // We'll return it, but the UI might need to handle empty qr_data if it was lost from memory.
           return { pass: statusPass };
        }
        
        return { pass: statusPass };
      } catch (err: any) {
        // If 404 (no token found), we should generate a new one.
        if (err.response?.status === 404) {
           const newPass = await this.generateExitToken(latestPaidOrder.order_number);
           return { pass: newPass };
        }
        throw err;
      }

    } catch (error: any) {
      throw error;
    }
  }
};
