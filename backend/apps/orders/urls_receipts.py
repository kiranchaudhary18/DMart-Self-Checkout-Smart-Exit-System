from django.urls import path
from .views import ReceiptDetailView

urlpatterns = [
    path('<str:receipt_number>/', ReceiptDetailView.as_view(), name='receipt-detail'),
]
