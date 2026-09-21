from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'razorpay_order_id', 'razorpay_payment_id', 
            'amount', 'currency', 'status', 'created_at'
        )
        read_only_fields = fields

class CreatePaymentRequestSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)

class VerifyPaymentRequestSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=100)
    razorpay_payment_id = serializers.CharField(max_length=100)
    razorpay_signature = serializers.CharField(max_length=255)
