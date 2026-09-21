from rest_framework import serializers
from .models import LoyaltyAccount, LoyaltyTransaction

class LoyaltyAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyAccount
        fields = ('points_balance', 'lifetime_earned', 'lifetime_redeemed', 'created_at')
        read_only_fields = fields

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = LoyaltyTransaction
        fields = (
            'transaction_type', 'points', 'balance_before', 
            'balance_after', 'order_number', 'description', 
            'reference_id', 'created_at'
        )
        read_only_fields = fields

class AdminAdjustSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=True)
    points = serializers.IntegerField(required=True)
    description = serializers.CharField(max_length=255, required=True)
