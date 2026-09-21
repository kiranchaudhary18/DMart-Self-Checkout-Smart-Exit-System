from django.db import models
from apps.orders.models import Order
from apps.accounts.models import User
from django.utils import timezone

class ExitToken(models.Model):
    class TokenStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        USED = 'USED', 'Used'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='exit_token')
    
    # Cryptographic hash of the raw secret token. 
    # Must be large enough to hold SHA-256 hex digest (64 chars) or pbkdf2 hash.
    token_hash = models.CharField(max_length=128, unique=True, editable=False)
    
    # Safe public reference id for logs/UI, e.g., DMART-EXIT-XXXXXXXX
    token_reference = models.CharField(max_length=50, unique=True, editable=False, db_index=True)
    
    status = models.CharField(max_length=20, choices=TokenStatus.choices, default=TokenStatus.ACTIVE)
    
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Exit Token {self.token_reference} - {self.status}"

    class Meta:
        verbose_name = "Exit Token"
        verbose_name_plural = "Exit Tokens"
        ordering = ['-created_at']

    @property
    def is_valid(self):
        return self.status == self.TokenStatus.ACTIVE and timezone.now() < self.expires_at


class ExitVerification(models.Model):
    class VerificationResult(models.TextChoices):
        ALLOWED = 'ALLOWED', 'Allowed'
        REJECTED = 'REJECTED', 'Rejected'
        
    class RejectionReason(models.TextChoices):
        INVALID_TOKEN = 'INVALID_TOKEN', 'Invalid Token'
        TOKEN_EXPIRED = 'TOKEN_EXPIRED', 'Token Expired'
        TOKEN_ALREADY_USED = 'TOKEN_ALREADY_USED', 'Token Already Used'
        TOKEN_REVOKED = 'TOKEN_REVOKED', 'Token Revoked'
        ORDER_NOT_FOUND = 'ORDER_NOT_FOUND', 'Order Not Found'
        PAYMENT_NOT_COMPLETED = 'PAYMENT_NOT_COMPLETED', 'Payment Not Completed'
        ORDER_MISMATCH = 'ORDER_MISMATCH', 'Order Mismatch'
        INVALID_QR_FORMAT = 'INVALID_QR_FORMAT', 'Invalid QR Format'
        UNAUTHORIZED = 'UNAUTHORIZED', 'Unauthorized'
        OTHER = 'OTHER', 'Other'

    # SET_NULL ensures we keep audit history even if original records are deleted
    exit_token = models.ForeignKey(ExitToken, on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='exit_verifications')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='exit_verifications_performed')
    
    result = models.CharField(max_length=20, choices=VerificationResult.choices)
    rejection_reason = models.CharField(max_length=50, choices=RejectionReason.choices, null=True, blank=True)
    
    scanned_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification {self.id} - {self.result}"

    class Meta:
        verbose_name = "Exit Verification"
        verbose_name_plural = "Exit Verifications"
        ordering = ['-scanned_at']

class SuspiciousActivity(models.Model):
    class ActivityType(models.TextChoices):
        INVALID_QR = 'INVALID_QR', 'Invalid QR'
        INVALID_TOKEN = 'INVALID_TOKEN', 'Invalid Token'
        EXPIRED_TOKEN_ATTEMPT = 'EXPIRED_TOKEN_ATTEMPT', 'Expired Token Attempt'
        USED_TOKEN_ATTEMPT = 'USED_TOKEN_ATTEMPT', 'Used Token Attempt'
        REVOKED_TOKEN_ATTEMPT = 'REVOKED_TOKEN_ATTEMPT', 'Revoked Token Attempt'
        PAYMENT_MISMATCH = 'PAYMENT_MISMATCH', 'Payment Mismatch'
        ORDER_MISMATCH = 'ORDER_MISMATCH', 'Order Mismatch'
        REPEATED_FAILURES = 'REPEATED_FAILURES', 'Repeated Failures'
        UNAUTHORIZED_VERIFICATION = 'UNAUTHORIZED_VERIFICATION', 'Unauthorized Verification'
        OTHER = 'OTHER', 'Other'

    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        REVIEWED = 'REVIEWED', 'Reviewed'
        RESOLVED = 'RESOLVED', 'Resolved'
        FALSE_POSITIVE = 'FALSE_POSITIVE', 'False Positive'

    activity_type = models.CharField(max_length=50, choices=ActivityType.choices)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspicious_activities')
    exit_token = models.ForeignKey(ExitToken, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspicious_activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='suspicious_activities')
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    detected_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_suspicious_activities')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.activity_type} - {self.severity} ({self.status})"

    class Meta:
        verbose_name = "Suspicious Activity"
        verbose_name_plural = "Suspicious Activities"
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['activity_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['status']),
            models.Index(fields=['detected_at']),
            models.Index(fields=['user']),
            models.Index(fields=['order']),
            models.Index(fields=['ip_address']),
        ]

