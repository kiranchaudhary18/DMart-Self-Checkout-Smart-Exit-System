from django.contrib import admin
from .models import ExitToken, ExitVerification

@admin.register(ExitToken)
class ExitTokenAdmin(admin.ModelAdmin):
    list_display = ('token_reference', 'order', 'status', 'expires_at', 'used_at', 'created_at')
    search_fields = ('token_reference', 'order__order_number')
    list_filter = ('status', 'created_at')
    
    # Do NOT display token_hash unnecessarily.
    readonly_fields = ('order', 'token_reference', 'status', 'expires_at', 'used_at', 'created_at', 'updated_at')
    
    # Hide token_hash from the form entirely
    exclude = ('token_hash',)
    
    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ExitVerification)
class ExitVerificationAdmin(admin.ModelAdmin):
    list_display = ('order', 'exit_token', 'verified_by', 'result', 'rejection_reason', 'scanned_at')
    list_filter = ('result', 'rejection_reason', 'verified_by', 'scanned_at')
    search_fields = ('order__order_number', 'exit_token__token_reference', 'verified_by__email')
    readonly_fields = ('exit_token', 'order', 'verified_by', 'result', 'rejection_reason', 'scanned_at', 'created_at')

    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False

from .models import SuspiciousActivity

@admin.register(SuspiciousActivity)
class SuspiciousActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'severity', 'status', 'order', 'user', 'ip_address', 'detected_at', 'reviewed_at', 'reviewed_by')
    list_filter = ('activity_type', 'severity', 'status', 'detected_at')
    search_fields = ('order__order_number', 'user__username', 'user__email', 'ip_address')
    readonly_fields = (
        'activity_type', 'severity', 'order', 'exit_token', 'user', 
        'ip_address', 'user_agent', 'description', 'metadata', 'detected_at', 'created_at', 'updated_at'
    )
    # Allows admin to change status and reviewed_by/reviewed_at fields during manual review
    
    def has_add_permission(self, request):
        return False
