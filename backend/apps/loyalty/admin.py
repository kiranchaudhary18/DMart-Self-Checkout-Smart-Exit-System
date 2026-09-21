from django.contrib import admin
from .models import LoyaltyAccount, LoyaltyTransaction

@admin.register(LoyaltyAccount)
class LoyaltyAccountAdmin(admin.ModelAdmin):
    list_display = ('customer', 'points_balance', 'lifetime_earned', 'lifetime_redeemed', 'created_at')
    search_fields = ('customer__email',)
    list_filter = ('created_at',)
    readonly_fields = ('lifetime_earned', 'lifetime_redeemed', 'created_at', 'updated_at')

@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ('loyalty_account', 'transaction_type', 'points', 'balance_before', 'balance_after', 'order', 'created_at')
    search_fields = ('loyalty_account__customer__email', 'order__order_number', 'reference_id')
    list_filter = ('transaction_type', 'created_at')
    readonly_fields = ('balance_before', 'balance_after', 'created_at')
