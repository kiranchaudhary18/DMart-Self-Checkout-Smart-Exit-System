from django.urls import path
from .views import (
    CartView,
    CartClearView,
    CartItemAddView,
    CartItemBarcodeAddView,
    CartItemDetailView,
    CartSummaryView
)

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('summary/', CartSummaryView.as_view(), name='cart-summary'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
    path('items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('items/barcode/', CartItemBarcodeAddView.as_view(), name='cart-item-barcode-add'),
    path('items/<int:item_id>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]
