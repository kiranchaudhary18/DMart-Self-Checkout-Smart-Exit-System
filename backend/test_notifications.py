from django.test import TestCase, override_settings
from django.core import mail
from django.utils import timezone
from apps.accounts.models import User
from apps.orders.models import Order
from apps.products.models import Product
from apps.stores.models import Store
from apps.notifications.models import Notification
from apps.notifications.services import send_payment_success
from django.db import IntegrityError

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class NotificationTestCase(TestCase):
    def setUp(self):
        self.store = Store.objects.create(
            name="DMart Mumbai",
            address="Test Address",
            city="Mumbai",
            state="MH",
            pincode="400001",
            phone="1234567890",
            email="store@dmart.com",
            opening_time="09:00",
            closing_time="22:00",
            is_open=True
        )
        self.customer = User.objects.create_user(
            email="testcustomer@dmart.com",
            password="testpassword",
            role="CUSTOMER"
        )
        self.order = Order.objects.create(
            customer=self.customer,
            subtotal=500.00,
            discount_amount=0.00,
            taxable_amount=500.00,
            gst_amount=0.00,
            total_amount=500.00,
            payment_status=Order.PaymentStatus.PAID,
            status=Order.OrderStatus.PAID,
            order_number="ORD-TEST-123"
        )
        
    def test_send_payment_success_notification(self):
        """Test that a payment success notification sends an email and records SENT status."""
        notification = send_payment_success(self.order)
        
        self.assertEqual(notification.status, Notification.Status.SENT)
        self.assertEqual(notification.notification_type, Notification.NotificationType.PAYMENT_SUCCESS)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Payment Successful", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, [self.customer.email])
        
    def test_notification_idempotency(self):
        """Test that duplicate events for the same order do not create duplicate notifications."""
        # Send first notification
        n1 = send_payment_success(self.order)
        self.assertIsNotNone(n1)
        
        # Attempt to send again
        n2 = send_payment_success(self.order)
        self.assertIsNone(n2)
        
        # Verify only 1 record exists in the DB for this type/order
        count = Notification.objects.filter(
            order=self.order,
            notification_type=Notification.NotificationType.PAYMENT_SUCCESS
        ).count()
        
        self.assertEqual(count, 1)
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend', EMAIL_HOST='invalid.host.local', EMAIL_PORT=1234)
    def test_notification_failure_isolation(self):
        """Test that email delivery failure records FAILED status but does not crash the app."""
        notification = send_payment_success(self.order)
        
        self.assertEqual(notification.status, Notification.Status.FAILED)
        self.assertNotEqual(notification.failure_reason, "")
