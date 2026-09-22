export interface CreatePaymentRequest {
  order_number: string;
}

export interface PaymentDetails {
  id: number;
  razorpay_payment_id: string | null;
  razorpay_order_id: string;
  amount: string;
  currency: string;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export interface CreatePaymentResponse {
  order_number: string;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: string; // usually returned as string or decimal
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  status: string;
}

// Razorpay SDK Types
export interface RazorpayOptions {
  key: string;
  amount: string | number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler?: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}
