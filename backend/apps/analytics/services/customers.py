from django.db.models import Count
from apps.accounts.models import User
from apps.orders.models import Order
from .utils import apply_date_filter

def get_customer_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns customer analytics.
    """
    qs = User.objects.filter(role=User.Role.CUSTOMER)
    
    total_customers = qs.count()
    active_customers = qs.filter(is_active=True).count()
    
    # Customers with at least one PAID order
    customers_with_purchases = qs.filter(orders__payment_status=Order.PaymentStatus.PAID).distinct().count()
    
    # New customers in period
    new_customers_qs = qs
    if filter_type:
        new_customers_qs = apply_date_filter(new_customers_qs, 'date_joined', filter_type, custom_start, custom_end)
    new_customers = new_customers_qs.count()
    
    # Repeat customers (more than 1 paid order)
    # Exclude period filtering for lifetime repeat customers, or apply it if needed. 
    # Usually "repeat customers" is a lifetime metric unless specified.
    from django.db.models import Q
    repeat_customers = qs.annotate(
        paid_orders_count=Count('orders', filter=Q(orders__payment_status=Order.PaymentStatus.PAID))
    ).filter(paid_orders_count__gt=1).count()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "customers_with_purchases": customers_with_purchases,
        "new_customers": new_customers,
        "repeat_customers": repeat_customers
    }
