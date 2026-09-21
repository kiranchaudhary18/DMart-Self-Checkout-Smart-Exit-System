from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'id', 'category', 'name', 'barcode', 'sku', 'description',
            'image', 'price', 'gst_percentage', 'unit', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def to_representation(self, instance):
        # We can also nest category details if we want, but let's keep it simple or just add category_name
        response = super().to_representation(instance)
        response['category_name'] = instance.category.name if instance.category else None
        return response
