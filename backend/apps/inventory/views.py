from rest_framework import generics, views, status, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import F

from .models import Inventory, StockTransaction
from .serializers import InventorySerializer, StockTransactionSerializer, StockAdjustmentSerializer
from apps.accounts.permissions import IsAdmin
from apps.accounts.views import get_success_response, get_error_response

class InventoryListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = InventorySerializer
    queryset = Inventory.objects.select_related('product').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__barcode']
    ordering_fields = ['product__name', 'current_stock']

class InventoryDetailView(views.APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request, product_id):
        # Using filter instead of get_object_or_404 to provide a clean JSON 404 response
        inventory = Inventory.objects.select_related('product').filter(product_id=product_id).first()
        if not inventory:
            return Response(get_error_response("Inventory not found for this product."), status=status.HTTP_404_NOT_FOUND)
            
        serializer = InventorySerializer(inventory)
        return Response(get_success_response("Inventory retrieved.", serializer.data))

class LowStockView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = InventorySerializer
    
    def get_queryset(self):
        # We need to filter where available_stock <= low_stock_threshold
        # available_stock = current_stock - reserved_stock
        return Inventory.objects.select_related('product').annotate(
            calculated_available=F('current_stock') - F('reserved_stock')
        ).filter(calculated_available__lte=F('low_stock_threshold'))

class StockTransactionListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = StockTransactionSerializer
    queryset = StockTransaction.objects.select_related('product', 'created_by').all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'transaction_type']

class StockAdjustmentView(views.APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        product = data['product']
        quantity = data['quantity']
        tx_type = data['transaction_type']
        
        # Determine if it's an addition or reduction
        is_addition = tx_type in [
            StockTransaction.TransactionType.INITIAL, 
            StockTransaction.TransactionType.RESTOCK, 
            StockTransaction.TransactionType.RETURN
        ]
        
        try:
            with transaction.atomic():
                # select_for_update() locks the row until transaction completes
                inventory, created = Inventory.objects.select_for_update().get_or_create(
                    product=product,
                    defaults={'current_stock': 0, 'reserved_stock': 0}
                )
                
                previous_stock = inventory.current_stock
                
                if is_addition:
                    new_stock = previous_stock + quantity
                else:
                    new_stock = previous_stock - quantity
                    if new_stock < 0:
                        return Response(get_error_response("Insufficient stock for this transaction."), status=status.HTTP_400_BAD_REQUEST)
                
                # Update inventory
                inventory.current_stock = new_stock
                inventory.save()
                
                # Create transaction log
                tx = StockTransaction.objects.create(
                    product=product,
                    transaction_type=tx_type,
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=data.get('reason', ''),
                    reference_id=data.get('reference_id', ''),
                    created_by=request.user
                )
                
                # We return the updated inventory state
                inv_serializer = InventorySerializer(inventory)
                return Response(get_success_response("Stock adjusted successfully.", inv_serializer.data))
                
        except Exception as e:
            return Response(get_error_response(f"An error occurred: {str(e)}"), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
