from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def health_check(request):
    return JsonResponse({
        "status": "success",
        "message": "DMart Self Checkout API is running"
    })

def dummy_api_view(request, app_name):
    return JsonResponse({
        "status": "success",
        "message": f"{app_name} API is running (Not fully implemented yet)"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Global Health Check
    path('api/health/', health_check, name='health_check'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # App Endpoints (Dummy for Phase 1)
    path('api/auth/', dummy_api_view, {'app_name': 'Auth'}, name='auth_dummy'),
    path('api/stores/', dummy_api_view, {'app_name': 'Stores'}, name='stores_dummy'),
    path('api/products/', dummy_api_view, {'app_name': 'Products'}, name='products_dummy'),
    path('api/cart/', dummy_api_view, {'app_name': 'Cart'}, name='cart_dummy'),
    path('api/orders/', dummy_api_view, {'app_name': 'Orders'}, name='orders_dummy'),
    path('api/payments/', dummy_api_view, {'app_name': 'Payments'}, name='payments_dummy'),
    path('api/inventory/', dummy_api_view, {'app_name': 'Inventory'}, name='inventory_dummy'),
    path('api/coupons/', dummy_api_view, {'app_name': 'Coupons'}, name='coupons_dummy'),
    path('api/loyalty/', dummy_api_view, {'app_name': 'Loyalty'}, name='loyalty_dummy'),
    path('api/exit/', dummy_api_view, {'app_name': 'Exit Verification'}, name='exit_dummy'),
    path('api/analytics/', dummy_api_view, {'app_name': 'Analytics'}, name='analytics_dummy'),
]
