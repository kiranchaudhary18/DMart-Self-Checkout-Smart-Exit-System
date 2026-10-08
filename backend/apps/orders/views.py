from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework import views, status
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Order, OrderItem, Receipt
from .serializers import (
    OrderSerializer, OrderDetailSerializer, FullReceiptSerializer
)
from .services import ReceiptService
from apps.cart.models import Cart
from apps.cart.views import get_or_create_customer_cart, IsCustomer
from apps.inventory.models import Inventory
from apps.coupons.services import PricingService
from apps.accounts.views import get_success_response, get_error_response

class PurchaseHistoryView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user)
        
        # Filtering
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            orders = orders.filter(payment_status=payment_status)
            
        status_param = request.query_params.get('status')
        if status_param:
            orders = orders.filter(status=status_param)
            
        # Basic pagination could be added via LimitOffsetPagination, but for now we limit to 50
        orders = orders[:50]
        
        serializer = OrderSerializer(orders, many=True)
        return Response(get_success_response("Purchase history retrieved.", serializer.data))


class ReceiptDetailView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request, receipt_number=None, order_number=None):
        if receipt_number:
            receipt = get_object_or_404(Receipt, receipt_number=receipt_number, order__customer=request.user)
        elif order_number:
            order = get_object_or_404(Order, order_number=order_number, customer=request.user)
            try:
                receipt = ReceiptService.generate_receipt(order)
            except ValueError as e:
                return Response(get_error_response(str(e)), status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(get_error_response("Missing receipt or order number."), status=status.HTTP_400_BAD_REQUEST)
            
        serializer = FullReceiptSerializer(receipt)
        return Response(get_success_response("Receipt retrieved.", serializer.data))

class OrderListView(views.APIView):

    permission_classes = [IsCustomer]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(get_success_response("Orders retrieved.", serializer.data))


class OrderDetailView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request, order_number):
        order = get_object_or_404(Order, customer=request.user, order_number=order_number)
        serializer = OrderDetailSerializer(order)
        return Response(get_success_response("Order retrieved.", serializer.data))


class CheckoutView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        cart = get_or_create_customer_cart(request.user)

        if cart.items.count() == 0:
            return Response(get_error_response("Cart is empty."), status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Get cart items and lock related inventories
            cart_items = list(cart.items.select_related('product').all())
            product_ids = [item.product_id for item in cart_items]
            
            # Lock inventories for these products to prevent concurrent overselling
            # We don't reduce stock here, but we ensure the stock check is atomic.
            inventories = Inventory.objects.select_for_update().filter(product_id__in=product_ids)
            inventory_map = {inv.product_id: inv for inv in inventories}
            
            # 1. Validate Stock
            for item in cart_items:
                inv = inventory_map.get(item.product_id)
                if not inv or inv.available_stock < item.quantity:
                    return Response(
                        get_error_response(f"Insufficient stock for {item.product.name}."), 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # 2. Calculate final Pricing securely
            pricing = PricingService.calculate_cart_pricing(cart)

            # 3. Create Order
            order = Order(
                customer=request.user,
                subtotal=pricing['subtotal'],
                discount_amount=pricing['discount'],
                taxable_amount=pricing['taxable_amount'],
                gst_amount=pricing['gst'],
                total_amount=pricing['final_total']
            )
            
            if pricing.get('coupon'):
                order.coupon_code = pricing['coupon']['code']
                
            order.save()

            # 4. Create OrderItems (Snapshots)
            order_items_to_create = []
            for item_detail in pricing['items']:
                # Find original item to get standard product data
                cart_item = next(i for i in cart_items if i.id == item_detail['item_id'])
                
                order_item = OrderItem(
                    order=order,
                    product=cart_item.product,
                    product_name=item_detail['product_name'],
                    barcode=item_detail['barcode'],
                    quantity=item_detail['quantity'],
                    unit_price=item_detail['unit_price'],
                    gst_percentage=item_detail['gst_percentage'],
                    discount_amount=item_detail['item_discount'],
                    taxable_amount=item_detail['item_taxable'],
                    gst_amount=item_detail['item_gst'],
                    total_amount=item_detail['item_final']
                )
                order_items_to_create.append(order_item)
                
            OrderItem.objects.bulk_create(order_items_to_create)

            # 5. Transition Cart Status
            cart.status = Cart.StatusChoices.CHECKED_OUT
            cart.save()
            
            # (A new cart will be automatically created on the next cart access)

        # 6. Return response
        serializer = OrderDetailSerializer(order)
        return Response(get_success_response("Order created successfully.", serializer.data))

from apps.accounts.permissions import IsAdmin
class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = OrderSerializer
    queryset = Order.objects.all().order_by('-created_at')
