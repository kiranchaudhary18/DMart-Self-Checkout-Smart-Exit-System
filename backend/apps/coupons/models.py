from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage'
        FIXED = 'FIXED', 'Fixed Amount'

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    
    discount_type = models.CharField(
        max_length=20, 
        choices=DiscountType.choices
    )
    discount_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    minimum_cart_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    maximum_discount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Format code
        if self.code:
            self.code = str(self.code).strip().upper()
            
        # Validate discount limits
        if self.discount_type == self.DiscountType.PERCENTAGE:
            if self.discount_value > Decimal('100.00'):
                raise ValidationError({"discount_value": "Percentage discount cannot exceed 100%."})
                
        # Validate used count
        if self.usage_limit is not None and self.used_count > self.usage_limit:
            raise ValidationError({"used_count": "Used count cannot exceed usage limit."})
            
        # Validate dates
        if self.valid_from and self.valid_until:
            if self.valid_until <= self.valid_from:
                raise ValidationError({"valid_until": "Valid until date must be after valid from date."})

        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def is_valid_for_cart(self, cart_subtotal):
        """
        Check if the coupon is structurally valid and meets cart minimums.
        """
        if not self.is_active:
            return False, "Coupon is inactive."
            
        now = timezone.now()
        if now < self.valid_from:
            return False, "Coupon is not valid yet."
        if now > self.valid_until:
            return False, "Coupon has expired."
            
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return False, "Coupon usage limit exceeded."
            
        if cart_subtotal < self.minimum_cart_value:
            return False, f"Minimum cart value of {self.minimum_cart_value} is required."
            
        return True, "Coupon is valid."

    def calculate_discount(self, subtotal):
        """
        Calculate the exact discount amount based on subtotal.
        """
        is_valid, _ = self.is_valid_for_cart(subtotal)
        if not is_valid:
            return Decimal('0.00')

        discount = Decimal('0.00')

        if self.discount_type == self.DiscountType.FIXED:
            discount = self.discount_value
        elif self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (subtotal * self.discount_value) / Decimal('100.00')

        if self.maximum_discount:
            discount = min(discount, self.maximum_discount)

        # Ensure discount does not exceed subtotal
        discount = min(discount, subtotal)
        
        # Consistent rounding for Indian Currency
        return discount.quantize(Decimal('0.00'))

    def __str__(self):
        return f"{self.code} ({self.discount_type})"

    class Meta:
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"
