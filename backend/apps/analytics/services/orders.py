from apps.orders.models import Order
from .utils import apply_date_filter

def get_order_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns counts for different order statuses.
    """
    qs = Order.objects.all()
    if filter_type:
        qs = apply_date_filter(qs, 'created_at', filter_type, custom_start, custom_end)
        
    return {
        "total_orders": qs.count(),
        "paid_orders": qs.filter(payment_status=Order.PaymentStatus.PAID).count(),
        "pending_payment_orders": qs.filter(payment_status=Order.PaymentStatus.PENDING).count(),
        "failed_payment_orders": qs.filter(payment_status=Order.PaymentStatus.FAILED).count(),
        "cancelled_orders": qs.filter(status=Order.OrderStatus.CANCELLED).count(),
        "completed_orders": qs.filter(status=Order.OrderStatus.PAID).count(), # Usually synonymous with completed initially
    }
