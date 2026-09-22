import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def seed_admin():
    email = 'admin@dmart.com'
    password = 'Admin@123'
    
    # Try to find existing admin
    try:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.role = 'ADMIN'
        # ensure it's a superuser/staff for django admin access as well
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated existing admin user: {email}")
    except User.DoesNotExist:
        user = User.objects.create_superuser(
            email=email,
            password=password,
            phone='0000000001',
            name='DMart Admin',
            role='ADMIN'
        )
        print(f"Created new admin user: {email}")

if __name__ == '__main__':
    seed_admin()
