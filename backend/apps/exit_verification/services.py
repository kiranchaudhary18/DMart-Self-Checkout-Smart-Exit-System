import secrets
import hashlib
import uuid
import qrcode
import base64
import json
from io import BytesIO
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order
from .models import ExitToken

EXIT_TOKEN_EXPIRY_MINUTES = 15

class ExitTokenService:
    @staticmethod
    def _hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    @staticmethod
    def create_exit_token(order: Order):
        if order.payment_status != Order.PaymentStatus.PAID:
            raise ValueError("Exit token can only be generated for PAID orders.")

        existing_token = getattr(order, 'exit_token', None)
        if existing_token:
            if existing_token.is_valid:
                # Can't return raw_token if we didn't store it. We return the token only.
                return existing_token, None
            # If expired/revoked, delete it to make way for new one due to OneToOne
            existing_token.delete()

        raw_token = secrets.token_urlsafe(32)
        token_hash = ExitTokenService._hash_token(raw_token)
        
        unique_suffix = uuid.uuid4().hex[:8].upper()
        token_reference = f"DMART-EXIT-{unique_suffix}"
        
        expires_at = timezone.now() + timedelta(minutes=EXIT_TOKEN_EXPIRY_MINUTES)
        
        exit_token = ExitToken.objects.create(
            order=order,
            token_hash=token_hash,
            token_reference=token_reference,
            expires_at=expires_at,
            status=ExitToken.TokenStatus.ACTIVE
        )
        
        try:
            from apps.notifications.services import send_exit_qr_ready
            send_exit_qr_ready(order, exit_token)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send exit QR notification: {e}")
        
        return exit_token, raw_token

    @staticmethod
    def generate_exit_qr(token_reference: str, raw_token: str) -> str:
        """
        Generates base64 QR code image string from payload.
        """
        payload = {
            "type": "DMART_EXIT",
            "reference": token_reference,
            "token": raw_token
        }
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(payload))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        
        return base64.b64encode(buffered.getvalue()).decode('utf-8')


class ExitVerificationService:
    @staticmethod
    def verify_exit_token(qr_payload_string: str, security_user, ip_address=None, user_agent=None) -> tuple:
        """
        Verifies an exit token based on the QR JSON string.
        Returns: (ExitVerification record, Message String)
        """
        from apps.accounts.models import User
        from django.db import transaction
        from .models import ExitVerification, SuspiciousActivity
        
        # 1. Verify User Role
        if security_user.role not in [User.Role.SECURITY, User.Role.ADMIN]:
            SuspiciousActivityService.record_suspicious_activity(
                activity_type=SuspiciousActivity.ActivityType.UNAUTHORIZED_VERIFICATION,
                severity=SuspiciousActivity.Severity.HIGH,
                user=security_user,
                ip_address=ip_address,
                user_agent=user_agent,
                description="Unauthorized user attempted to verify exit QR."
            )
            return None, "UNAUTHORIZED"

        # 2. Parse Payload
        try:
            payload = json.loads(qr_payload_string)
            if payload.get("type") != "DMART_EXIT":
                raise ValueError("Invalid QR Type")
            token_reference = payload.get("reference")
            raw_token = payload.get("token")
            if not token_reference or not raw_token:
                raise ValueError("Missing QR token data")
        except (json.JSONDecodeError, ValueError):
            with transaction.atomic():
                record = ExitVerification.objects.create(
                    verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.INVALID_QR_FORMAT
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.INVALID_QR,
                    severity=SuspiciousActivity.Severity.LOW,
                    user=security_user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    description="Invalid QR format scanned."
                )
            return record, "Invalid QR Format"

        # 3. Hash Raw Token for lookup
        token_hash = ExitTokenService._hash_token(raw_token)

        # 4. Atomic Transaction and Row Locking
        with transaction.atomic():
            try:
                # Lock the specific ExitToken row to prevent concurrent scans
                exit_token = ExitToken.objects.select_for_update().get(
                    token_reference=token_reference, 
                    token_hash=token_hash
                )
            except ExitToken.DoesNotExist:
                record = ExitVerification.objects.create(
                    verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.INVALID_TOKEN
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.INVALID_TOKEN,
                    severity=SuspiciousActivity.Severity.MEDIUM,
                    user=security_user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    description="QR code scanned contains an invalid or non-existent token."
                )
                return record, "Invalid Token"

            order = exit_token.order

            # 5. Check Token Status
            if exit_token.status == ExitToken.TokenStatus.EXPIRED:
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.TOKEN_EXPIRED
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.EXPIRED_TOKEN_ATTEMPT,
                    severity=SuspiciousActivity.Severity.LOW,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Attempted to use an expired exit token."
                )
                return record, "Token Expired"
                
            elif exit_token.status == ExitToken.TokenStatus.USED:
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.TOKEN_ALREADY_USED
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.USED_TOKEN_ATTEMPT,
                    severity=SuspiciousActivity.Severity.MEDIUM,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Attempted to use a token that is already marked as USED."
                )
                return record, "Token Already Used"
                
            elif exit_token.status == ExitToken.TokenStatus.REVOKED:
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.TOKEN_REVOKED
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.REVOKED_TOKEN_ATTEMPT,
                    severity=SuspiciousActivity.Severity.MEDIUM,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Attempted to use a revoked token."
                )
                return record, "Token Revoked"

            # 6. Check Token Expiry (fallback if status wasn't updated yet)
            if timezone.now() >= exit_token.expires_at:
                exit_token.status = ExitToken.TokenStatus.EXPIRED
                exit_token.save()
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.TOKEN_EXPIRED
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.EXPIRED_TOKEN_ATTEMPT,
                    severity=SuspiciousActivity.Severity.LOW,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Attempted to use an expired exit token."
                )
                return record, "Token Expired"

            # 7. Check Payment Status natively from DB
            if order.payment_status != Order.PaymentStatus.PAID:
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.PAYMENT_NOT_COMPLETED
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.PAYMENT_MISMATCH,
                    severity=SuspiciousActivity.Severity.HIGH,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Order payment is not PAID but verification attempted."
                )
                return record, "Payment Not Completed"

            # 8. ORDER_MISMATCH
            # If the payload contains an order_number, it must match the database.
            payload_order = payload.get("order_number")
            if payload_order and payload_order != order.order_number:
                record = ExitVerification.objects.create(
                    exit_token=exit_token, order=order, verified_by=security_user,
                    result=ExitVerification.VerificationResult.REJECTED,
                    rejection_reason=ExitVerification.RejectionReason.ORDER_MISMATCH
                )
                SuspiciousActivityService.record_suspicious_activity(
                    activity_type=SuspiciousActivity.ActivityType.ORDER_MISMATCH,
                    severity=SuspiciousActivity.Severity.HIGH,
                    order=order, exit_token=exit_token, user=security_user,
                    ip_address=ip_address, user_agent=user_agent,
                    description="Exit token order does not match payload order."
                )
                return record, "Order Mismatch"

            # 9. All Checks Pass - Mark as USED
            exit_token.status = ExitToken.TokenStatus.USED
            exit_token.used_at = timezone.now()
            exit_token.save()

            record = ExitVerification.objects.create(
                exit_token=exit_token, order=order, verified_by=security_user,
                result=ExitVerification.VerificationResult.ALLOWED
            )
            return record, "Exit verified successfully"


