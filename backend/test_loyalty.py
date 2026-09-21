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
from apps.orders.models import Order, OrderItem
from apps.loyalty.models import LoyaltyAccount, LoyaltyTransaction
from apps.loyalty.services import LoyaltyService
from apps.payments.models import Payment

class LoyaltyTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='loy_c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='loy_c2@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.admin = User.objects.create_superuser(email='admin@dmart.com', password='Password123!')
        
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "loy_c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "loy_c2@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.00", gst_percentage="0.00")
        
        self.order_paid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('1500.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('1500.00'),
            gst_amount=Decimal('0.00'),
            total_amount=Decimal('1500.00'),
            status=Order.OrderStatus.PAID,
            payment_status=Order.PaymentStatus.PAID
        )
        self.order_paid.order_number = "DMART-ORD-1500"
        self.order_paid.save()
        
        self.order_unpaid = Order.objects.create(
            customer=self.customer1,
            subtotal=Decimal('1000.00'),
            discount_amount=Decimal('0.00'),
            taxable_amount=Decimal('1000.00'),
            gst_amount=Decimal('0.00'),
            total_amount=Decimal('1000.00'),
            status=Order.OrderStatus.CREATED,
            payment_status=Order.PaymentStatus.PENDING
        )

        self.balance_url = reverse('loyalty-balance')
        self.transactions_url = reverse('loyalty-transactions')
        self.adjust_url = reverse('loyalty-admin-adjust')

    def test_loyalty_account_creation(self):
        # Initial request should create account implicitly
        resp = self.client.get(self.balance_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['points_balance'], 0)
        
        self.assertEqual(LoyaltyAccount.objects.filter(customer=self.customer1).count(), 1)
        
        # Second request shouldn't create duplicate
        self.client.get(self.balance_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(LoyaltyAccount.objects.filter(customer=self.customer1).count(), 1)

    def test_point_calculation_logic(self):
        self.assertEqual(LoyaltyService.calculate_earn_points(Decimal('999.00')), 9)
        self.assertEqual(LoyaltyService.calculate_earn_points(Decimal('1000.00')), 10)
        self.assertEqual(LoyaltyService.calculate_earn_points(Decimal('1050.00')), 10)
        self.assertEqual(LoyaltyService.calculate_earn_points(Decimal('1999.00')), 19)
        self.assertEqual(LoyaltyService.calculate_earn_points(Decimal('2000.00')), 20)

    def test_paid_order_earning(self):
        trx = LoyaltyService.award_points_for_order(self.order_paid)
        self.assertIsNotNone(trx)
        self.assertEqual(trx.points, 15)
        self.assertEqual(trx.balance_before, 0)
        self.assertEqual(trx.balance_after, 15)
        
        account = LoyaltyAccount.objects.get(customer=self.customer1)
        self.assertEqual(account.points_balance, 15)
        self.assertEqual(account.lifetime_earned, 15)

    def test_unpaid_order_rejection(self):
        with self.assertRaises(ValueError):
            LoyaltyService.award_points_for_order(self.order_unpaid)

    def test_duplicate_earning_protection(self):
        LoyaltyService.award_points_for_order(self.order_paid)
        
        with self.assertRaises(ValueError):
            LoyaltyService.award_points_for_order(self.order_paid)
            
        account = LoyaltyAccount.objects.get(customer=self.customer1)
        self.assertEqual(account.points_balance, 15) # Should still be 15, not 30

    @patch('apps.payments.services.PaymentService.verify_payment_signature')
    def test_payment_callback_integration_and_idempotency(self, mock_verify):
        mock_verify.return_value = True
        
        payment = Payment.objects.create(
            order=self.order_unpaid,
            razorpay_order_id='order_rzp_1',
            amount=self.order_unpaid.total_amount,
            status=Payment.PaymentStatus.PENDING
        )
        
        payload = {
            "razorpay_order_id": "order_rzp_1",
            "razorpay_payment_id": "pay_rzp_1",
            "razorpay_signature": "valid_sig"
        }
        
        # Callback 1
        resp = self.client.post(reverse('payment-verify'), payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        account = LoyaltyAccount.objects.get(customer=self.customer1)
        self.assertEqual(account.points_balance, 10) # 1000 -> 10 points
        
        # Callback 2 (Simulating duplicate webhook/callback)
        resp2 = self.client.post(reverse('payment-verify'), payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 200)
        
        account.refresh_from_db()
        self.assertEqual(account.points_balance, 10) # Still 10

    def test_admin_adjustment_permissions_and_logic(self):
        # Customer tries to adjust
        resp_c = self.client.post(self.adjust_url, {
            "customer_id": self.customer1.id,
            "points": 100,
            "description": "Test"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp_c.status_code, 403)
        
        # Admin adds points
        resp_admin = self.client.post(self.adjust_url, {
            "customer_id": self.customer1.id,
            "points": 100,
            "description": "Bonus"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_admin.status_code, 200)
        
        account = LoyaltyAccount.objects.get(customer=self.customer1)
        self.assertEqual(account.points_balance, 100)
        
        # Admin removes points
        resp_admin_sub = self.client.post(self.adjust_url, {
            "customer_id": self.customer1.id,
            "points": -40,
            "description": "Penalty"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_admin_sub.status_code, 200)
        
        account.refresh_from_db()
        self.assertEqual(account.points_balance, 60)
        
        # Admin attempts to remove too many points
        resp_admin_err = self.client.post(self.adjust_url, {
            "customer_id": self.customer1.id,
            "points": -100,
            "description": "Invalid Penalty"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_admin_err.status_code, 400)
        
        account.refresh_from_db()
        self.assertEqual(account.points_balance, 60) # Still 60

    def test_customer_ownership_of_transactions(self):
        LoyaltyService.award_points_for_order(self.order_paid)
        
        # C1 checks their transactions
        resp_c1 = self.client.get(self.transactions_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp_c1.status_code, 200)
        self.assertEqual(len(resp_c1.json()['data']), 1)
        
        # C2 checks their transactions (should be empty)
        resp_c2 = self.client.get(self.transactions_url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp_c2.status_code, 200)
        self.assertEqual(len(resp_c2.json()['data']), 0)
