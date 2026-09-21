import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from apps.accounts.models import User
from apps.products.models import Category, Product
from apps.inventory.models import Inventory, StockTransaction
import json

class InventoryTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create users
        self.admin = User.objects.create_superuser(email='admin_inv@dmart.com', password='Password123!')
        self.security = User.objects.create_user(email='security_inv@dmart.com', password='Password123!', role=User.Role.SECURITY)
        self.customer = User.objects.create_user(email='customer_inv@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        # Generate tokens
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin_inv@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.security_token = self.client.post(reverse('auth_login'), {"email": "security_inv@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.customer_token = self.client.post(reverse('auth_login'), {"email": "customer_inv@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        # Create Product
        self.cat = Category.objects.create(name="Groceries")
        self.product = Product.objects.create(
            name="Rice", category=self.cat, barcode="11111", sku="RICE1", price="50.00", gst_percentage="0.00"
        )
        
        # Endpoints
        self.adjust_url = reverse('inventory-adjust')
        self.low_stock_url = reverse('inventory-low-stock')
        self.tx_url = reverse('inventory-transactions')
        self.list_url = reverse('inventory-list')

    def test_inventory_creation_and_permissions(self):
        # Admin adjusts stock, auto-creates inventory
        payload = {
            "product_id": self.product.id,
            "quantity": 100,
            "transaction_type": "INITIAL",
            "reason": "Initial stock"
        }
        
        # Customer cannot create/adjust
        resp_c = self.client.post(self.adjust_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp_c.status_code, 403)
        
        # Security cannot create/adjust
        resp_s = self.client.post(self.adjust_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.security_token}')
        self.assertEqual(resp_s.status_code, 403)
        
        # Admin can create
        resp_a = self.client.post(self.adjust_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_a.status_code, 200)
        self.assertEqual(Inventory.objects.count(), 1)
        
        # Duplicate inventory creation via ORM should fail (IntegrityError due to OneToOneField)
        with self.assertRaises(IntegrityError):
            Inventory.objects.create(product=self.product, current_stock=10)

    def test_stock_addition_and_reduction(self):
        # 1. Addition (INITIAL)
        self.client.post(self.adjust_url, {
            "product_id": self.product.id, "quantity": 100, "transaction_type": "INITIAL"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        inv = Inventory.objects.get(product=self.product)
        self.assertEqual(inv.current_stock, 100)
        tx1 = StockTransaction.objects.first()
        self.assertEqual(tx1.new_stock, 100)
        
        # 2. Reduction (DAMAGE)
        self.client.post(self.adjust_url, {
            "product_id": self.product.id, "quantity": 10, "transaction_type": "DAMAGE"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        inv.refresh_from_db()
        self.assertEqual(inv.current_stock, 90)
        
        tx2 = StockTransaction.objects.order_by('-created_at').first()
        self.assertEqual(tx2.transaction_type, "DAMAGE")
        self.assertEqual(tx2.previous_stock, 100)
        self.assertEqual(tx2.new_stock, 90)
        self.assertEqual(tx2.quantity, 10)

    def test_negative_stock_prevention(self):
        Inventory.objects.create(product=self.product, current_stock=5)
        
        resp = self.client.post(self.adjust_url, {
            "product_id": self.product.id, "quantity": 10, "transaction_type": "DAMAGE"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        self.assertEqual(resp.status_code, 400)
        
        inv = Inventory.objects.get(product=self.product)
        self.assertEqual(inv.current_stock, 5) # Unchanged
        
        self.assertEqual(StockTransaction.objects.count(), 0) # No transaction log created

    def test_reserved_stock_validation(self):
        inv = Inventory.objects.create(product=self.product, current_stock=10)
        
        # Cannot set reserved > current
        inv.reserved_stock = 15
        with self.assertRaises(ValidationError):
            inv.clean()
            
        # Valid assignment
        inv.reserved_stock = 2
        inv.clean() # should pass
        inv.save()
        
        self.assertEqual(inv.available_stock, 8)

    def test_low_stock_api(self):
        inv = Inventory.objects.create(product=self.product, current_stock=10, reserved_stock=2, low_stock_threshold=10)
        # available = 8 (<= 10)
        
        resp = self.client.get(self.low_stock_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['count'], 1)
        self.assertEqual(resp.json()['results'][0]['available_stock'], 8)
        
        # Increase stock
        inv.current_stock = 20
        inv.save()
        # available = 18 (> 10)
        
        resp2 = self.client.get(self.low_stock_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp2.json()['count'], 0)

    def test_transaction_history(self):
        Inventory.objects.create(product=self.product, current_stock=0)
        
        self.client.post(self.adjust_url, {
            "product_id": self.product.id, "quantity": 50, "transaction_type": "RESTOCK"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        self.client.post(self.adjust_url, {
            "product_id": self.product.id, "quantity": 5, "transaction_type": "DAMAGE"
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        
        resp = self.client.get(self.tx_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 200)
        results = resp.json()['results']
        
        self.assertEqual(len(results), 2)
        # Newest first
        self.assertEqual(results[0]['transaction_type'], "DAMAGE")
        self.assertEqual(results[1]['transaction_type'], "RESTOCK")
