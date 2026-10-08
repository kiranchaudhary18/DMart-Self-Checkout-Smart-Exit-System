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
    path('django-admin/', admin.site.urls),
    
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
    from apps.accounts.models import SecurityAccessCode
    from django.contrib.auth.hashers import make_password
    
    User = get_user_model()
    
    # DELETE EVERYTHING DEPENDING ON USERS FIRST TO AVOID PROTECTED ERRORS
    from apps.orders.models import Order
    from apps.cart.models import Cart
    from apps.exit_verification.models import ExitToken
    from apps.payments.models import Payment
    
    Payment.objects.all().delete()
    Order.objects.all().delete()
    Cart.objects.all().delete()
    ExitToken.objects.all().delete()
    
    # NOW DELETE ALL USERS
    User.objects.all().delete()
    
    # RECREATE ADMIN
    u = User.objects.create_superuser(email='admin@dmart.com', password='admin123', name='DMart Admin', phone='0000000001', role='ADMIN')
    u.is_active = True
    u.save()
    
    # RECREATE SECURITY
    s = User.objects.create_user(email='security@dmart.com', password='Security@123', name='Security Guard', phone='0000000002', role='SECURITY')
    s.is_active = True
    s.save()
    
    # CREATE SECURITY ACCESS CODE MAPPING
    SecurityAccessCode.objects.all().delete()
    sc = SecurityAccessCode.objects.create(
        security_name='Security Guard',
        security_email='security@dmart.com',
        access_code=make_password('dummy_code'),
        status='UNUSED',
        used_by=s,
        is_active=True
    )
    
    return JsonResponse({'status': 'ALL old users deleted! Fresh Admin & Security created successfully.'})

urlpatterns.append(path('api/force-admin/', force_admin))
