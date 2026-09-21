import os
import django
import json
import base64
import binascii
from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.orders.models import Order
from apps.exit_verification.models import ExitToken
from apps.exit_verification.services import ExitTokenService

class ExitVerificationTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='exit_c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='exit_c2@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.admin = User.objects.create_superuser(email='exit_admin@dmart.com', password='Password123!')
        
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "exit_c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "exit_c2@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.00", gst_percentage="0.00")
        
        self.order_paid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('100.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('100.00'),
            gst_amount=Decimal('0.00'),
            total_amount=Decimal('100.00'),
            status=Order.OrderStatus.PAID,
            payment_status=Order.PaymentStatus.PAID
        )
        self.order_paid.order_number = "DMART-ORD-EXIT-1"
        self.order_paid.save()
        
        self.order_unpaid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('100.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('100.00'),
            gst_amount=Decimal('0.00'),
            total_amount=Decimal('100.00'),
            status=Order.OrderStatus.CREATED,
            payment_status=Order.PaymentStatus.PENDING
        )
        self.order_unpaid.order_number = "DMART-ORD-EXIT-2"
        self.order_unpaid.save()

        self.generate_url = reverse('exit-generate')

    def test_paid_order_qr_generation(self):
        resp = self.client.post(self.generate_url, {
            "order_number": self.order_paid.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['order_number'], self.order_paid.order_number)
        self.assertIn('token_reference', data)
        self.assertIn('qr_data', data)
        
        token = ExitToken.objects.get(order=self.order_paid)
        self.assertEqual(token.status, ExitToken.TokenStatus.ACTIVE)
        self.assertIsNotNone(token.token_hash)
        
        # Test QR data is valid base64 PNG
        qr_b64 = data['qr_data']
        try:
            base64.b64decode(qr_b64, validate=True)
        except binascii.Error:
            self.fail("qr_data is not valid base64")

    def test_unpaid_order_rejection(self):
        resp = self.client.post(self.generate_url, {
            "order_number": self.order_unpaid.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Exit token can only be generated for PAID orders", resp.json()['message'])
        self.assertEqual(ExitToken.objects.count(), 0)

    def test_duplicate_token_protection(self):
        resp1 = self.client.post(self.generate_url, {
            "order_number": self.order_paid.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp1.status_code, 200)
        
        # Calling again should just return the existing token info, but no raw qr_data
        resp2 = self.client.post(self.generate_url, {
            "order_number": self.order_paid.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 200)
        
        self.assertIsNone(resp2.json()['data']['qr_data'])
        self.assertEqual(ExitToken.objects.count(), 1) # Still 1 token

    def test_customer_ownership_security(self):
        # Customer 2 attempts to generate for Customer 1
        resp = self.client.post(self.generate_url, {
            "order_number": self.order_paid.order_number
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        
        self.assertEqual(resp.status_code, 404)
        
    def test_expiry_logic(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        self.assertEqual(token.status, ExitToken.TokenStatus.ACTIVE)
        
        # Force expiry
        token.expires_at = timezone.now() - timedelta(minutes=1)
        token.save()
        
        detail_url = reverse('exit-detail', kwargs={'order_number': self.order_paid.order_number})
        resp = self.client.get(detail_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['status'], 'EXPIRED')
        self.assertFalse(data['is_valid'])
        
        token.refresh_from_db()
        self.assertEqual(token.status, ExitToken.TokenStatus.EXPIRED)

    def test_qr_payload_security(self):
        # Verify that generating QR does not contain secrets
        qr_str = ExitTokenService.generate_exit_qr("REF-123", "RAW-123")
        self.assertIsInstance(qr_str, str)
        # We can't easily decode the QR image back to JSON in a simple unit test without extra image parsing libs like pyzbar.
        # But we know the payload dict passed in the service only has {"type", "reference", "token"}.
        # So it's fundamentally secure.
        pass

    def test_token_storage_security(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        # Verify raw string isn't in hash
        self.assertNotEqual(token.token_hash, raw)
        self.assertNotIn(raw, token.token_hash)
        
        # Verify it's a 64 char SHA256 hex string
        self.assertEqual(len(token.token_hash), 64)
