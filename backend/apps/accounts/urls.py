from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    RegistrationView,
    CustomTokenObtainPairView,
    CurrentUserView,
    ChangePasswordView,
    TestCustomerView,
    TestSecurityView,
    TestAdminView,
    SecurityAccessCodeViewSet,
    SecurityRegistrationView
)

router = DefaultRouter()
router.register(r'admin/security-codes', SecurityAccessCodeViewSet, basename='admin-security-codes')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegistrationView.as_view(), name='auth_register'),
    path('security/register/', SecurityRegistrationView.as_view(), name='security_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    
    # Test endpoints
    path('test/customer/', TestCustomerView.as_view(), name='test_customer'),
    path('test/security/', TestSecurityView.as_view(), name='test_security'),
    path('test/admin/', TestAdminView.as_view(), name='test_admin'),
]
