import { apiClient } from "./client";
import { CreatePaymentRequest, CreatePaymentResponse, VerifyPaymentRequest, VerifyPaymentResponse, PaymentDetails } from "@/types/payment";

export const paymentService = {
  /**
   * Create a Razorpay Order
   * POST /api/payments/create/
   */
  async createRazorpayOrder(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const response = await apiClient.post<{ status: string; message: string; data: CreatePaymentResponse }>("/payments/create/", data);
    return response.data.data;
  },

  /**
   * Verify Razorpay Payment Signature
   * POST /api/payments/verify/
   */
  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    const response = await apiClient.post<{ status: string; message: string; data: VerifyPaymentResponse }>("/payments/verify/", data);
    return response.data.data;
  },

  /**
   * Fetch payment details for an order
   * GET /api/payments/<order_number>/
   */
  async getPaymentDetails(orderNumber: string): Promise<PaymentDetails> {
    const response = await apiClient.get<{ status: string; message: string; data: PaymentDetails }>(`/payments/${orderNumber}/`);
    return response.data.data;
  }
};
