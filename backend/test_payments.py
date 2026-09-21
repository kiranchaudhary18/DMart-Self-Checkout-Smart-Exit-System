import os
import django
from decimal import Decimal
from unittest.mock import patch

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.services import PaymentService

class PaymentsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='pay_c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='pay_c2@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "pay_c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "pay_c2@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.50", gst_percentage="0.00")
        Inventory.objects.create(product=self.prodA, current_stock=10)
        
        # Create an Order manually for testing payments
        self.order1 = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('100.50'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('100.50'),
            gst_amount=Decimal('0.00'),
            total_amount=Decimal('100.50'),
            status=Order.OrderStatus.CREATED,
            payment_status=Order.PaymentStatus.PENDING
        )
        self.order1.order_number = "DMART-TEST-123456"
        self.order1.save()

        self.create_url = reverse('payment-create')
        self.verify_url = reverse('payment-verify')

    def test_decimal_inr_to_paise(self):
        # 100.50 -> 10050
        paise = PaymentService.decimal_inr_to_paise(Decimal('100.50'))
        self.assertEqual(paise, 10050)
        
        # 100 -> 10000
        paise = PaymentService.decimal_inr_to_paise(Decimal('100'))
        self.assertEqual(paise, 10000)

    @patch('apps.payments.services.PaymentService.create_razorpay_order')
    def test_payment_creation_and_amount_security(self, mock_create):
        mock_create.return_value = {'id': 'order_rzp_1234'}
        
        # Even if frontend sends fake amount, backend ignores it
        resp = self.client.post(self.create_url, {
            "order_number": self.order1.order_number,
            "amount": 1  # Fake amount
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['razorpay_order_id'], 'order_rzp_1234')
        self.assertEqual(data['amount'], 100.5)  # Exact from Order
        
        payment = Payment.objects.get(order=self.order1)
        self.assertEqual(payment.amount, Decimal('100.50'))
        self.assertEqual(payment.status, Payment.PaymentStatus.PENDING)

    @patch('apps.payments.services.PaymentService.create_razorpay_order')
    def test_customer_ownership_security(self, mock_create):
        mock_create.return_value = {'id': 'order_rzp_1234'}
        
        # Customer 2 tries to create payment for Customer 1's order
        resp = self.client.post(self.create_url, {
            "order_number": self.order1.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        
        self.assertEqual(resp.status_code, 404) # Not Found or Access Denied
        
    @patch('apps.payments.services.PaymentService.verify_payment_signature')
    def test_signature_verification_success_and_idempotency(self, mock_verify):
        mock_verify.return_value = True
        
        payment = Payment.objects.create(
            order=self.order1,
            razorpay_order_id='order_rzp_1234',
            amount=self.order1.total_amount,
            status=Payment.PaymentStatus.PENDING
        )
        
        payload = {
            "razorpay_order_id": "order_rzp_1234",
            "razorpay_payment_id": "pay_rzp_5678",
            "razorpay_signature": "valid_signature_hash"
        }
        
        resp = self.client.post(self.verify_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.PaymentStatus.SUCCESS)
        
        self.order1.refresh_from_db()
        self.assertEqual(self.order1.status, Order.OrderStatus.PAID)
        self.assertEqual(self.order1.payment_status, Order.PaymentStatus.PAID)
        
        # Test Idempotency
        resp2 = self.client.post(self.verify_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 200) # Still 200 OK
        
    @patch('apps.payments.services.PaymentService.verify_payment_signature')
    def test_invalid_signature_rejection(self, mock_verify):
        mock_verify.return_value = False
        
        payment = Payment.objects.create(
            order=self.order1,
            razorpay_order_id='order_rzp_1234',
            amount=self.order1.total_amount,
            status=Payment.PaymentStatus.PENDING
        )
        
        payload = {
            "razorpay_order_id": "order_rzp_1234",
            "razorpay_payment_id": "pay_rzp_9999",
            "razorpay_signature": "invalid_signature_hash"
        }
        
        resp = self.client.post(self.verify_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 400)
        
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.PaymentStatus.FAILED)
        
        self.order1.refresh_from_db()
        self.assertEqual(self.order1.status, Order.OrderStatus.PAYMENT_FAILED)

    def test_payment_detail_ownership_and_security(self):
        payment = Payment.objects.create(
            order=self.order1,
            razorpay_order_id='order_rzp_1234',
            amount=self.order1.total_amount,
            status=Payment.PaymentStatus.PENDING
        )
        
        detail_url = reverse('payment-detail', kwargs={'order_number': self.order1.order_number})
        
        # C2 should be denied
        resp_c2 = self.client.get(detail_url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp_c2.status_code, 404)
        
        # C1 should see safe details
        resp_c1 = self.client.get(detail_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp_c1.status_code, 200)
        data = resp_c1.json()['data']
        
        # Verify secret/signatures are NOT exposed
        self.assertNotIn('razorpay_signature', data)
        self.assertNotIn('razorpay_key_secret', data)
        self.assertEqual(data['amount'], "100.50")
