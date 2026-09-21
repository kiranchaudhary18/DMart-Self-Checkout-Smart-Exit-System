from apps.exit_verification.models import ExitVerification
from .utils import apply_date_filter

def get_security_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns exit security verification analytics.
    """
    qs = ExitVerification.objects.all()
    if filter_type:
        qs = apply_date_filter(qs, 'scanned_at', filter_type, custom_start, custom_end)
        
    return {
        "total_verification_attempts": qs.count(),
        "allowed_exits": qs.filter(result=ExitVerification.VerificationResult.ALLOWED).count(),
        "rejected_exits": qs.filter(result=ExitVerification.VerificationResult.REJECTED).count(),
        "expired_token_attempts": qs.filter(rejection_reason=ExitVerification.RejectionReason.TOKEN_EXPIRED).count(),
        "used_token_attempts": qs.filter(rejection_reason=ExitVerification.RejectionReason.TOKEN_ALREADY_USED).count(),
        "invalid_token_attempts": qs.filter(rejection_reason=ExitVerification.RejectionReason.INVALID_TOKEN).count(),
    }
