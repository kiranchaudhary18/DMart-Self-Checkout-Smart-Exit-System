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
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order, OrderItem

class OrdersTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        self.customer1 = User.objects.create_user(email='order_c1@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='order_c2@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "order_c1@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "order_c2@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        self.cat = Category.objects.create(name="Mix")
        
        # Product A: 100 Rs, 5% GST
        self.prodA = Product.objects.create(name="A", category=self.cat, barcode="111", sku="A1", price="100.00", gst_percentage="5.00")
        Inventory.objects.create(product=self.prodA, current_stock=10)
        
        # Cart for C1
        self.cart1 = Cart.objects.create(customer=self.customer1)
        CartItem.objects.create(cart=self.cart1, product=self.prodA, quantity=2, unit_price=self.prodA.price)

        self.checkout_url = reverse('order-checkout')
        self.list_url = reverse('order-list')

    def test_checkout_success_and_cart_transition(self):
        resp = self.client.post(self.checkout_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        data = resp.json()['data']
        self.assertEqual(data['status'], Order.OrderStatus.CREATED)
        self.assertEqual(data['payment_status'], Order.PaymentStatus.PENDING)
        
        # Validate Cart transitioned to CHECKED_OUT
        self.cart1.refresh_from_db()
        self.assertEqual(self.cart1.status, Cart.StatusChoices.CHECKED_OUT)
        
        # Validate new ACTIVE cart is ready for future
        resp_cart = self.client.get(reverse('cart-detail'), HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        new_cart_id = resp_cart.json()['data']['id']
        self.assertNotEqual(new_cart_id, self.cart1.id)

    def test_order_snapshot_integrity(self):
        self.client.post(self.checkout_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        order = Order.objects.get(customer=self.customer1)
        order_item = order.items.first()
        
        original_price = order_item.unit_price
        original_name = order_item.product_name
        original_gst = order_item.gst_percentage
        
        # Change Product completely
        self.prodA.price = Decimal('999.00')
        self.prodA.name = "Hacked Product"
        self.prodA.gst_percentage = Decimal('18.00')
        self.prodA.save()
        
        # Check snapshot remains immutable
        order_item.refresh_from_db()
        self.assertEqual(order_item.unit_price, original_price)
        self.assertEqual(order_item.product_name, original_name)
        self.assertEqual(order_item.gst_percentage, original_gst)

    def test_checkout_empty_cart(self):
        CartItem.objects.all().delete()
        
        resp = self.client.post(self.checkout_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_insufficient_stock(self):
        CartItem.objects.all().delete()
        CartItem.objects.create(cart=self.cart1, product=self.prodA, quantity=15, unit_price=self.prodA.price)
        
        resp = self.client.post(self.checkout_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_ownership_and_status_security(self):
        resp = self.client.post(self.checkout_url, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        order_number = resp.json()['data']['order_number']
        
        detail_url = reverse('order-detail', kwargs={'order_number': order_number})
        
        # C2 attempts to read C1's order
        resp2 = self.client.get(detail_url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp2.status_code, 404)
        
        # C1 attempts to tamper with status via API (should be ignored by serializer since they are read_only)
        # Even if they try to patch, we didn't expose a PATCH endpoint. 
        # The serializer protects against status injection.
        # So we can't test a PATCH, but we can verify the API is read-only.
        resp3 = self.client.patch(detail_url, {"status": "PAID"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp3.status_code, 405) # Method not allowed
