import { apiClient } from "./client";
import { CheckoutSummary, ApplyCouponRequest } from "@/types/checkout";

export const checkoutService = {
  /**
   * Fetch the rich checkout summary with pricing and GST
   * GET /api/cart/summary/
   */
  async getCheckoutSummary(): Promise<CheckoutSummary> {
    const response = await apiClient.get<CheckoutSummary>("/cart/summary/");
    return response.data;
  },

  /**
   * Apply a coupon code to the current cart
   * POST /api/coupons/apply/
   */
  async applyCoupon(data: ApplyCouponRequest): Promise<void> {
    await apiClient.post("/coupons/apply/", data);
  },

  /**
   * Remove the applied coupon from the current cart
   * POST /api/coupons/remove/
   */
  async removeCoupon(): Promise<void> {
    await apiClient.post("/coupons/remove/");
  },

  /**
   * Finalize the checkout by verifying stock and converting Cart to Order.
   * POST /api/orders/checkout/
   */
  async createOrder(): Promise<{ data: any, message: string }> {
    const response = await apiClient.post("/orders/checkout/");
    return response.data;
  }
};
