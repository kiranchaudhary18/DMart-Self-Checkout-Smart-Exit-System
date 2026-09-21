import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.cart.models import Cart, CartItem
from decimal import Decimal
import json

class CartTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create users
        self.admin = User.objects.create_superuser(email='admin_cart@dmart.com', password='Password123!')
        self.security = User.objects.create_user(email='security_cart@dmart.com', password='Password123!', role=User.Role.SECURITY)
        self.customer1 = User.objects.create_user(email='customer1_cart@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        self.customer2 = User.objects.create_user(email='customer2_cart@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        # Generate tokens
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin_cart@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.security_token = self.client.post(reverse('auth_login'), {"email": "security_cart@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c1_token = self.client.post(reverse('auth_login'), {"email": "customer1_cart@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.c2_token = self.client.post(reverse('auth_login'), {"email": "customer2_cart@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        # Create Products and Inventory
        self.cat = Category.objects.create(name="Snacks")
        
        self.prodA = Product.objects.create(name="Chips", category=self.cat, barcode="000111", sku="C1", price="100.00", gst_percentage="0.00")
        Inventory.objects.create(product=self.prodA, current_stock=10)
        
        self.prodB = Product.objects.create(name="Cola", category=self.cat, barcode="000222", sku="C2", price="50.00", gst_percentage="0.00")
        Inventory.objects.create(product=self.prodB, current_stock=20)
        
        self.prod_inactive = Product.objects.create(name="Old", category=self.cat, barcode="999", sku="O1", price="10.00", gst_percentage="0.00", is_active=False)
        Inventory.objects.create(product=self.prod_inactive, current_stock=5)
        
        # Endpoints
        self.cart_url = reverse('cart-detail')
        self.add_url = reverse('cart-item-add')
        self.barcode_url = reverse('cart-item-barcode-add')
        self.clear_url = reverse('cart-clear')

    def test_cart_creation_and_isolation(self):
        # Customer 1 access creates active cart
        resp1 = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(Cart.objects.filter(customer=self.customer1).count(), 1)
        c1_cart_id = resp1.json()['data']['id']
        
        # Calling again returns same cart
        resp2 = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.json()['data']['id'], c1_cart_id)
        self.assertEqual(Cart.objects.filter(customer=self.customer1).count(), 1)
        
        # Customer 2 gets own cart
        resp3 = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        c2_cart_id = resp3.json()['data']['id']
        self.assertNotEqual(c1_cart_id, c2_cart_id)
        
        # Security/Admin rejected
        resp_sec = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.security_token}')
        self.assertEqual(resp_sec.status_code, 403)
        resp_admin = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_admin.status_code, 403)

    def test_add_product_and_duplicates(self):
        # Add Product A
        resp = self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 1}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        cart = Cart.objects.get(customer=self.customer1)
        self.assertEqual(cart.items.count(), 1)
        self.assertEqual(cart.items.first().quantity, 1)
        
        # Add Product A again (duplicate handling)
        self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 2}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        # Still 1 item, quantity increased to 3
        self.assertEqual(cart.items.count(), 1)
        self.assertEqual(cart.items.first().quantity, 3)

    def test_barcode_add_and_validation(self):
        # Valid barcode (leading zero)
        resp = self.client.post(self.barcode_url, {"barcode": "000111", "quantity": 1}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        cart = Cart.objects.get(customer=self.customer1)
        self.assertEqual(cart.items.first().product, self.prodA)
        
        # Invalid barcode
        resp2 = self.client.post(self.barcode_url, {"barcode": "xx"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 400) # DRF validation throws 400 for invalid barcode in serializer
        
        # Inactive product
        resp3 = self.client.post(self.barcode_url, {"barcode": "999"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp3.status_code, 400)

    def test_stock_validation(self):
        # prodA has 10 stock
        # Try adding 15
        resp = self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 15}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 400)
        
        # Add 5 (success)
        self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 5}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        cart = Cart.objects.get(customer=self.customer1)
        item = cart.items.first()
        update_url = reverse('cart-item-detail', kwargs={'item_id': item.id})
        
        # Update to 10 (allowed)
        resp2 = self.client.patch(update_url, {"quantity": 10}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 200)
        
        # Update to 11 (rejected)
        resp3 = self.client.patch(update_url, {"quantity": 11}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp3.status_code, 400)

    def test_price_security_and_totals(self):
        # Maliciously attempt to set unit_price to 1
        self.client.post(self.add_url, {
            "product_id": self.prodA.id, 
            "quantity": 2, 
            "unit_price": 1 
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        self.client.post(self.add_url, {
            "product_id": self.prodB.id, 
            "quantity": 3
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        resp = self.client.get(self.cart_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        data = resp.json()['data']
        
        # Check totals
        # A: 2 * 100 = 200
        # B: 3 * 50 = 150
        # Subtotal: 350
        
        self.assertEqual(data['subtotal'], "350.00")
        self.assertEqual(data['total_item_count'], 5)
        
        items = data['items']
        itemA = next(i for i in items if i['product'] == self.prodA.id)
        # Verify unit price ignored the frontend input
        self.assertEqual(itemA['unit_price'], "100.00")
        self.assertEqual(itemA['item_total'], "200.00")

    def test_update_and_remove_item_permissions(self):
        # C1 adds product
        self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 1}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        cart_c1 = Cart.objects.get(customer=self.customer1)
        item_id = cart_c1.items.first().id
        
        update_url = reverse('cart-item-detail', kwargs={'item_id': item_id})
        
        # Update valid
        resp1 = self.client.patch(update_url, {"quantity": 3}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp1.status_code, 200)
        
        # Update negative/zero
        resp2 = self.client.patch(update_url, {"quantity": 0}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp2.status_code, 400)
        
        # C2 attempts to update C1's item
        resp3 = self.client.patch(update_url, {"quantity": 2}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp3.status_code, 404) # Not found in C2's active cart
        
        # C2 attempts to delete C1's item
        resp4 = self.client.delete(update_url, HTTP_AUTHORIZATION=f'Bearer {self.c2_token}')
        self.assertEqual(resp4.status_code, 404)
        
        # C1 deletes own item
        resp5 = self.client.delete(update_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp5.status_code, 200)
        self.assertEqual(cart_c1.items.count(), 0)

    def test_clear_cart(self):
        self.client.post(self.add_url, {"product_id": self.prodA.id, "quantity": 1}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.client.post(self.add_url, {"product_id": self.prodB.id, "quantity": 1}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        
        resp = self.client.delete(self.clear_url, HTTP_AUTHORIZATION=f'Bearer {self.c1_token}')
        self.assertEqual(resp.status_code, 200)
        
        cart = Cart.objects.get(customer=self.customer1)
        self.assertEqual(cart.items.count(), 0)
        # Cart remains active
        self.assertEqual(cart.status, Cart.StatusChoices.ACTIVE)
