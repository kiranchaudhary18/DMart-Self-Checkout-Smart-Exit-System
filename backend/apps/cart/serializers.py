from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.models import Product
from apps.inventory.models import Inventory

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    item_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'barcode', 'quantity', 'unit_price', 'item_total')
        read_only_fields = ('id', 'unit_price', 'item_total')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(source='total_price', max_digits=12, decimal_places=2, read_only=True)
    total_item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'status', 'items', 'subtotal', 'total_item_count')

    def get_total_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), 
        required=True
    )
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, data):
        product = data['product_id']
        quantity = data['quantity']
        
        # Check stock availability
        inventory = getattr(product, 'inventory', None)
        if not inventory or inventory.available_stock < quantity:
            raise serializers.ValidationError("Insufficient stock available.")
            
        return data


class AddToCartBarcodeSerializer(serializers.Serializer):
    barcode = serializers.CharField(required=True)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_barcode(self, value):
        # Treat barcode as string, preserving leading zeros
        barcode_str = str(value).strip()
        product = Product.objects.filter(barcode=barcode_str, is_active=True).first()
        if not product:
            raise serializers.ValidationError("Active product not found for this barcode.")
        return product

    def validate(self, data):
        product = data['barcode']
        quantity = data['quantity']
        
        inventory = getattr(product, 'inventory', None)
        if not inventory or inventory.available_stock < quantity:
            raise serializers.ValidationError("Insufficient stock available.")
            
        # Re-map barcode to product internally for the view
        data['product_id'] = product
        return data


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, required=True)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive.")
        return value
