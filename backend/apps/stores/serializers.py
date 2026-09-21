from rest_framework import serializers
from .models import Store

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = (
            'id', 'name', 'address', 'city', 'state', 'pincode', 
            'phone', 'email', 'opening_time', 'closing_time', 
            'is_open', 'gst_number', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
