from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardSummaryView.as_view(), name='analytics-dashboard'),
    path('sales/', views.SalesAnalyticsView.as_view(), name='analytics-sales'),
    path('orders/', views.OrdersAnalyticsView.as_view(), name='analytics-orders'),
    path('products/', views.ProductsAnalyticsView.as_view(), name='analytics-products'),
    path('inventory/', views.InventoryAnalyticsView.as_view(), name='analytics-inventory'),
    path('customers/', views.CustomersAnalyticsView.as_view(), name='analytics-customers'),
    path('loyalty/', views.LoyaltyAnalyticsView.as_view(), name='analytics-loyalty'),
    path('security/', views.SecurityAnalyticsView.as_view(), name='analytics-security'),
    path('fraud/', views.FraudAnalyticsView.as_view(), name='analytics-fraud'),
]
