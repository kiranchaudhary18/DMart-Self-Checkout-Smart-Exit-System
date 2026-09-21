import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from django.core.exceptions import ValidationError
from apps.accounts.models import User
from apps.stores.models import Store
import json

class StoreTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.store_root_url = reverse('store_root')
        self.store_current_url = reverse('store_current')
        
        # Create users
        self.admin = User.objects.create_superuser(email='admin@dmart.com', password='Password123!')
        self.security = User.objects.create_user(email='security@dmart.com', password='Password123!', role=User.Role.SECURITY)
        self.customer = User.objects.create_user(email='customer@dmart.com', password='Password123!', role=User.Role.CUSTOMER)
        
        # Generate tokens
        self.admin_token = self.client.post(reverse('auth_login'), {"email": "admin@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.security_token = self.client.post(reverse('auth_login'), {"email": "security@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']
        self.customer_token = self.client.post(reverse('auth_login'), {"email": "customer@dmart.com", "password": "Password123!"}, content_type='application/json').json()['access']

    def test_single_store_constraint_model(self):
        Store.objects.create(name='DMart 1', city='Mumbai', opening_time='09:00:00', closing_time='22:00:00')
        
        with self.assertRaises(ValidationError):
            store2 = Store(name='DMart 2', city='Pune', opening_time='09:00:00', closing_time='22:00:00')
            store2.save()

    def test_get_store_authenticated(self):
        Store.objects.create(name='DMart 1', city='Mumbai', opening_time='09:00:00', closing_time='22:00:00')
        
        response = self.client.get(self.store_root_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data']['name'], 'DMart 1')
        
        response2 = self.client.get(self.store_current_url, HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(response2.status_code, 200)

    def test_get_store_unauthenticated(self):
        response = self.client.get(self.store_root_url)
        self.assertEqual(response.status_code, 401)

    def test_get_store_not_found(self):
        # When no store exists
        response = self.client.get(self.store_root_url, HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.assertEqual(response.status_code, 404)

    def test_admin_update_store(self):
        Store.objects.create(name='DMart 1', city='Mumbai', opening_time='09:00:00', closing_time='22:00:00')
        
        response = self.client.patch(
            self.store_current_url, 
            {"city": "Pune"}, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data']['city'], 'Pune')

    def test_customer_security_cannot_update_store(self):
        Store.objects.create(name='DMart 1', city='Mumbai', opening_time='09:00:00', closing_time='22:00:00')
        
        response_c = self.client.patch(self.store_current_url, {"city": "Pune"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        self.assertEqual(response_c.status_code, 403)
        
        response_s = self.client.patch(self.store_current_url, {"city": "Pune"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {self.security_token}')
        self.assertEqual(response_s.status_code, 403)

    def test_invalid_store_data_validation(self):
        Store.objects.create(name='DMart 1', city='Mumbai', opening_time='09:00:00', closing_time='22:00:00')
        
        # Invalid time format
        response = self.client.patch(
            self.store_current_url, 
            {"opening_time": "invalid-time"}, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('opening_time', response.json()['errors'])
