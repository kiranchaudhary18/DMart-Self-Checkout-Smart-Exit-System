from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.name:
            self.name = self.name.strip()
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


class Product(models.Model):
    class UnitChoices(models.TextChoices):
        PIECE = 'PIECE', 'Piece'
        KG = 'KG', 'Kilogram'
        GRAM = 'GRAM', 'Gram'
        LITRE = 'LITRE', 'Litre'
        ML = 'ML', 'Millilitre'
        PACK = 'PACK', 'Pack'

    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT, 
        related_name='products',
        help_text="Category this product belongs to. Cannot delete a category if products exist."
    )
    
    name = models.CharField(max_length=255, db_index=True)
    barcode = models.CharField(max_length=100, unique=True, db_index=True, help_text="Scan barcode")
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    gst_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    unit = models.CharField(
        max_length=20,
        choices=UnitChoices.choices,
        default=UnitChoices.PIECE
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.barcode:
            self.barcode = str(self.barcode).strip()
            if not self.barcode:
                from django.core.exceptions import ValidationError
                raise ValidationError({"barcode": "Barcode cannot be empty."})
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
