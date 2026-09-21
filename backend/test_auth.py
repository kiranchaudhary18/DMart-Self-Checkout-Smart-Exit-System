import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase, Client
from django.urls import reverse
from apps.accounts.models import User
import json

class AuthTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')
        self.refresh_url = reverse('auth_refresh')
        self.me_url = reverse('auth_me')
        self.change_password_url = reverse('auth_change_password')
        self.test_customer_url = reverse('test_customer')
        self.test_security_url = reverse('test_security')
        self.test_admin_url = reverse('test_admin')

        # Create Security and Admin users
        self.security_user = User.objects.create_user(email='security@example.com', password='StrongPassword123!', role=User.Role.SECURITY)
        self.admin_user = User.objects.create_superuser(email='admin@example.com', password='StrongPassword123!')

    def test_customer_registration(self):
        data = {
            "email": "customer@example.com",
            "name": "Kiran",
            "phone": "9876543210",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!"
        }
        response = self.client.post(self.register_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['success'])
        self.assertEqual(User.objects.get(email="customer@example.com").role, User.Role.CUSTOMER)
        
    def test_duplicate_email_registration(self):
        User.objects.create_user(email='customer@example.com', password='StrongPassword123!')
        data = {
            "email": "customer@example.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!"
        }
        response = self.client.post(self.register_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.json()['errors'])

    def test_password_mismatch(self):
        data = {
            "email": "customer2@example.com",
            "password": "StrongPassword123!",
            "confirm_password": "WrongPassword123!"
        }
        response = self.client.post(self.register_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.json()['errors'])

    def test_customer_login(self):
        User.objects.create_user(email='customer3@example.com', password='StrongPassword123!')
        data = {
            "email": "customer3@example.com",
            "password": "StrongPassword123!"
        }
        response = self.client.post(self.login_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertEqual(response.json()['user']['role'], User.Role.CUSTOMER)

    def test_wrong_password_login(self):
        User.objects.create_user(email='customer4@example.com', password='StrongPassword123!')
        data = {
            "email": "customer4@example.com",
            "password": "WrongPassword123!"
        }
        response = self.client.post(self.login_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_current_user_with_jwt(self):
        user = User.objects.create_user(email='customer5@example.com', password='StrongPassword123!')
        login_response = self.client.post(self.login_url, {"email": "customer5@example.com", "password": "StrongPassword123!"}, content_type='application/json')
        token = login_response.json()['access']
        
        response = self.client.get(self.me_url, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data']['email'], 'customer5@example.com')

    def test_current_user_without_jwt(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, 401)

    def test_profile_update(self):
        user = User.objects.create_user(email='customer6@example.com', password='StrongPassword123!')
        login_response = self.client.post(self.login_url, {"email": "customer6@example.com", "password": "StrongPassword123!"}, content_type='application/json')
        token = login_response.json()['access']
        
        response = self.client.patch(self.me_url, {"name": "New Name"}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data']['name'], "New Name")

    def test_change_password(self):
        user = User.objects.create_user(email='customer7@example.com', password='StrongPassword123!')
        login_response = self.client.post(self.login_url, {"email": "customer7@example.com", "password": "StrongPassword123!"}, content_type='application/json')
        token = login_response.json()['access']
        
        data = {
            "old_password": "StrongPassword123!",
            "new_password": "NewStrongPassword123!",
            "confirm_password": "NewStrongPassword123!"
        }
        response = self.client.post(self.change_password_url, data, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)

    def test_role_permissions(self):
        # Customer
        c_user = User.objects.create_user(email='c@example.com', password='P!', role=User.Role.CUSTOMER)
        c_token = self.client.post(self.login_url, {"email": "c@example.com", "password": "P!"}, content_type='application/json').json()['access']
        
        self.assertEqual(self.client.get(self.test_customer_url, HTTP_AUTHORIZATION=f'Bearer {c_token}').status_code, 200)
        self.assertEqual(self.client.get(self.test_security_url, HTTP_AUTHORIZATION=f'Bearer {c_token}').status_code, 403)
        self.assertEqual(self.client.get(self.test_admin_url, HTTP_AUTHORIZATION=f'Bearer {c_token}').status_code, 403)

        # Security
        s_token = self.client.post(self.login_url, {"email": "security@example.com", "password": "StrongPassword123!"}, content_type='application/json').json()['access']
        self.assertEqual(self.client.get(self.test_customer_url, HTTP_AUTHORIZATION=f'Bearer {s_token}').status_code, 403)
        self.assertEqual(self.client.get(self.test_security_url, HTTP_AUTHORIZATION=f'Bearer {s_token}').status_code, 200)
        self.assertEqual(self.client.get(self.test_admin_url, HTTP_AUTHORIZATION=f'Bearer {s_token}').status_code, 403)

        # Admin
        a_token = self.client.post(self.login_url, {"email": "admin@example.com", "password": "StrongPassword123!"}, content_type='application/json').json()['access']
        self.assertEqual(self.client.get(self.test_customer_url, HTTP_AUTHORIZATION=f'Bearer {a_token}').status_code, 403)
        self.assertEqual(self.client.get(self.test_security_url, HTTP_AUTHORIZATION=f'Bearer {a_token}').status_code, 403)
        self.assertEqual(self.client.get(self.test_admin_url, HTTP_AUTHORIZATION=f'Bearer {a_token}').status_code, 200)
