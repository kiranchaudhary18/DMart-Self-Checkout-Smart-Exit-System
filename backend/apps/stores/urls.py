from django.urls import path
from .views import CurrentStoreView

urlpatterns = [
    path('', CurrentStoreView.as_view(), name='store_root'),
    path('current/', CurrentStoreView.as_view(), name='store_current'),
]
