from django.utils import timezone
from datetime import timedelta

def get_date_range(filter_type, custom_start=None, custom_end=None):
    """
    Returns (start_date, end_date) timezone-aware datetimes based on filter type.
    """
    now = timezone.now()
    if filter_type == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif filter_type == 'yesterday':
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, end
    elif filter_type == 'last_7_days':
        return now - timedelta(days=7), now
    elif filter_type == 'last_30_days':
        return now - timedelta(days=30), now
    elif filter_type == 'current_month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif filter_type == 'custom' and custom_start and custom_end:
        return custom_start, custom_end
    return None, None

def apply_date_filter(queryset, date_field, filter_type, custom_start=None, custom_end=None):
    start, end = get_date_range(filter_type, custom_start, custom_end)
    if start and end:
        return queryset.filter(**{f"{date_field}__gte": start, f"{date_field}__lte": end})
    return queryset
