import json
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.products.models import Product, Category
from apps.orders.models import Order, OrderItem
from apps.inventory.models import Inventory
from apps.loyalty.models import LoyaltyAccount, LoyaltyTransaction
from apps.exit_verification.models import ExitToken, ExitVerification, SuspiciousActivity

class AnalyticsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@test.com', password='password123'
        )
        self.security = User.objects.create_user(
            email='sec@test.com', password='password123', role=User.Role.SECURITY
        )
        self.customer = User.objects.create_user(
            email='cust@test.com', password='password123', role=User.Role.CUSTOMER
        )
        
        # Auth tokens
        self.admin_token = self._get_token(self.admin)
        self.sec_token = self._get_token(self.security)
        self.cust_token = self._get_token(self.customer)
        
        # Create Products and Inventory
        self.category = Category.objects.create(name='Snacks')
        self.product1 = Product.objects.create(
            name='Chips', barcode='111', sku='111', price=Decimal('50.00'), category=self.category, gst_percentage=Decimal('5.00')
        )
        self.product2 = Product.objects.create(
            name='Biscuits', barcode='222', sku='222', price=Decimal('30.00'), category=self.category, gst_percentage=Decimal('5.00')
        )
        
        Inventory.objects.create(product=self.product1, current_stock=100, reserved_stock=0, low_stock_threshold=10)
        Inventory.objects.create(product=self.product2, current_stock=5, reserved_stock=0, low_stock_threshold=10)

        # Create Orders
        self.order_paid = Order.objects.create(
            customer=self.customer,
            subtotal=Decimal('95.00'),
            taxable_amount=Decimal('95.00'),
            total_amount=Decimal('100.00'),
            gst_amount=Decimal('5.00'),
            discount_amount=Decimal('0.00'),
            payment_status=Order.PaymentStatus.PAID,
            status=Order.OrderStatus.PAID
        )
        OrderItem.objects.create(
            order=self.order_paid, product=self.product1, 
            product_name=self.product1.name, barcode=self.product1.barcode,
            quantity=2, unit_price=Decimal('47.50'),
            gst_percentage=Decimal('5.00'), gst_amount=Decimal('5.00'), 
            taxable_amount=Decimal('95.00'), total_amount=Decimal('100.00'),
            discount_amount=Decimal('0.00')
        )
        
        self.order_unpaid = Order.objects.create(
            customer=self.customer,
            subtotal=Decimal('190.00'),
            taxable_amount=Decimal('190.00'),
            total_amount=Decimal('200.00'),
            gst_amount=Decimal('10.00'),
            discount_amount=Decimal('0.00'),
            payment_status=Order.PaymentStatus.PENDING,
            status=Order.OrderStatus.PAYMENT_PENDING
        )
        OrderItem.objects.create(
            order=self.order_unpaid, product=self.product2, 
            product_name=self.product2.name, barcode=self.product2.barcode,
            quantity=1, unit_price=Decimal('190.00'),
            gst_percentage=Decimal('5.00'), gst_amount=Decimal('10.00'), 
            taxable_amount=Decimal('190.00'), total_amount=Decimal('200.00'),
            discount_amount=Decimal('0.00')
        )

        # Loyalty
        self.loyalty, _ = LoyaltyAccount.objects.get_or_create(customer=self.customer)
        self.loyalty.points_balance = 50
        self.loyalty.lifetime_earned = 50
        self.loyalty.save()
        LoyaltyTransaction.objects.create(
            loyalty_account=self.loyalty, points=50, transaction_type=LoyaltyTransaction.TransactionType.EARN, description="Test"
        )
        
        # Security & Fraud
        self.token = ExitToken.objects.create(
            order=self.order_paid, token_hash="hash", token_reference="ref1", expires_at=timezone.now() + timedelta(minutes=10)
        )
        self.verification = ExitVerification.objects.create(
            exit_token=self.token, order=self.order_paid, verified_by=self.security,
            result=ExitVerification.VerificationResult.ALLOWED
        )
        self.fraud = SuspiciousActivity.objects.create(
            activity_type=SuspiciousActivity.ActivityType.INVALID_TOKEN,
            severity=SuspiciousActivity.Severity.MEDIUM,
            status=SuspiciousActivity.Status.OPEN
        )
        
    def _get_token(self, user):
        resp = self.client.post('/api/auth/login/', {'email': user.email, 'password': 'password123'}, format='json')
        return resp.json()['access']

    def test_permissions(self):
        urls = [
            '/api/analytics/dashboard/', '/api/analytics/sales/', '/api/analytics/orders/',
            '/api/analytics/products/', '/api/analytics/inventory/', '/api/analytics/customers/',
            '/api/analytics/loyalty/', '/api/analytics/security/', '/api/analytics/fraud/'
        ]
        for url in urls:
            # Unauthenticated
            self.assertEqual(self.client.get(url).status_code, 401)
            # Customer
            self.assertEqual(self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.cust_token}').status_code, 403)
            # Security
            self.assertEqual(self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.sec_token}').status_code, 403)
            # Admin
            self.assertEqual(self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}').status_code, 200)

    def test_sales_analytics(self):
        resp = self.client.get('/api/analytics/sales/', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        
        # Should only count paid order (100 total)
        self.assertEqual(float(data['total_sales']), 100.0)
        self.assertEqual(float(data['total_gst']), 5.0)
        self.assertEqual(data['order_count'], 1)
        self.assertEqual(float(data['average_order_value']), 100.0)
        
    def test_order_analytics(self):
        resp = self.client.get('/api/analytics/orders/', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        
        self.assertEqual(data['total_orders'], 2)
        self.assertEqual(data['paid_orders'], 1)
        self.assertEqual(data['pending_payment_orders'], 1)
        
    def test_product_analytics_historical_price(self):
        # Change current price
        self.product1.price = Decimal('100.00')
        self.product1.save()
        
        resp = self.client.get('/api/analytics/products/', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = resp.json()['data']
        
        # Revenue should be calculated from OrderItem (unit_price=50 * 2 = 100), not the updated product price.
        best = next(p for p in data['highest_revenue_products'] if p['product__name'] == 'Chips')
        self.assertEqual(float(best['total_revenue']), 95.0)
        
    def test_inventory_analytics(self):
        resp = self.client.get('/api/analytics/inventory/', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = resp.json()['data']
        
        self.assertEqual(data['total_stock'], 105)
        self.assertEqual(data['low_stock_count'], 1) # Biscuits have 5 available (low stock <= 10)
        self.assertEqual(data['out_of_stock_count'], 0)
        
    def test_date_filters_invalid(self):
        url = '/api/analytics/sales/?start_date=2026-01-10T00:00:00Z&end_date=2026-01-01T00:00:00Z'
        resp = self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()['message'], "start_date cannot be greater than end_date.")
        
        url_bad_format = '/api/analytics/sales/?start_date=bad-date'
        resp = self.client.get(url_bad_format, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 400)
        
    def test_dashboard_api(self):
        resp = self.client.get('/api/analytics/dashboard/', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        
        self.assertIn('sales', data)
        self.assertIn('orders', data)
        self.assertIn('customers', data)
        self.assertIn('inventory', data)
        self.assertIn('loyalty', data)
        self.assertIn('security', data)
        self.assertIn('fraud', data)
