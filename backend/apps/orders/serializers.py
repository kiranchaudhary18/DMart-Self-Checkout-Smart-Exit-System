from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'product_name', 'barcode', 'quantity', 
            'unit_price', 'gst_percentage', 'discount_amount', 
            'taxable_amount', 'gst_amount', 'total_amount'
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'discount_amount', 'taxable_amount',
            'gst_amount', 'total_amount', 'coupon_code', 'created_at'
        )
        read_only_fields = fields


class OrderDetailSerializer(OrderSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ('items',)
