from django.urls import path
from .views import OrderListView, OrderDetailView, CheckoutView, PurchaseHistoryView, ReceiptDetailView

urlpatterns = [
    path('history/', PurchaseHistoryView.as_view(), name='purchase-history'),
    path('', OrderListView.as_view(), name='order-list'),
    path('checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
]