class SuspiciousActivityService:
    @staticmethod
    def record_suspicious_activity(
        activity_type, 
        severity, 
        order=None, 
        exit_token=None, 
        user=None, 
        ip_address=None, 
        user_agent=None, 
        description=None, 
        metadata=None
    ):
        from .models import SuspiciousActivity
        
        # Check repeated failures FIRST
        # If this function is recording a failure, maybe it triggers a REPEATED_FAILURES record
        
        record = SuspiciousActivity.objects.create(
            activity_type=activity_type,
            severity=severity,
            status=SuspiciousActivity.Status.OPEN,
            order=order,
            exit_token=exit_token,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
            metadata=metadata or {}
        )
        
        # Send security alert for HIGH or CRITICAL severity
        from .models import SuspiciousActivity
        if severity in [SuspiciousActivity.Severity.HIGH, SuspiciousActivity.Severity.CRITICAL]:
            customer = user
            if order and not customer:
                customer = order.customer
                
            if customer and customer.role == 'CUSTOMER': # only email customers about their accounts
                try:
                    from apps.notifications.services import send_security_alert
                    send_security_alert(customer, activity_type, order)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Failed to send security alert notification: {e}")
        
        # After creating, evaluate repeated failures
        SuspiciousActivityService.check_repeated_failures(user=user, ip_address=ip_address)
        
        return record

    @staticmethod
    def check_repeated_failures(user=None, ip_address=None):
        from .models import SuspiciousActivity
        
        if not user and not ip_address:
            return
            
        time_threshold = timezone.now() - timedelta(minutes=10)
        
        queryset = SuspiciousActivity.objects.filter(
            detected_at__gte=time_threshold
        ).exclude(
            activity_type=SuspiciousActivity.ActivityType.REPEATED_FAILURES
        )
        
        # Build query conditionally
        if user and ip_address:
            from django.db.models import Q
            queryset = queryset.filter(Q(user=user) | Q(ip_address=ip_address))
        elif user:
            queryset = queryset.filter(user=user)
        elif ip_address:
            queryset = queryset.filter(ip_address=ip_address)
            
        count = queryset.count()
        
        if count >= 5:
            # Create a REPEATED_FAILURES record if one hasn't been created recently (cooldown)
            recent_repeated = SuspiciousActivity.objects.filter(
                activity_type=SuspiciousActivity.ActivityType.REPEATED_FAILURES,
                detected_at__gte=time_threshold
            )
            
            if user and ip_address:
                from django.db.models import Q
                recent_repeated = recent_repeated.filter(Q(user=user) | Q(ip_address=ip_address))
            elif user:
                recent_repeated = recent_repeated.filter(user=user)
            elif ip_address:
                recent_repeated = recent_repeated.filter(ip_address=ip_address)
                
            if not recent_repeated.exists():
                SuspiciousActivity.objects.create(
                    activity_type=SuspiciousActivity.ActivityType.REPEATED_FAILURES,
                    severity=SuspiciousActivity.Severity.HIGH,
                    status=SuspiciousActivity.Status.OPEN,
                    user=user,
                    ip_address=ip_address,
                    description=f"Detected {count} suspicious activities within 10 minutes."
                )
