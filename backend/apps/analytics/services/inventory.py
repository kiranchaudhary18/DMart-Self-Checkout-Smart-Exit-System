from django.db.models import Sum, F
from apps.inventory.models import Inventory
from .utils import apply_date_filter # Inventory usually isn't date filtered for snapshots, but we keep it available.

def get_inventory_summary():
    """
    Returns current inventory snapshot analytics.
    """
    qs = Inventory.objects.all()
    
    total_items = qs.count()
    
    # Annotate available_stock for querying
    qs = qs.annotate(
        available_stock_db=F('current_stock') - F('reserved_stock')
    )
    
    # Low stock defined as available_stock_db <= low_stock_threshold
    low_stock = qs.filter(available_stock_db__lte=F('low_stock_threshold'), available_stock_db__gt=0).count()
    
    out_of_stock = qs.filter(available_stock_db__lte=0).count()
    
    aggregates = qs.aggregate(
        total_current_stock=Sum('current_stock'),
        total_reserved_stock=Sum('reserved_stock'),
        total_available_stock=Sum(F('current_stock') - F('reserved_stock'))
    )
    
    return {
        "total_inventory_items": total_items,
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock,
        "total_current_stock": aggregates['total_current_stock'] or 0,
        "total_reserved_stock": aggregates['total_reserved_stock'] or 0,
        "total_available_stock": aggregates['total_available_stock'] or 0,
    }
