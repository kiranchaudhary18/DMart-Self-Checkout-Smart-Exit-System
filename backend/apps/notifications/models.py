from django.db import models
from apps.accounts.models import User
from apps.orders.models import Order

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        ORDER_CONFIRMED = 'ORDER_CONFIRMED', 'Order Confirmed'
        PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Success'
        RECEIPT_READY = 'RECEIPT_READY', 'Receipt Ready'
        EXIT_QR_READY = 'EXIT_QR_READY', 'Exit QR Ready'
        EXIT_ALLOWED = 'EXIT_ALLOWED', 'Exit Allowed'
        EXIT_REJECTED = 'EXIT_REJECTED', 'Exit Rejected'
        LOYALTY_EARNED = 'LOYALTY_EARNED', 'Loyalty Earned'
        SECURITY_ALERT = 'SECURITY_ALERT', 'Security Alert'

    class Channel(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.EMAIL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    subject = models.CharField(max_length=255)
    message = models.TextField()
    
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['customer', 'order', 'notification_type'],
                name='unique_notification_per_order_type',
                condition=models.Q(order__isnull=False)
            )
        ]

    def __str__(self):
        return f"{self.notification_type} to {self.customer.email} - {self.status}"
