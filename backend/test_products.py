import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
from apps.products.models import Category, Product
import json

class ProductTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create users
        self.admin = User.objects.create_superuser(email='admin_prod@dmart.com', password='Password123!')
        self.security = User.objects.create_user(email='security_prod@dmart.com', password='Password123!', role=User.Role.SECURITY)
        self.customer = User.objects.create_user(email='customer_prod@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        # Generate tokens
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin_prod@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.security_token = self.client.post(reverse('auth_login'), {"email": "security_prod@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.customer_token = self.client.post(reverse('auth_login'), {"email": "customer_prod@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        
        # Endpoints
        self.category_url = '/api/products/categories/'
        self.product_url = '/api/products/'
        
    def test_category_creation_and_permissions(self):
        # Admin can create
        resp = self.client.post(self.category_url, {"name": "Grocery", "description": "Grocery Items"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 201)
        
        # Duplicate rejected
        resp2 = self.client.post(self.category_url, {"name": "Grocery"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("name", resp2.json())
        
        # Customer cannot create
        resp_c = self.client.post(self.category_url, {"name": "Dairy"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp_c.status_code, 403)

        # Security cannot create
        resp_s = self.client.post(self.category_url, {"name": "Snacks"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.security_token}')
        self.assertEqual(resp_s.status_code, 403)

    def test_product_creation_validation_permissions(self):
        cat = Category.objects.create(name="Beverages")
        
        payload = {
            "name": "Coke",
            "category": cat.id,
            "barcode": "0123456",
            "sku": "COKE1",
            "price": "40.00",
            "gst_percentage": "18.00",
            "unit": "PIECE"
        }
        
        # Admin creates successfully
        resp = self.client.post(self.product_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp.status_code, 201)
        
        # Customer cannot create
        resp_c = self.client.post(self.product_url, payload, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp_c.status_code, 403)
        
        # Duplicate barcode
        payload2 = payload.copy()
        payload2['sku'] = "COKE2"
        resp_dup_bc = self.client.post(self.product_url, payload2, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_dup_bc.status_code, 400)
        self.assertIn('barcode', resp_dup_bc.json())
        
        # Duplicate SKU
        payload3 = payload.copy()
        payload3['barcode'] = "99999"
        resp_dup_sku = self.client.post(self.product_url, payload3, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_dup_sku.status_code, 400)
        self.assertIn('sku', resp_dup_sku.json())
        
        # Negative price
        payload_neg = payload.copy()
        payload_neg['barcode'] = "11111"
        payload_neg['sku'] = "COKE3"
        payload_neg['price'] = "-10.00"
        resp_neg = self.client.post(self.product_url, payload_neg, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp_neg.status_code, 400)
        self.assertIn('price', resp_neg.json())
        
    def test_barcode_lookup(self):
        cat = Category.objects.create(name="Snacks")
        prod = Product.objects.create(
            name="Chips", category=cat, barcode="0012345", sku="CHIPS1",
            price="20.00", gst_percentage="12.00", unit="PACK", is_active=True
        )
        prod_inactive = Product.objects.create(
            name="Old Chips", category=cat, barcode="00999", sku="CHIPS_OLD",
            price="20.00", gst_percentage="12.00", unit="PACK", is_active=False
        )
        
        lookup_url = reverse('barcode-lookup', kwargs={'barcode': '0012345'})
        inactive_url = reverse('barcode-lookup', kwargs={'barcode': '00999'})
        notfound_url = reverse('barcode-lookup', kwargs={'barcode': 'xxxx'})
        
        # Valid barcode lookup (Customer)
        resp1 = self.client.get(lookup_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.json()['data']['name'], "Chips")
        
        # Inactive product hidden from customer
        resp2 = self.client.get(inactive_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp2.status_code, 404)
        
        # Inactive product visible to admin
        resp3 = self.client.get(inactive_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(resp3.status_code, 200)
        
        # Invalid barcode
        resp4 = self.client.get(notfound_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp4.status_code, 404)

    def test_search_and_filter(self):
        cat1 = Category.objects.create(name="Cat1")
        cat2 = Category.objects.create(name="Cat2")
        
        Product.objects.create(name="Item A", category=cat1, barcode="111", sku="SKU1", price="10", gst_percentage="0")
        Product.objects.create(name="Item B", category=cat1, barcode="222", sku="SKU2", price="20", gst_percentage="0", is_active=False)
        Product.objects.create(name="Other", category=cat2, barcode="333", sku="SKU3", price="30", gst_percentage="0")
        
        # Active filter for customer (should see 2 products)
        resp1 = self.client.get(self.product_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp1.json()['count'], 2)
        
        # Search by name
        resp2 = self.client.get(self.product_url + "?search=Item", HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp2.json()['count'], 1) # Only "Item A" is active
        
        # Filter by category
        resp3 = self.client.get(self.product_url + f"?category={cat2.id}", HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(resp3.json()['count'], 1)
        self.assertEqual(resp3.json()['results'][0]['name'], "Other")
