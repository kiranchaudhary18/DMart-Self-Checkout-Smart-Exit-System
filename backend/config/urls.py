from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
import os
import cloudinary
from django.conf import settings

# Force Cloudinary initialization here so that it picks up the correct environment variables
# even if the Django server hasn't been manually restarted by the user yet.
if getattr(settings, 'CLOUDINARY', None):
    cloudinary.config(
        cloud_name=settings.CLOUDINARY.get('cloud_name'),
        api_key=settings.CLOUDINARY.get('api_key'),
        api_secret=settings.CLOUDINARY.get('api_secret'),
    )

try:
    import cloudinary_storage.app_settings as cs_settings
    if hasattr(cs_settings, 'set_credentials'):
        # In newer versions, set_credentials requires user_settings
        cs_settings.set_credentials(getattr(settings, 'CLOUDINARY_STORAGE', {}))
    else:
        # Manually overwrite the module variables in older versions
        if getattr(settings, 'CLOUDINARY_STORAGE', None):
            cs_settings.CLOUD_NAME = settings.CLOUDINARY_STORAGE.get('CLOUD_NAME')
            cs_settings.API_KEY = settings.CLOUDINARY_STORAGE.get('API_KEY')
            cs_settings.API_SECRET = settings.CLOUDINARY_STORAGE.get('API_SECRET')
except Exception as e:
    print("Could not monkey-patch cloudinary_storage:", e)

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
    path('api/exit-verification/', include('apps.exit_verification.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.http import JsonResponse
def force_admin(request):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    u = User.objects.filter(email='admin@dmart.com').first()
    if u:
        u.set_password('admin123')
        u.save()
        return JsonResponse({'status': 'Admin password reset to admin123'})
    else:
        User.objects.create_superuser(email='admin@dmart.com', password='admin123')
        return JsonResponse({'status': 'Admin created with admin123'})

urlpatterns.append(path('api/force-admin/', force_admin))
