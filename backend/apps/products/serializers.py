from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class ProductSerializer(serializers.ModelSerializer):
    initial_stock = serializers.IntegerField(write_only=True, required=False, default=0, min_value=0)
    current_stock = serializers.IntegerField(read_only=True, source='inventory.current_stock')

    class Meta:
        model = Product
        fields = (
            'id', 'category', 'name', 'barcode', 'sku', 'description',
            'image', 'price', 'gst_percentage', 'unit', 'is_active', 
            'initial_stock', 'current_stock', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        initial_stock = validated_data.pop('initial_stock', 0)
        
        # We need to know who created it for the stock transaction
        # DRF passes the request in self.context
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        
        from django.db import transaction
        with transaction.atomic():
            product = super().create(validated_data)
            
            from apps.inventory.models import Inventory, StockTransaction
            # Create Inventory record
            Inventory.objects.create(
                product=product,
                current_stock=initial_stock
            )
            
            # Log the initial stock transaction
            if initial_stock > 0:
                StockTransaction.objects.create(
                    product=product,
                    transaction_type=StockTransaction.TransactionType.INITIAL,
                    quantity=initial_stock,
                    previous_stock=0,
                    new_stock=initial_stock,
                    reason="Initial product creation",
                    created_by=user
                )
                
        return product

    def to_representation(self, instance):
        # We can also nest category details if we want, but let's keep it simple or just add category_name
        response = super().to_representation(instance)
        response['category_name'] = instance.category.name if instance.category else None
        return response
