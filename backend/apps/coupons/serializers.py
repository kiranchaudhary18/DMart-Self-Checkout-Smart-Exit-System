from rest_framework import serializers

class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    
    def validate_code(self, value):
        return str(value).strip().upper()
