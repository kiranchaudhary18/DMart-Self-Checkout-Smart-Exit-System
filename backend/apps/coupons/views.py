from rest_framework import views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Coupon
from .serializers import ApplyCouponSerializer
from .services import PricingService
from apps.cart.models import Cart
from apps.accounts.views import get_success_response, get_error_response
from apps.cart.views import IsCustomer, get_or_create_customer_cart

class ApplyCouponView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        cart = get_or_create_customer_cart(request.user)
        
        if cart.items.count() == 0:
            return Response(get_error_response("Cannot apply coupon to an empty cart."), status=status.HTTP_400_BAD_REQUEST)

        coupon = Coupon.objects.filter(code=code).first()
        if not coupon:
            return Response(get_error_response("Coupon not found."), status=status.HTTP_404_NOT_FOUND)

        # Pre-validate against current subtotal
        subtotal = cart.total_price
        is_valid, message = coupon.is_valid_for_cart(subtotal)
        
        if not is_valid:
            return Response(get_error_response(message), status=status.HTTP_400_BAD_REQUEST)

        # Apply
        cart.applied_coupon = coupon
        cart.save()
        
        # Calculate full pricing
        pricing = PricingService.calculate_cart_pricing(cart)
        
        return Response(get_success_response("Coupon applied successfully.", pricing))


class RemoveCouponView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        cart = get_or_create_customer_cart(request.user)
        
        if not cart.applied_coupon:
            return Response(get_error_response("No coupon is currently applied."), status=status.HTTP_400_BAD_REQUEST)
            
        cart.applied_coupon = None
        cart.save()
        
        pricing = PricingService.calculate_cart_pricing(cart)
        return Response(get_success_response("Coupon removed successfully.", pricing))
