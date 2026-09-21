from django.db import models
from django.core.validators import MinValueValidator
from apps.accounts.models import User
from apps.orders.models import Order

class LoyaltyAccount(models.Model):
    customer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='loyalty_account')
    points_balance = models.PositiveBigIntegerField(default=0)
    lifetime_earned = models.PositiveBigIntegerField(default=0)
    lifetime_redeemed = models.PositiveBigIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.customer.email} - {self.points_balance} pts"

    class Meta:
        verbose_name = "Loyalty Account"
        verbose_name_plural = "Loyalty Accounts"


class LoyaltyTransaction(models.Model):
    class TransactionType(models.TextChoices):
        EARN = 'EARN', 'Earn'
        REDEEM = 'REDEEM', 'Redeem'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'
        REVERSAL = 'REVERSAL', 'Reversal'

    loyalty_account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    
    points = models.PositiveBigIntegerField(validators=[MinValueValidator(1)])
    balance_before = models.PositiveBigIntegerField(default=0)
    balance_after = models.PositiveBigIntegerField(default=0)
    
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='loyalty_transactions')
    description = models.CharField(max_length=255, blank=True)
    reference_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} {self.points} pts - {self.loyalty_account.customer.email}"

    class Meta:
        verbose_name = "Loyalty Transaction"
        verbose_name_plural = "Loyalty Transactions"
        ordering = ['-created_at']
        
        # Ensure that an order can only award points once (duplicate earning protection)
        constraints = [
            models.UniqueConstraint(
                fields=['loyalty_account', 'order', 'transaction_type'],
                condition=models.Q(transaction_type='EARN'),
                name='unique_earn_per_order'
            )
        ]
