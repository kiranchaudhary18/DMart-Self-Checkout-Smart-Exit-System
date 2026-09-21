from rest_framework import serializers

class GenerateExitTokenSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)

class VerifyExitTokenSerializer(serializers.Serializer):
    qr_data = serializers.CharField(required=True)
