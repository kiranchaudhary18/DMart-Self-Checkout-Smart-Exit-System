from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)
    ordering = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'barcode', 'sku', 'category', 'price', 'is_active')
    search_fields = ('name', 'barcode', 'sku')
    list_filter = ('category', 'is_active')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description', 'image', 'is_active')
        }),
        ('Identification', {
            'fields': ('barcode', 'sku')
        }),
        ('Pricing & Unit', {
            'fields': ('price', 'gst_percentage', 'unit')
        }),
    )
