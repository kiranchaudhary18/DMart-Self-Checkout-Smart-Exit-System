import uuid
from django.db import models
from django.utils import timezone
from .models import Order

class ReceiptService:
    @staticmethod
    def generate_receipt(order: Order):
        """
        Generates a digital receipt for a successfully paid order.
        If a receipt already exists, it returns the existing one.
        """
        if order.payment_status != Order.PaymentStatus.PAID:
            raise ValueError("Cannot generate receipt for unpaid orders.")
            
        from .models import Receipt # Import here to avoid circular imports if needed
        
        # Check if receipt already exists
        receipt = getattr(order, 'receipt', None)
        if receipt:
            return receipt
            
        # Create a new receipt
        date_str = timezone.now().strftime('%Y%m%d')
        unique_suffix = uuid.uuid4().hex[:6].upper()
        receipt_number = f"DMART-REC-{date_str}-{unique_suffix}"
        
        receipt = Receipt.objects.create(
            order=order,
            receipt_number=receipt_number
        )
        
        try:
            from apps.notifications.services import send_receipt_ready
            send_receipt_ready(order)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send receipt notification: {e}")
        
        return receipt
