from django.urls import path
from .views import GenerateExitTokenView, ExitTokenDetailView, VerifyExitTokenView

urlpatterns = [
    path('generate/', GenerateExitTokenView.as_view(), name='exit-generate'),
    path('verify/', VerifyExitTokenView.as_view(), name='exit-verify'),
    path('<str:order_number>/', ExitTokenDetailView.as_view(), name='exit-detail'),
]
