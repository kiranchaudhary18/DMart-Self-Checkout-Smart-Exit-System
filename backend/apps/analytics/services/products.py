from django.db.models import Sum, F
from apps.products.models import Product
from apps.orders.models import OrderItem, Order
from .utils import apply_date_filter

def get_product_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns product analytics based on OrderItem snapshots.
    """
    total_active = Product.objects.filter(is_active=True).count()
    total_inactive = Product.objects.filter(is_active=False).count()
    
    # Filter OrderItems for PAID orders only
    paid_items_qs = OrderItem.objects.filter(order__payment_status=Order.PaymentStatus.PAID)
    
    if filter_type:
        paid_items_qs = apply_date_filter(paid_items_qs, 'order__created_at', filter_type, custom_start, custom_end)
        
    # Highest revenue
    revenue_data = paid_items_qs.values('product__name', 'product__barcode').annotate(
        total_revenue=Sum(F('quantity') * F('unit_price'))
    ).order_by('-total_revenue')[:5]
    
    # Highest quantity sold
    quantity_data = paid_items_qs.values('product__name', 'product__barcode').annotate(
        total_quantity=Sum('quantity')
    ).order_by('-total_quantity')[:5]
    
    return {
        "total_active_products": total_active,
        "total_inactive_products": total_inactive,
        "highest_revenue_products": list(revenue_data),
        "highest_quantity_products": list(quantity_data)
    }
