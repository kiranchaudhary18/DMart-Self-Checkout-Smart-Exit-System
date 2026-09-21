import os
import django
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.cart.models import Cart, CartItem
from apps.coupons.models import Coupon

class CouponsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        
        # Product A: 100 Rs, 5% GST
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.00", gst_percentage="5.00")
        Inventory.objects.create(product=self.prodA, current_stock=100)
        
        # Product B: 200 Rs, 18% GST
        self.prodB = Product.objects.create(name="B", category=self.cat, barcode="222", sku="B1", price="200.00", gst_percentage="18.00")
        Inventory.objects.create(product=self.prodB, current_stock=100)
        
        # Create Cart and add items
        self.cart = Cart.objects.create(customer=self.customer1)
        CartItem.objects.create(cart=self.cart, product=self.prodA, quantity=1, unit_price=self.prodA.price)
        CartItem.objects.create(cart=self.cart, product=self.prodB, quantity=1, unit_price=self.prodB.price)
        # Subtotal should be 300
        
        # Coupons
        now = timezone.now()
        
        self.coupon_percent = Coupon.objects.create(
            code="SAVE10",
            discount_type=Coupon.DiscountType.PERCENTAGE,
            discount_value=Decimal('10.00'),
            minimum_cart_value=Decimal('0.00'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=1),
            is_active=True
        )
        
        self.coupon_fixed = Coupon.objects.create(
            code="MINUS150",
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal('150.00'),
            minimum_cart_value=Decimal('0.00'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=1),
            is_active=True
        )
        
        self.coupon_max = Coupon.objects.create(
            code="MAX50",
            discount_type=Coupon.DiscountType.PERCENTAGE,
            discount_value=Decimal('50.00'), # 50%
            maximum_discount=Decimal('50.00'), # Cap at 50 Rs
            minimum_cart_value=Decimal('0.00'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=1),
            is_active=True
        )
        
        self.coupon_huge = Coupon.objects.create(
            code="HUGE500",
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal('500.00'), # Exceeds subtotal (300)
            minimum_cart_value=Decimal('0.00'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=1),
            is_active=True
        )
        
        self.coupon_min = Coupon.objects.create(
            code="MIN1000",
            discount_type=Coupon.DiscountType.FIXED,
            discount_value=Decimal('100.00'),
            minimum_cart_value=Decimal('1000.00'),
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=1),
            is_active=True
        )

        self.apply_url = reverse('coupon-apply')
        self.remove_url = reverse('coupon-remove')
        self.summary_url = reverse('cart-summary')

    def test_coupon_validation_rules(self):
        # Min cart value (cart is 300, min is 1000)
        resp1 = self.client.post(self.apply_url, {"code": "MIN1000"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp1.status_code, 400)
        
        # Make coupon inactive
        self.coupon_percent.is_active = False
        self.coupon_percent.save()
        resp2 = self.client.post(self.apply_url, {"code": "SAVE10"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 400)
        
        # Make active but expired
        self.coupon_percent.is_active = True
        self.coupon_percent.valid_until = timezone.now() - timedelta(days=1)
        self.coupon_percent.save()
        resp3 = self.client.post(self.apply_url, {"code": "SAVE10"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp3.status_code, 400)
        
        # Usage limit
        self.coupon_percent.valid_until = timezone.now() + timedelta(days=1)
        self.coupon_percent.usage_limit = 1
        self.coupon_percent.used_count = 1
        self.coupon_percent.save()
        resp4 = self.client.post(self.apply_url, {"code": "SAVE10"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp4.status_code, 400)

    def test_percentage_discount_and_multiple_gst(self):
        # Cart has ProdA (100) and ProdB (200) = Subtotal 300
        # Coupon: 10%
        resp = self.client.post(self.apply_url, {"code": "SAVE10"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(data['subtotal'], 300.0)
        self.assertEqual(data['discount'], 30.0)
        self.assertEqual(data['taxable_amount'], 270.0)
        self.assertEqual(data['gst'], 36.9)
        self.assertEqual(data['final_total'], 306.9)
        
        self.coupon_percent.refresh_from_db()
        self.assertEqual(self.coupon_percent.used_count, 0)

    def test_maximum_discount(self):
        resp = self.client.post(self.apply_url, {"code": "MAX50"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['discount'], 50.0)

    def test_fixed_discount(self):
        resp = self.client.post(self.apply_url, {"code": "MINUS150"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(data['discount'], 150.0)
        self.assertEqual(data['taxable_amount'], 150.0)
        self.assertEqual(data['gst'], 20.5)
        self.assertEqual(data['final_total'], 170.5)

    def test_discount_cannot_exceed_subtotal(self):
        resp = self.client.post(self.apply_url, {"code": "HUGE500"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(data['discount'], 300.0)
        self.assertEqual(data['taxable_amount'], 0.0)
        self.assertEqual(data['gst'], 0.0)
        self.assertEqual(data['final_total'], 0.0)

    def test_remove_coupon(self):
        self.client.post(self.apply_url, {"code": "SAVE10"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.cart.refresh_from_db()
        
        resp = self.client.post(self.remove_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(data['discount'], 0.0)
        self.assertIsNone(data.get('coupon'))

    def test_frontend_tampering_ignored(self):
        resp = self.client.post(self.apply_url, {
            "code": "SAVE10",
            "subtotal": 100000,
            "discount": 50000,
            "gst": 0
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        data = resp.json()['data']
        self.assertEqual(data['subtotal'], 300.0)
        self.assertEqual(data['discount'], 30.0)
