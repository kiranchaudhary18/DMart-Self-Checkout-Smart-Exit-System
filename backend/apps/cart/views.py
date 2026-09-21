from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Cart, CartItem
from .serializers import (
    CartSerializer, 
    AddToCartSerializer, 
    AddToCartBarcodeSerializer,
    UpdateCartItemSerializer
)
from apps.accounts.models import User
from apps.accounts.views import get_success_response, get_error_response


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.CUSTOMER)


def get_or_create_customer_cart(user):
    cart, created = Cart.objects.get_or_create(
        customer=user,
        status=Cart.StatusChoices.ACTIVE
    )
    return cart


class CartView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        cart = get_or_create_customer_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(get_success_response("Cart retrieved successfully.", serializer.data))


class CartClearView(views.APIView):
    permission_classes = [IsCustomer]

    def delete(self, request):
        cart = get_or_create_customer_cart(request.user)
        # Clear all items, do not delete the cart
        cart.items.all().delete()
        
        serializer = CartSerializer(cart)
        return Response(get_success_response("Cart cleared successfully.", serializer.data))


class CartItemAddView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        product = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        cart = get_or_create_customer_cart(request.user)
        
        with transaction.atomic():
            cart_item = CartItem.objects.filter(cart=cart, product=product).first()
            if cart_item:
                new_quantity = cart_item.quantity + quantity
                created = False
            else:
                cart_item = CartItem(cart=cart, product=product, quantity=quantity, unit_price=product.price)
                new_quantity = quantity
                created = True
            
            # Re-verify stock for final quantity
            inventory = getattr(product, 'inventory', None)
            if not inventory or inventory.available_stock < new_quantity:
                return Response(get_error_response("Insufficient stock available for the requested total quantity in cart."), status=status.HTTP_400_BAD_REQUEST)
                
            cart_item.quantity = new_quantity
            # Ensure price is accurate (e.g. if an old item was in cart and price changed, do we update? The prompt says "When a product is added... unit_price should store the current Product.price.")
            # If we just increased quantity of existing, keeping old price or updating? Usually we keep the price at the time of first add, or update to latest. Let's stick to existing unit_price or update to latest. Updating is safer.
            # But the prompt: "When a product is added to the cart: unit_price should store the current Product.price. This will protect the cart from unexpected product price changes."
            if created:
                cart_item.unit_price = product.price
                
            cart_item.save()
            
        cart_serializer = CartSerializer(cart)
        return Response(get_success_response("Item added to cart.", cart_serializer.data))


class CartItemBarcodeAddView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = AddToCartBarcodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        product = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        cart = get_or_create_customer_cart(request.user)
        
        with transaction.atomic():
            cart_item = CartItem.objects.filter(cart=cart, product=product).first()
            if cart_item:
                new_quantity = cart_item.quantity + quantity
                created = False
            else:
                cart_item = CartItem(cart=cart, product=product, quantity=quantity, unit_price=product.price)
                new_quantity = quantity
                created = True
            
            inventory = getattr(product, 'inventory', None)
            if not inventory or inventory.available_stock < new_quantity:
                return Response(get_error_response("Insufficient stock available for the requested total quantity in cart."), status=status.HTTP_400_BAD_REQUEST)
                
            cart_item.quantity = new_quantity
            if created:
                cart_item.unit_price = product.price
            cart_item.save()
            
        cart_serializer = CartSerializer(cart)
        return Response(get_success_response("Item added to cart via barcode.", cart_serializer.data))


class CartItemDetailView(views.APIView):
    permission_classes = [IsCustomer]

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        new_quantity = serializer.validated_data['quantity']
        cart = get_or_create_customer_cart(request.user)
        
        cart_item = CartItem.objects.filter(cart=cart, id=item_id).first()
        if not cart_item:
            return Response(get_error_response("Cart item not found in your active cart."), status=status.HTTP_404_NOT_FOUND)
            
        # Check stock
        product = cart_item.product
        inventory = getattr(product, 'inventory', None)
        if not inventory or inventory.available_stock < new_quantity:
            return Response(get_error_response("Insufficient stock available for the requested quantity."), status=status.HTTP_400_BAD_REQUEST)
            
        cart_item.quantity = new_quantity
        cart_item.save()
        
        cart_serializer = CartSerializer(cart)
        return Response(get_success_response("Cart item updated.", cart_serializer.data))

    def delete(self, request, item_id):
        cart = get_or_create_customer_cart(request.user)
        
        cart_item = CartItem.objects.filter(cart=cart, id=item_id).first()
        if not cart_item:
            return Response(get_error_response("Cart item not found in your active cart."), status=status.HTTP_404_NOT_FOUND)
            
        cart_item.delete()
        
        cart_serializer = CartSerializer(cart)
        return Response(get_success_response("Cart item removed successfully.", cart_serializer.data))

class CartSummaryView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        cart = get_or_create_customer_cart(request.user)
        # Import dynamically to avoid circular import if PricingService imports Cart
        from apps.coupons.services import PricingService
        pricing = PricingService.calculate_cart_pricing(cart)
        return Response(get_success_response("Cart summary retrieved.", pricing))
