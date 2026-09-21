from rest_framework import views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.accounts.views import get_success_response, get_error_response
from apps.cart.views import IsCustomer
from apps.orders.models import Order
from .models import ExitToken
from .services import ExitTokenService
from apps.notifications.services import send_exit_result
from .serializers import GenerateExitTokenSerializer

class GenerateExitTokenView(views.APIView):
    permission_classes = [IsCustomer]

    def post(self, request):
        serializer = GenerateExitTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Invalid data.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        order_number = serializer.validated_data['order_number']
        order = get_object_or_404(Order, order_number=order_number, customer=request.user)
        
        try:
            token, raw_token = ExitTokenService.create_exit_token(order)
        except ValueError as e:
            return Response(get_error_response(str(e)), status=status.HTTP_400_BAD_REQUEST)
            
        response_data = {
            "status": "success",
            "order_number": order.order_number,
            "token_reference": token.token_reference,
            "expires_at": token.expires_at,
        }
        
        if raw_token:
            response_data["qr_data"] = ExitTokenService.generate_exit_qr(token.token_reference, raw_token)
        else:
            # Token exists but we don't have the raw string anymore
            response_data["qr_data"] = None
            response_data["message"] = "QR already generated previously and remains active. Raw data cannot be retrieved."
            
        return Response(get_success_response("Exit QR generated.", response_data))


class ExitTokenDetailView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number, customer=request.user)
        token = getattr(order, 'exit_token', None)
        
        if not token:
            return Response(get_error_response("No exit token found for this order."), status=status.HTTP_404_NOT_FOUND)
            
        if timezone.now() >= token.expires_at and token.status == ExitToken.TokenStatus.ACTIVE:
            token.status = ExitToken.TokenStatus.EXPIRED
            token.save()
            
        response_data = {
            "status": token.status,
            "order_number": order.order_number,
            "token_reference": token.token_reference,
            "expires_at": token.expires_at,
            "is_valid": token.is_valid
        }
        
        return Response(get_success_response("Token details retrieved.", response_data))

from rest_framework.permissions import BasePermission
from .services import ExitVerificationService
from .models import ExitVerification

from rest_framework.permissions import IsAuthenticated

# We can keep IsSecurityOrAdmin but we won't use it in permission_classes 
# so we can intercept the request and log the SuspiciousActivity
class IsSecurityOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['SECURITY', 'ADMIN'])

class VerifyExitTokenView(views.APIView):
    permission_classes = [IsAuthenticated] # Changed to catch 403 manually

    def post(self, request):
        from .serializers import VerifyExitTokenSerializer
        serializer = VerifyExitTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "rejected",
                "reason": "INVALID_QR_FORMAT",
                "message": "Invalid payload structure."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        qr_data = serializer.validated_data['qr_data']
        
        # Get IP and UserAgent
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        record, msg = ExitVerificationService.verify_exit_token(qr_data, request.user, ip_address=ip, user_agent=user_agent)
        
        if record is None and msg == "UNAUTHORIZED":
            return Response({
                "status": "rejected",
                "reason": "UNAUTHORIZED",
                "message": msg
            }, status=status.HTTP_403_FORBIDDEN)
        
        if record and record.result == ExitVerification.VerificationResult.ALLOWED:
            try:
                send_exit_result(record.order, True)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to send exit allowed notification: {e}")
                
            return Response({
                "status": "allowed",
                "message": msg,
                "order_number": record.order.order_number if record.order else None,
                "verified_at": record.scanned_at
            }, status=status.HTTP_200_OK)
            
        if record and record.order:
            try:
                send_exit_result(record.order, False, msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to send exit rejected notification: {e}")
                
        return Response({
            "status": "rejected",
            "reason": record.rejection_reason if record else "UNAUTHORIZED",
            "message": msg
        }, status=status.HTTP_400_BAD_REQUEST)
