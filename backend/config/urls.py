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
    
    # App Endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/stores/', include('apps.stores.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/cart/', include('apps.cart.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/coupons/', include('apps.coupons.urls')),
    path('api/receipts/', include('apps.orders.urls_receipts')),
    path('api/loyalty/', include('apps.loyalty.urls')),
    path('api/exit/', dummy_api_view, {'app_name': 'Exit Verification'}, name='exit_dummy'),
    path('api/analytics/', dummy_api_view, {'app_name': 'Analytics'}, name='analytics_dummy'),
]
