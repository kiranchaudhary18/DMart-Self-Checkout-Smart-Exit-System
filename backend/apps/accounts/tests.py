from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User, SecurityAccessCode
from .utils import encrypt_access_code, decrypt_access_code

class SecurityAccessCodeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='testpassword123',
            name='Test Admin'
        )
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpassword123',
            name='Test Customer',
            role=User.Role.CUSTOMER
        )

    def test_encryption_decryption(self):
        raw_code = "mysecretcode123"
        encrypted = encrypt_access_code(raw_code)
        self.assertNotEqual(raw_code, encrypted)
        
        decrypted = decrypt_access_code(encrypted)
        self.assertEqual(raw_code, decrypted)

    def test_admin_create_access_code(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-security-codes-list')
        data = {
            'security_name': 'John Guard',
            'security_email': 'john@guard.com'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['security_name'], 'John Guard')
        
        # Check DB
        code_record = SecurityAccessCode.objects.get(id=response.data['data']['id'])
        self.assertIsNotNone(code_record.access_code)
        
        # Ensure it's encrypted
        raw_code = decrypt_access_code(code_record.access_code)
        self.assertTrue(len(raw_code) >= 10)

    def test_non_admin_cannot_create_code(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('admin-security-codes-list')
        data = {'security_name': 'John Guard'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_security_registration(self):
        # 1. Admin creates code
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin-security-codes-list')
        data = {'security_name': 'Jane Guard', 'security_email': 'jane@guard.com'}
        response = self.client.post(url, data, format='json')
        record_id = response.data['data']['id']
        
        # Manually extract raw code for testing signup
        code_record = SecurityAccessCode.objects.get(id=record_id)
        raw_code = decrypt_access_code(code_record.access_code)
        
        # 2. Logout admin, simulate public signup
        self.client.logout()
        signup_url = reverse('security_register')
        signup_data = {
            'name': 'Jane Guard',
            'email': 'jane@guard.com',
            'phone': '1234567890',
            'password': 'SecurePassword123',
            'confirm_password': 'SecurePassword123',
            'access_code': raw_code
        }
        
        response = self.client.post(signup_url, signup_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check if Security User was created
        new_user = User.objects.get(email='jane@guard.com')
        self.assertEqual(new_user.role, User.Role.SECURITY)
        
        # Check if Access Code was marked as USED
        code_record.refresh_from_db()
        self.assertEqual(code_record.status, SecurityAccessCode.Status.USED)
        self.assertEqual(code_record.used_by, new_user)
        self.assertIsNotNone(code_record.used_at)
        
        # 3. Try to use it again
        signup_data['email'] = 'another.jane@guard.com'
        response2 = self.client.post(signup_url, signup_data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('access_code', response2.data['errors'])

    def test_security_registration_name_mismatch(self):
        # Create code
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse('admin-security-codes-list'), {'security_name': 'Jane Guard'})
        code_record = SecurityAccessCode.objects.get(id=response.data['data']['id'])
        raw_code = decrypt_access_code(code_record.access_code)
        
        self.client.logout()
        signup_data = {
            'name': 'Different Guard', # Mismatch!
            'email': 'different@guard.com',
            'password': 'SecurePassword123',
            'confirm_password': 'SecurePassword123',
            'access_code': raw_code
        }
        
        response = self.client.post(reverse('security_register'), signup_data, format='json')
        # Since name validation is removed, this should now succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email='different@guard.com')
        self.assertEqual(new_user.name, 'Different Guard')

    def test_security_registration_email_mismatch(self):
        # Create code with a specific email
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse('admin-security-codes-list'), {
            'security_name': 'Jane Guard',
            'security_email': 'jane@guard.com'
        })
        code_record = SecurityAccessCode.objects.get(id=response.data['data']['id'])
        raw_code = decrypt_access_code(code_record.access_code)
        
        self.client.logout()
        signup_data = {
            'name': 'Jane Guard',
            'email': 'different@guard.com', # Mismatch!
            'password': 'SecurePassword123',
            'confirm_password': 'SecurePassword123',
            'access_code': raw_code
        }
        
        response = self.client.post(reverse('security_register'), signup_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['errors'])
