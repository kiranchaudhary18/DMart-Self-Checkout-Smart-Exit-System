from django.urls import path
from .views import LoyaltyBalanceView, LoyaltyTransactionHistoryView, AdminLoyaltyAdjustView

urlpatterns = [
    path('', LoyaltyBalanceView.as_view(), name='loyalty-balance'),
    path('transactions/', LoyaltyTransactionHistoryView.as_view(), name='loyalty-transactions'),
    path('admin/adjust/', AdminLoyaltyAdjustView.as_view(), name='loyalty-admin-adjust'),
]
