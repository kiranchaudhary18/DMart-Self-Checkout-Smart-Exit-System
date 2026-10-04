import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db import IntegrityError
from .models import Notification

logger = logging.getLogger(__name__)

def send_notification(customer, notification_type, subject, template_name, context, order=None):
    """
    Core notification service to handle email sending with idempotency and failure isolation.
    """
    from django.db import transaction
    try:
        # Create PENDING notification record inside atomic block to prevent IntegrityError from breaking outer transactions
        with transaction.atomic():
            notification = Notification.objects.create(
                customer=customer,
                notification_type=notification_type,
                channel=Notification.Channel.EMAIL,
                status=Notification.Status.PENDING,
                subject=subject,
                message="Template: " + template_name,
                order=order
            )
    except IntegrityError:
        logger.info(f"Notification already exists for {notification_type} and order {order.id if order else 'N/A'}")
        return None

    try:
        # Render HTML template
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        
        # Send Email via Lambda or fallback to Django
        if getattr(settings, 'USE_AWS_LAMBDA_EMAIL', False):
            import boto3
            import json
            client = boto3.client('lambda', region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'eu-north-1'))
            payload = {
                'to_email': customer.email,
                'subject': subject,
                'body': html_message
            }
            client.invoke(
                FunctionName='DMartEmailSender',
                InvocationType='Event',
                Payload=json.dumps(payload)
            )
        else:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[customer.email],
                html_message=html_message,
                fail_silently=False,
            )
        
        # Update to SENT
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save(update_fields=['status', 'sent_at'])
        
    except Exception as e:
        logger.error(f"Failed to send email notification {notification.id}: {str(e)}")
        notification.status = Notification.Status.FAILED
        notification.failure_reason = str(e)
        notification.save(update_fields=['status', 'failure_reason'])
        
    return notification


def send_order_confirmation(order):
    context = {'order': order, 'customer': order.customer}
    return send_notification(
        customer=order.customer,
        notification_type=Notification.NotificationType.ORDER_CONFIRMED,
        subject=f"Order Confirmed - {order.order_number}",
        template_name='emails/order_confirmed.html',
        context=context,
        order=order
    )

def send_payment_success(order):
    context = {'order': order, 'customer': order.customer}
    return send_notification(
        customer=order.customer,
        notification_type=Notification.NotificationType.PAYMENT_SUCCESS,
        subject=f"Payment Successful - {order.order_number}",
        template_name='emails/payment_success.html',
        context=context,
        order=order
    )

def send_receipt_ready(order):
    context = {'order': order, 'customer': order.customer, 'receipt': order.receipt}
    return send_notification(
        customer=order.customer,
        notification_type=Notification.NotificationType.RECEIPT_READY,
        subject=f"Receipt Available - {order.order_number}",
        template_name='emails/receipt_ready.html',
        context=context,
        order=order
    )

def send_exit_qr_ready(order, exit_token):
    # Pass only safe information, no raw tokens
    context = {'order': order, 'customer': order.customer, 'expires_at': exit_token.expires_at}
    return send_notification(
        customer=order.customer,
        notification_type=Notification.NotificationType.EXIT_QR_READY,
        subject=f"Exit QR Ready - {order.order_number}",
        template_name='emails/exit_qr_ready.html',
        context=context,
        order=order
    )

def send_exit_result(order, is_allowed, reason=None):
    context = {'order': order, 'customer': order.customer, 'is_allowed': is_allowed, 'reason': reason}
    n_type = Notification.NotificationType.EXIT_ALLOWED if is_allowed else Notification.NotificationType.EXIT_REJECTED
    subject = f"Exit {'Allowed' if is_allowed else 'Rejected'} - {order.order_number}"
    return send_notification(
        customer=order.customer,
        notification_type=n_type,
        subject=subject,
        template_name='emails/exit_result.html',
        context=context,
        order=order
    )

def send_loyalty_notification(customer, order, points, balance_after):
    context = {'customer': customer, 'order': order, 'points': points, 'balance_after': balance_after}
    return send_notification(
        customer=customer,
        notification_type=Notification.NotificationType.LOYALTY_EARNED,
        subject=f"You earned {points} Loyalty Points!",
        template_name='emails/loyalty_earned.html',
        context=context,
        order=order
    )

def send_security_alert(customer, activity_type, order=None):
    context = {'customer': customer, 'order': order, 'activity_type': activity_type}
    return send_notification(
        customer=customer,
        notification_type=Notification.NotificationType.SECURITY_ALERT,
        subject=f"Security Alert on your account",
        template_name='emails/security_alert.html',
        context=context,
        order=order
    )
