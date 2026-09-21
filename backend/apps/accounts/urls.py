from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegistrationView,
    CustomTokenObtainPairView,
    CurrentUserView,
    ChangePasswordView,
    TestCustomerView,
    TestSecurityView,
    TestAdminView
)

urlpatterns = [
    path('register/', RegistrationView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    
    # Test endpoints
    path('test/customer/', TestCustomerView.as_view(), name='test_customer'),
    path('test/security/', TestSecurityView.as_view(), name='test_security'),
    path('test/admin/', TestAdminView.as_view(), name='test_admin'),
]
