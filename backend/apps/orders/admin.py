from django.contrib import admin
from .models import Order, OrderItem, Receipt

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'barcode', 'quantity', 'unit_price', 'gst_percentage', 'discount_amount', 'taxable_amount', 'gst_amount', 'total_amount')
    can_delete = False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'status', 'payment_status', 'total_amount', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('order_number', 'customer__email')
    readonly_fields = ('order_number', 'subtotal', 'discount_amount', 'taxable_amount', 'gst_amount', 'total_amount', 'coupon_code', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    
    def has_delete_permission(self, request, obj=None):
        # Do not allow orders to be hard-deleted from admin
        return False

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product_name', 'barcode', 'quantity', 'unit_price', 'total_amount', 'created_at')
    search_fields = ('order__order_number', 'product_name', 'barcode')
    readonly_fields = ('order', 'product', 'product_name', 'barcode', 'quantity', 'unit_price', 'gst_percentage', 'discount_amount', 'taxable_amount', 'gst_amount', 'total_amount', 'created_at')
    
    def has_add_permission(self, request):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'order', 'generated_at', 'created_at')
    search_fields = ('receipt_number', 'order__order_number')
    readonly_fields = ('receipt_number', 'order', 'generated_at', 'created_at', 'updated_at')
    
    def has_add_permission(self, request):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
