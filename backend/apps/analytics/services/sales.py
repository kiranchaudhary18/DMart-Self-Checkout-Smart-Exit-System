from django.db.models import Sum, Avg
from decimal import Decimal
from apps.orders.models import Order
from .utils import apply_date_filter

def get_sales_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns sales summary strictly for successfully PAID orders.
    """
    qs = Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
    
    if filter_type:
        qs = apply_date_filter(qs, 'created_at', filter_type, custom_start, custom_end)
        
    aggregates = qs.aggregate(
        total_sales=Sum('total_amount'),
        total_gst=Sum('gst_amount'),
        total_discount=Sum('discount_amount'),
        average_order_value=Avg('total_amount')
    )
    
    return {
        "total_sales": aggregates['total_sales'] or Decimal('0.00'),
        "total_gst": aggregates['total_gst'] or Decimal('0.00'),
        "total_discount": aggregates['total_discount'] or Decimal('0.00'),
        "average_order_value": aggregates['average_order_value'] or Decimal('0.00'),
        "order_count": qs.count()
    }
