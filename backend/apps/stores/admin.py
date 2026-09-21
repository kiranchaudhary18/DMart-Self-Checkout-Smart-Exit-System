from django.contrib import admin
from .models import Store

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'phone', 'is_open', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'gst_number')
        }),
        ('Location Details', {
            'fields': ('address', 'city', 'state', 'pincode')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email')
        }),
        ('Operating Hours', {
            'fields': ('opening_time', 'closing_time', 'is_open')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Prevent adding more than one store
        if Store.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        # Optional: prevent deleting the only store configuration to maintain integrity
        # return False
        return super().has_delete_permission(request, obj)
