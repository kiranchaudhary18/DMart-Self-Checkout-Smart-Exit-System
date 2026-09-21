from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('customer', 'notification_type', 'channel', 'status', 'order', 'sent_at', 'created_at')
    list_filter = ('notification_type', 'channel', 'status', 'created_at')
    search_fields = ('customer__email', 'order__order_number')
    readonly_fields = ('sent_at', 'created_at', 'updated_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'order')
