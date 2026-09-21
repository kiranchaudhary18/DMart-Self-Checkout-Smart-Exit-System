from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

from apps.accounts.models import User
from apps.products.models import Product

class Cart(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        CHECKED_OUT = 'CHECKED_OUT', 'Checked Out'
        ABANDONED = 'ABANDONED', 'Abandoned'

    customer = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='carts'
    )
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.ACTIVE
    )
    applied_coupon = models.ForeignKey(
        'coupons.Coupon',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='carts'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.status == self.StatusChoices.ACTIVE:
            # Check if this customer already has an active cart (exclude self)
            active_carts = Cart.objects.filter(customer=self.customer, status=self.StatusChoices.ACTIVE)
            if self.pk:
                active_carts = active_carts.exclude(pk=self.pk)
            
            if active_carts.exists():
                raise ValidationError({"status": "Customer can only have one ACTIVE cart at a time."})
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        # Calculate dynamically: sum(item.quantity * item.unit_price)
        total = sum((item.quantity * item.unit_price) for item in self.items.all())
        return total

    def __str__(self):
        return f"Cart #{self.id} - {self.customer.email} ({self.status})"

    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"
        constraints = [
            models.UniqueConstraint(
                fields=['customer'], 
                condition=models.Q(status='ACTIVE'), 
                name='unique_active_cart_per_customer'
            )
        ]


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.PROTECT, 
        related_name='cart_items'
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price of the product at the time it was added to the cart."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({"quantity": "Quantity must be a positive integer."})
            
        if self.unit_price is None and self.product_id:
            # Enforce that unit price matches product price upon creation if not provided
            # (In API it will be enforced, but safe to default here)
            self.unit_price = self.product.price
            
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def item_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Cart #{self.cart_id}"

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'product'], 
                name='unique_product_per_cart'
            )
        ]
