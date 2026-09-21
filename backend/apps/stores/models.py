from django.db import models
from django.core.exceptions import ValidationError

class Store(models.Model):
    name = models.CharField(max_length=255, help_text="Configurable name of the store.")
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_open = models.BooleanField(default=True)
    
    gst_number = models.CharField(max_length=50, blank=True, null=True, help_text="GST Number for billing.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        # Enforce single-store behavior
        if not self.pk and Store.objects.exists():
            raise ValidationError("Only one store instance can be created. Please edit the existing one.")
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.city}"

    class Meta:
        verbose_name = "Store"
        verbose_name_plural = "Store Configuration"
