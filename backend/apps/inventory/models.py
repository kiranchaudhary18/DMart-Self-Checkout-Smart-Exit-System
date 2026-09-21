from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import F, Q
from apps.products.models import Product
from apps.accounts.models import User

class Inventory(models.Model):
    product = models.OneToOneField(
        Product, 
        on_delete=models.PROTECT, 
        related_name='inventory',
        help_text="The product this inventory record belongs to."
    )
    current_stock = models.PositiveIntegerField(default=0)
    reserved_stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def available_stock(self):
        return self.current_stock - self.reserved_stock

    def clean(self):
        if self.reserved_stock > self.current_stock:
            raise ValidationError({
                "reserved_stock": "Reserved stock cannot exceed current stock."
            })
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Inventory: {self.product.name} (Available: {self.available_stock})"

    class Meta:
        verbose_name = "Inventory"
        verbose_name_plural = "Inventories"
        constraints = [
            models.CheckConstraint(
                condition=Q(reserved_stock__lte=F('current_stock')),
                name='reserved_stock_lte_current_stock'
            )
        ]


class StockTransaction(models.Model):
    class TransactionType(models.TextChoices):
        INITIAL = 'INITIAL', 'Initial Stock'
        RESTOCK = 'RESTOCK', 'Restock'
        SALE = 'SALE', 'Sale'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'
        RETURN = 'RETURN', 'Return'
        DAMAGE = 'DAMAGE', 'Damage'
        EXPIRED = 'EXPIRED', 'Expired'

    product = models.ForeignKey(
        Product, 
        on_delete=models.PROTECT, 
        related_name='stock_transactions'
    )
    transaction_type = models.CharField(
        max_length=20, 
        choices=TransactionType.choices
    )
    quantity = models.PositiveIntegerField(help_text="Absolute quantity changed")
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()
    
    reason = models.TextField(blank=True, help_text="Reason for adjustment/damage/etc.")
    reference_id = models.CharField(max_length=100, blank=True, null=True, help_text="Order ID or Receipt ID reference")
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='stock_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def clean(self):
        if self.quantity <= 0 and self.transaction_type != self.TransactionType.INITIAL:
            # We allow quantity=0 only if we are just logging something weird, but usually quantity > 0
            # Wait, the requirement says "quantity must be positive."
            if self.quantity == 0:
                raise ValidationError({"quantity": "Quantity must be positive (greater than zero)."})
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type} of {self.quantity} for {self.product.name}"

    class Meta:
        verbose_name = "Stock Transaction"
        verbose_name_plural = "Stock Transactions"
        ordering = ['-created_at']
