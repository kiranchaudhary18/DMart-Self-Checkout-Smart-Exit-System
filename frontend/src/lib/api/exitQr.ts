import { apiClient } from "./client";
import { ExitPassResponse, ExitPass } from "@/types/exit-qr";
import { ordersService } from "./orders";

export const exitQrService = {
  /**
   * Generates or fetches the exit QR for a specific order.
   * Maps to POST /api/exit_verification/generate/
   */
  async generateExitToken(orderNumber: string): Promise<ExitPass> {
    const response = await apiClient.post<any>("/exit-verification/generate/", {
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
   * Maps to GET /api/exit-verification/<order_number>/
   */
  async getExitTokenStatus(orderNumber: string): Promise<ExitPass> {
    const response = await apiClient.get<any>(`/exit-verification/${orderNumber}/`);
    
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
    async getAllEligibleExitPasses(): Promise<{ passes: ExitPass[], message?: string }> {
    try {
      const recentOrders = await ordersService.getRecentOrders();
      const paidOrders = recentOrders.filter(order => order.payment_status === "PAID");
      if (paidOrders.length === 0) return { passes: [], message: "No eligible paid orders found." };
      
      const passes: ExitPass[] = [];
      for (const order of paidOrders) {
        try {
          const statusPass = await this.getExitTokenStatus(order.order_number);
          if (statusPass.status === "ACTIVE") passes.push(statusPass);
        } catch (err: any) {
          if (err.response?.status === 404) {
             const newPass = await this.generateExitToken(order.order_number);
             passes.push(newPass);
          }
        }
      }
      
      if (passes.length === 0) return { passes: [], message: "All your paid orders have already been checked out." };
      return { passes };
    } catch (error: any) { throw error; }
  }
};
