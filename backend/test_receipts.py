import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.orders.models import Order, OrderItem, Receipt
from apps.payments.models import Payment

class ReceiptsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='rec_c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='rec_c2@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "rec_c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "rec_c2@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.00", gst_percentage="5.00")
        
        # Unpaid Order
        self.order_unpaid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('100.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('100.00'),
            gst_amount=Decimal('5.00'),
            total_amount=Decimal('105.00'),
            status=Order.OrderStatus.CREATED,
            payment_status=Order.PaymentStatus.PENDING
        )
        OrderItem.objects.create(
            order=self.order_unpaid, product=self.prodA, product_name="A", barcode="111", 
            quantity=1, unit_price=Decimal('100.00'), gst_percentage=Decimal('5.00'),
            discount_amount=Decimal('0.00'), taxable_amount=Decimal('100.00'),
            gst_amount=Decimal('5.00'), total_amount=Decimal('105.00')
        )
        
        # Paid Order
        self.order_paid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('200.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('200.00'),
            gst_amount=Decimal('10.00'),
            total_amount=Decimal('210.00'),
            status=Order.OrderStatus.PAID,
            payment_status=Order.PaymentStatus.PAID
        )
        OrderItem.objects.create(
            order=self.order_paid, product=self.prodA, product_name="A", barcode="111", 
            quantity=2, unit_price=Decimal('100.00'), gst_percentage=Decimal('5.00'),
            discount_amount=Decimal('0.00'), taxable_amount=Decimal('200.00'),
            gst_amount=Decimal('10.00'), total_amount=Decimal('210.00')
        )
        
        self.payment = Payment.objects.create(
            order=self.order_paid,
            razorpay_order_id='order_123',
            razorpay_payment_id='pay_123',
            razorpay_signature='secret_hash',
            amount=Decimal('210.00'),
            status=Payment.PaymentStatus.SUCCESS
        )

        self.history_url = reverse('purchase-history')

    def test_unpaid_order_receipt_rejection(self):
        # We can trigger receipt generation via ReceiptDetailView using order_number
        url = reverse('receipt-detail', kwargs={'receipt_number': 'dummy'}) # We don't have receipt number yet, use order API or direct service
        
        # The view accepts order_number as query param? No, in urls we defined <str:receipt_number>/
        # Let's call the receipt detail with order_number
        # Wait, the view is mapped as /api/receipts/<str:receipt_number>/, it can't accept order_number via URL.
        # But wait, how does a user get the receipt number if they only have the order?
        # In OrderDetailSerializer, the receipt is nested. If the receipt isn't there yet, they can't see it.
        # So we should call order detail to trigger generation? 
        # Ah, in views I have: def get(self, request, receipt_number=None, order_number=None) but URL only routes <str:receipt_number>/. 
        # Actually in Phase 9 Part 2, user said: "When a successfully paid order is requested for its receipt... Generate it". 
        # Let's test the service directly for generation logic.
        from apps.orders.services import ReceiptService
        
        with self.assertRaises(ValueError):
            ReceiptService.generate_receipt(self.order_unpaid)
            
        self.assertEqual(Receipt.objects.count(), 0)

    def test_paid_order_receipt_generation_and_duplicates(self):
        from apps.orders.services import ReceiptService
        
        receipt = ReceiptService.generate_receipt(self.order_paid)
        self.assertIsNotNone(receipt)
        self.assertTrue(receipt.receipt_number.startswith("DMART-REC-"))
        
        # Test duplicate prevention (Idempotency)
        receipt2 = ReceiptService.generate_receipt(self.order_paid)
        self.assertEqual(receipt.id, receipt2.id)
        self.assertEqual(Receipt.objects.count(), 1)

    def test_receipt_api_ownership_and_security(self):
        from apps.orders.services import ReceiptService
        receipt = ReceiptService.generate_receipt(self.order_paid)
        
        url = reverse('receipt-detail', kwargs={'receipt_number': receipt.receipt_number})
        
        # C1 should access
        resp_c1 = self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp_c1.status_code, 200)
        data = resp_c1.json()['data']
        self.assertEqual(data['receipt_number'], receipt.receipt_number)
        
        # Payment reference should be safe
        payment_ref = data['payment_reference']
        self.assertIsNotNone(payment_ref)
        self.assertEqual(payment_ref['razorpay_payment_id'], 'pay_123')
        self.assertNotIn('razorpay_signature', payment_ref)
        
        # C2 should be denied
        resp_c2 = self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp_c2.status_code, 404)

    def test_purchase_history_and_filters(self):
        # Customer 1 has 2 orders (1 PENDING, 1 PAID)
        resp = self.client.get(self.history_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(len(data), 2)
        
        # Filter by PAID
        resp_paid = self.client.get(self.history_url + '?payment_status=PAID', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        data_paid = resp_paid.json()['data']
        self.assertEqual(len(data_paid), 1)
        self.assertEqual(data_paid[0]['payment_status'], 'PAID')
