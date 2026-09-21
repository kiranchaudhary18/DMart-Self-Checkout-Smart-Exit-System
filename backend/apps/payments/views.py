from rest_framework import views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings
import logging

from apps.cart.views import IsCustomer
from apps.accounts.views import get_success_response, get_error_response
from apps.orders.models import Order
from .models import Payment
from .services import PaymentService
from .serializers import (
    PaymentSerializer, 
    CreatePaymentRequestSerializer,
    VerifyPaymentRequestSerializer
)
from apps.loyalty.services import LoyaltyService

logger = logging.getLogger(__name__)

class CreateRazorpayOrderView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = CreatePaymentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Invalid data.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        order_number = serializer.validated_data['order_number']
        order = get_object_or_404(Order, order_number=order_number, customer=request.user)
        
        if order.payment_status != Order.PaymentStatus.PENDING:
            return Response(get_error_response(f"Order payment status is {order.payment_status}, cannot create payment."), status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Check if an active payment record already exists
            payment = getattr(order, 'payment', None)
            
            if payment and payment.razorpay_order_id and payment.status in [Payment.PaymentStatus.CREATED, Payment.PaymentStatus.PENDING]:
                # Reuse existing Razorpay order
                return Response(get_success_response("Existing payment retrieved.", {
                    "order_number": order.order_number,
                    "razorpay_order_id": payment.razorpay_order_id,
                    "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                    "amount": payment.amount,
                    "currency": payment.currency
                }))
                
            # Need to create a new Razorpay order
            try:
                # The amount is exclusively from Order.total_amount
                amount = order.total_amount
                currency = 'INR'
                
                razorpay_order = PaymentService.create_razorpay_order(
                    amount=amount, 
                    currency=currency,
                    receipt=order.order_number
                )
                
                if payment:
                    payment.razorpay_order_id = razorpay_order['id']
                    payment.amount = amount
                    payment.status = Payment.PaymentStatus.PENDING
                    payment.save()
                else:
                    payment = Payment.objects.create(
                        order=order,
                        razorpay_order_id=razorpay_order['id'],
                        amount=amount,
                        currency=currency,
                        status=Payment.PaymentStatus.PENDING
                    )
                    
                return Response(get_success_response("Razorpay order created.", {
                    "order_number": order.order_number,
                    "razorpay_order_id": payment.razorpay_order_id,
                    "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                    "amount": payment.amount,
                    "currency": payment.currency
                }))
                
            except Exception as e:
                logger.error(f"Failed to create Razorpay order for {order_number}: {str(e)}")
                return Response(get_error_response("Payment gateway error. Please try again later."), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = VerifyPaymentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Invalid data.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        razorpay_order_id = serializer.validated_data['razorpay_order_id']
        razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        razorpay_signature = serializer.validated_data['razorpay_signature']
        
        # Find the payment strictly scoped to this customer's orders
        payment = get_object_or_404(Payment, razorpay_order_id=razorpay_order_id, order__customer=request.user)
        order = payment.order
        
        # Idempotency check: if already success, just return ok without re-verifying
        if payment.status == Payment.PaymentStatus.SUCCESS and order.payment_status == Order.PaymentStatus.PAID:
            return Response(get_success_response("Payment was already verified successfully.", {"status": "SUCCESS"}))
            
        # Verify signature securely
        is_valid = PaymentService.verify_payment_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature
        )
        
        if not is_valid:
            payment.status = Payment.PaymentStatus.FAILED
            payment.failure_reason = "Signature verification failed"
            payment.save()
            
            order.payment_status = Order.PaymentStatus.FAILED
            order.status = Order.OrderStatus.PAYMENT_FAILED
            order.save()
            
            return Response(get_error_response("Payment verification failed. Invalid signature."), status=status.HTTP_400_BAD_REQUEST)
            
        # Success! 
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = Payment.PaymentStatus.SUCCESS
            payment.save()
            
            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.OrderStatus.PAID
            order.save()
            
            try:
                LoyaltyService.award_points_for_order(order)
            except Exception as e:
                logger.error(f"Failed to award loyalty points for order {order.order_number}: {str(e)}")
            
            # (Inventory deduction & Coupon logic happens in a later phase, or async task)
            
        return Response(get_success_response("Payment verified successfully.", {"status": "SUCCESS"}))


class PaymentDetailView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, customer=request.user)
        payment = get_object_or_404(Payment, order=order)
        
        serializer = PaymentSerializer(payment)
        return Response(get_success_response("Payment details retrieved.", serializer.data))
