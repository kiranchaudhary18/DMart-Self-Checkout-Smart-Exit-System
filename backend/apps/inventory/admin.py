from django.contrib import admin
from .models import Inventory, StockTransaction

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'current_stock', 'reserved_stock', 'available_stock', 'low_stock_threshold', 'updated_at')
    search_fields = ('product__name', 'product__barcode', 'product__sku')
    list_filter = ('low_stock_threshold',)
    readonly_fields = ('created_at', 'updated_at')
    
    def available_stock(self, obj):
        return obj.available_stock
    available_stock.short_description = 'Available Stock'

@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'transaction_type', 'quantity', 'previous_stock', 'new_stock', 'created_by', 'created_at')
    search_fields = ('product__name', 'product__barcode', 'reference_id')
    list_filter = ('transaction_type', 'created_at')
    readonly_fields = ('created_at',)
    
    def get_readonly_fields(self, request, obj=None):
        if obj: # Editing an existing object
            return self.readonly_fields + ('product', 'transaction_type', 'quantity', 'previous_stock', 'new_stock', 'created_by')
        return self.readonly_fields
