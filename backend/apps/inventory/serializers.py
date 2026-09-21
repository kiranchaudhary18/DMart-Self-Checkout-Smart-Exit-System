from rest_framework import serializers
from .models import Inventory, StockTransaction
from apps.products.models import Product

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    available_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = (
            'product', 'product_name', 'barcode', 'current_stock', 
            'reserved_stock', 'available_stock', 'low_stock_threshold', 
            'is_low_stock', 'created_at', 'updated_at'
        )

    def get_is_low_stock(self, obj):
        return obj.available_stock <= obj.low_stock_threshold


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = StockTransaction
        fields = (
            'id', 'product', 'product_name', 'transaction_type', 
            'quantity', 'previous_stock', 'new_stock', 'reason', 
            'reference_id', 'created_by', 'created_by_name', 'created_at'
        )


class StockAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product'
    )
    quantity = serializers.IntegerField(min_value=1)
    transaction_type = serializers.ChoiceField(choices=StockTransaction.TransactionType.choices)
    reason = serializers.CharField(required=False, allow_blank=True)
    reference_id = serializers.CharField(required=False, allow_blank=True)

    def validate_transaction_type(self, value):
        if value == StockTransaction.TransactionType.SALE:
            raise serializers.ValidationError("SALE transactions are automatically handled by the checkout system.")
        return value
