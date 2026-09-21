from rest_framework import serializers
from .models import Order, OrderItem, Receipt

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'product_name', 'barcode', 'quantity', 
            'unit_price', 'gst_percentage', 'discount_amount', 
            'taxable_amount', 'gst_amount', 'total_amount'
        )
        read_only_fields = fields


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ('id', 'receipt_number', 'generated_at', 'created_at')
        read_only_fields = fields

class OrderSerializer(serializers.ModelSerializer):
    receipt = ReceiptSerializer(read_only=True)
    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'discount_amount', 'taxable_amount',
            'gst_amount', 'total_amount', 'coupon_code', 'created_at',
            'receipt'
        )
        read_only_fields = fields

class OrderDetailSerializer(OrderSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ('items',)

class FullReceiptSerializer(serializers.ModelSerializer):
    order = OrderDetailSerializer(read_only=True)
    payment_reference = serializers.SerializerMethodField()

    class Meta:
        model = Receipt
        fields = ('id', 'receipt_number', 'generated_at', 'order', 'payment_reference')
        read_only_fields = fields
        
    def get_payment_reference(self, obj):
        payment = getattr(obj.order, 'payment', None)
        if payment and payment.status == 'SUCCESS':
            return {
                'razorpay_payment_id': payment.razorpay_payment_id,
                'razorpay_order_id': payment.razorpay_order_id
            }
        return None
