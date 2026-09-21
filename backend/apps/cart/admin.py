from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'total_price', 'created_at', 'updated_at')
    search_fields = ('customer__email', 'customer__name')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [CartItemInline]
    
    def total_price(self, obj):
        return obj.total_price
    total_price.short_description = 'Cart Total'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity', 'unit_price', 'item_total', 'created_at')
    search_fields = ('cart__customer__email', 'product__name', 'product__barcode')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    def item_total(self, obj):
        return obj.item_total
    item_total.short_description = 'Item Total'
