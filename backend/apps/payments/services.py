import razorpay
from django.conf import settings
from decimal import Decimal
from decimal import ROUND_HALF_UP

class PaymentService:
    @staticmethod
    def get_razorpay_client():
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise ValueError("Razorpay credentials are not fully configured in environment.")
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
    @staticmethod
    def decimal_inr_to_paise(amount: Decimal) -> int:
        """
        Converts Decimal INR to integer paise safely avoiding float issues.
        Example: 100.50 -> 10050
        """
        if amount < 0:
            raise ValueError("Amount cannot be negative.")
            
        # Quantize to 2 decimal places to be safe, then multiply by 100 and convert to int
        quantized = amount.quantize(Decimal('0.00'), rounding=ROUND_HALF_UP)
        paise = int(quantized * Decimal('100'))
        return paise

    @staticmethod
    def create_razorpay_order(amount: Decimal, currency: str = 'INR', receipt: str = None) -> dict:
        """
        Creates a Razorpay order securely on the backend.
        """
        client = PaymentService.get_razorpay_client()
        
        paise_amount = PaymentService.decimal_inr_to_paise(amount)
        
        data = {
            "amount": paise_amount,
            "currency": currency,
        }
        if receipt:
            data["receipt"] = str(receipt)
            
        razorpay_order = client.order.create(data=data)
        return razorpay_order

    @staticmethod
    def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verifies the Razorpay signature.
        """
        client = PaymentService.get_razorpay_client()
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        try:
            client.utility.verify_payment_signature(params_dict)
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
