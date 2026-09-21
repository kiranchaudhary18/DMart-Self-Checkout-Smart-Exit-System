from apps.exit_verification.models import SuspiciousActivity
from .utils import apply_date_filter

def get_fraud_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns suspicious activity and fraud monitoring analytics.
    """
    qs = SuspiciousActivity.objects.all()
    if filter_type:
        qs = apply_date_filter(qs, 'detected_at', filter_type, custom_start, custom_end)
        
    return {
        "total_suspicious_activities": qs.count(),
        "open_activities": qs.filter(status=SuspiciousActivity.Status.OPEN).count(),
        "high_severity_activities": qs.filter(severity=SuspiciousActivity.Severity.HIGH).count(),
        "critical_severity_activities": qs.filter(severity=SuspiciousActivity.Severity.CRITICAL).count(),
        "resolved_activities": qs.filter(status=SuspiciousActivity.Status.RESOLVED).count(),
        "false_positives": qs.filter(status=SuspiciousActivity.Status.FALSE_POSITIVE).count(),
    }
