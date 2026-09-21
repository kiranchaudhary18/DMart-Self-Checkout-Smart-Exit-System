import os
import django
import json
from decimal import Decimal
from datetime import timedelta
import threading

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.orders.models import Order
from apps.exit_verification.models import ExitToken, ExitVerification, SuspiciousActivity
from apps.exit_verification.services import ExitTokenService

class ExitSecurityTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer = User.objects.create_user(email='c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.security = User.objects.create_user(email='sec@dmart.com', password='Password123!', role=User.Role.SECURITY)
        self.admin = User.objects.create_superuser(email='admin@dmart.com', password='Password123!')
        
        self.c_token = self.client.post(reverse('auth_login'), {"email": "c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.sec_token = self.client.post(reverse('auth_login'), {"email": "sec@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.order_paid = Order.objects.create(
            customer=self.customer, subtotal=Decimal('100.00'),
            taxable_amount=Decimal('100.00'), total_amount=Decimal('100.00'),
            discount_amount=Decimal('0.00'), gst_amount=Decimal('0.00'),
            status=Order.OrderStatus.PAID, payment_status=Order.PaymentStatus.PAID
        )
        self.order_paid.order_number = "ORD-SEC-1"
        self.order_paid.save()

        self.order_unpaid = Order.objects.create(
            customer=self.customer, subtotal=Decimal('100.00'),
            taxable_amount=Decimal('100.00'), total_amount=Decimal('100.00'),
            discount_amount=Decimal('0.00'), gst_amount=Decimal('0.00'),
            status=Order.OrderStatus.CREATED, payment_status=Order.PaymentStatus.PENDING
        )
        self.order_unpaid.order_number = "ORD-SEC-2"
        self.order_unpaid.save()

        self.verify_url = reverse('exit-verify')

    def _generate_valid_payload(self, order):
        token, raw = ExitTokenService.create_exit_token(order)
        return json.dumps({
            "type": "DMART_EXIT",
            "reference": token.token_reference,
            "token": raw
        })

    def test_valid_qr(self):
        qr_data = self._generate_valid_payload(self.order_paid)
        
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['status'], 'allowed')
        
        token = ExitToken.objects.get(order=self.order_paid)
        self.assertEqual(token.status, ExitToken.TokenStatus.USED)
        self.assertIsNotNone(token.used_at)
        
        verify = ExitVerification.objects.last()
        self.assertEqual(verify.result, ExitVerification.VerificationResult.ALLOWED)
        self.assertEqual(verify.verified_by, self.security)

    def test_second_scan_fails(self):
        qr_data = self._generate_valid_payload(self.order_paid)
        
        resp1 = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp1.status_code, 200)
        
        resp2 = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp2.status_code, 400)
        self.assertEqual(resp2.json()['status'], 'rejected')
        self.assertEqual(resp2.json()['reason'], 'TOKEN_ALREADY_USED')

        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.USED_TOKEN_ATTEMPT)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.MEDIUM)

    def test_expired_qr(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        token.expires_at = timezone.now() - timedelta(minutes=1)
        token.save()
        
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": token.token_reference, "token": raw})
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()['reason'], 'TOKEN_EXPIRED')
        
        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.EXPIRED_TOKEN_ATTEMPT)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.LOW)

    def test_invalid_token(self):
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": "DMART-EXIT-FAKE", "token": "faketoken123"})
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()['reason'], 'INVALID_TOKEN')

        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.INVALID_TOKEN)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.MEDIUM)

    def test_invalid_qr_format(self):
        qr_data = json.dumps({"hello": "world"})
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()['reason'], 'INVALID_QR_FORMAT')

        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.INVALID_QR)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.LOW)

    def test_payment_not_completed(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        
        # Spoof unpaid payment status in backend
        self.order_paid.payment_status = Order.PaymentStatus.FAILED
        self.order_paid.save()
        
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": token.token_reference, "token": raw})
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()['reason'], 'PAYMENT_NOT_COMPLETED')

        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.PAYMENT_MISMATCH)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.HIGH)

    def test_revoked_token(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        token.status = ExitToken.TokenStatus.REVOKED
        token.save()
        
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": token.token_reference, "token": raw})
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        
        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.REVOKED_TOKEN_ATTEMPT)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.MEDIUM)

    def test_order_mismatch(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        
        # Send a valid token but with a mismatched order_number in the QR payload
        qr_data = json.dumps({
            "type": "DMART_EXIT", 
            "reference": token.token_reference, 
            "token": raw,
            "order_number": "FAKE-ORDER-999"
        })
        
        resp = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        self.assertEqual(resp.status_code, 400)
        
        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.ORDER_MISMATCH)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.HIGH)
        
    def test_no_secrets_stored(self):
        token, raw = ExitTokenService.create_exit_token(self.order_paid)
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": "FAKE", "token": raw})
        self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        
        act = SuspiciousActivity.objects.last()
        self.assertNotIn(raw, str(act.metadata))
        self.assertNotIn('password', str(act.metadata).lower())
        self.assertNotIn('secret', str(act.metadata).lower())

    def test_permissions(self):
        qr_data = self._generate_valid_payload(self.order_paid)
        
        # Customer
        resp_c = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c_token}')
        self.assertEqual(resp_c.status_code, 403)
        
        # Admin
        resp_a = self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_a.status_code, 200)

    def test_audit_record(self):
        qr_data = self._generate_valid_payload(self.order_paid)
        self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.sec_token}')
        
        record = ExitVerification.objects.last()
        self.assertEqual(record.order, self.order_paid)
        self.assertEqual(record.verified_by, self.security)
        self.assertEqual(record.result, ExitVerification.VerificationResult.ALLOWED)

        # Successful exit should NOT create a SuspiciousActivity
        self.assertFalse(SuspiciousActivity.objects.filter(order=self.order_paid).exists())

    def test_repeated_failure_detection(self):
        qr_data = json.dumps({"type": "DMART_EXIT", "reference": "FAKE_REF", "token": "faketoken123"})
        
        # 5 invalid scans
        for _ in range(5):
            self.client.post(
                self.verify_url, 
                {"qr_data": qr_data}, 
                content_type='application/json', 
                HTTP_AUTHORIZATION=f'Bearer {self.sec_token}',
                REMOTE_ADDR='192.168.1.5'
            )
            
        # Verify 5 INVALID_TOKEN activities were created
        self.assertEqual(SuspiciousActivity.objects.filter(activity_type=SuspiciousActivity.ActivityType.INVALID_TOKEN).count(), 5)
        
        # Verify exactly 1 REPEATED_FAILURES activity was created
        repeated = SuspiciousActivity.objects.filter(activity_type=SuspiciousActivity.ActivityType.REPEATED_FAILURES)
        self.assertEqual(repeated.count(), 1)
        self.assertEqual(repeated.first().severity, SuspiciousActivity.Severity.HIGH)
        self.assertEqual(repeated.first().user, self.security)
        
    def test_unauthorized_user_logging(self):
        qr_data = self._generate_valid_payload(self.order_paid)
        
        # Customer tries to verify
        self.client.post(self.verify_url, {"qr_data": qr_data}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c_token}')
        
        # Should log UNAUTHORIZED_VERIFICATION
        act = SuspiciousActivity.objects.last()
        self.assertEqual(act.activity_type, SuspiciousActivity.ActivityType.UNAUTHORIZED_VERIFICATION)
        self.assertEqual(act.user, self.customer)
        self.assertEqual(act.severity, SuspiciousActivity.Severity.HIGH)
