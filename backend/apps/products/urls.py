from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, BarcodeLookupView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    # Dedicated barcode lookup endpoint
    path('barcode/<str:barcode>/', BarcodeLookupView.as_view(), name='barcode-lookup'),
    
    # Standard viewset URLs
    path('', include(router.urls)),
]
