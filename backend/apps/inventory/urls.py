from django.urls import path
from .views import (
    InventoryListView, 
    InventoryDetailView, 
    LowStockView, 
    StockTransactionListView, 
    StockAdjustmentView
)

urlpatterns = [
    path('', InventoryListView.as_view(), name='inventory-list'),
    path('low-stock/', LowStockView.as_view(), name='inventory-low-stock'),
    path('transactions/', StockTransactionListView.as_view(), name='inventory-transactions'),
    path('adjust/', StockAdjustmentView.as_view(), name='inventory-adjust'),
    path('<int:product_id>/', InventoryDetailView.as_view(), name='inventory-detail'),
]
