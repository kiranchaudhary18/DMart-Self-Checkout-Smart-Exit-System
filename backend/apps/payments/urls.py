from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView, PaymentDetailView

urlpatterns = [
    path('create/', CreateRazorpayOrderView.as_view(), name='payment-create'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('<str:order_number>/', PaymentDetailView.as_view(), name='payment-detail'),
]
