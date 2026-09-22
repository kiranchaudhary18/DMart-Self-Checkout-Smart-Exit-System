"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useRazorpay } from "@/hooks/useRazorpay";
import { paymentService } from "@/lib/api/payment";
import { RazorpayOptions, RazorpayResponse } from "@/types/payment";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.order_number as string;
  const { user } = useAuth();
  const { isLoaded: isRazorpayLoaded } = useRazorpay();

  const [paymentState, setPaymentState] = useState<"IDLE" | "INITIALIZING" | "PROCESSING" | "VERIFYING" | "SUCCESS" | "FAILED">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);

  // Define handler as a ref or callback to avoid stale closures if needed
  const handleRazorpayResponse = async (response: RazorpayResponse) => {
    setPaymentState("VERIFYING");
    setErrorMessage(null);
    try {
      await paymentService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
      setPaymentState("SUCCESS");
      
      // Navigate to success receipt flow
      router.push(`/customer/payment/success?order_number=${orderNumber}`);
      
    } catch (err: any) {
      console.error("Verification failed:", err);
      setPaymentState("FAILED");
      const msg = err.response?.data?.message || "Payment verification is pending or could not be completed.";
      router.push(`/customer/payment/failed?reason=${encodeURIComponent(msg)}`);
    }
  };

  const handlePay = async () => {
    if (!isRazorpayLoaded) {
      setErrorMessage("Payment gateway is still loading. Please wait a moment.");
      return;
    }

    setPaymentState("INITIALIZING");
    setErrorMessage(null);

    try {
      // 1. Create Order on Backend
      const rzpData = await paymentService.createRazorpayOrder({ order_number: orderNumber });
      setAmount(rzpData.amount);
      
      // 2. Open Razorpay Widget
      const options: RazorpayOptions = {
        key: rzpData.razorpay_key_id,
        amount: rzpData.amount, // amount in paisa
        currency: rzpData.currency,
        name: "DMart",
        description: `Order ${orderNumber}`,
        order_id: rzpData.razorpay_order_id,
        handler: handleRazorpayResponse,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#0f172a", // slate-900
        },
        modal: {
          ondismiss: () => {
            setPaymentState("IDLE");
            const msg = "Payment was cancelled. Your cart is still available.";
            router.push(`/customer/payment/failed?reason=${encodeURIComponent(msg)}`);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setPaymentState("FAILED");
        const msg = response.error.description || "Payment was not completed.";
        router.push(`/customer/payment/failed?reason=${encodeURIComponent(msg)}`);
      });

      rzp.open();
      setPaymentState("PROCESSING");

    } catch (err: any) {
      console.error("Failed to initialize payment:", err);
      setPaymentState("FAILED");
      setErrorMessage(err.response?.data?.message || "Could not connect to payment gateway. Please try again.");
    }
  };

  const renderContent = () => {
    if (paymentState === "SUCCESS") {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-500 mb-6">Your order has been confirmed.</p>
          <div className="flex gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-sm text-slate-500">Redirecting to receipt...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md mx-auto w-full text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Payment</h2>
        <p className="text-slate-500 mb-8">Order #{orderNumber}</p>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <Button 
          className="w-full h-14 text-lg font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          onClick={handlePay}
          disabled={!isRazorpayLoaded || paymentState === "INITIALIZING" || paymentState === "PROCESSING" || paymentState === "VERIFYING"}
        >
          {paymentState === "INITIALIZING" && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing...</>}
          {paymentState === "PROCESSING" && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Waiting for payment...</>}
          {paymentState === "VERIFYING" && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying payment...</>}
          {paymentState === "IDLE" || paymentState === "FAILED" ? "Pay Now" : ""}
        </Button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Secured by Razorpay</span>
        </div>
        
        {(paymentState === "IDLE" || paymentState === "FAILED") && (
          <div className="mt-8">
             <Button variant="ghost" onClick={() => router.push('/customer/checkout')}>
                Back to Checkout
             </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        {renderContent()}
      </div>
    </ProtectedRoute>
  );
}
