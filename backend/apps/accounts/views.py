from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer
)
from .permissions import IsCustomer, IsSecurity, IsAdmin

def get_success_response(message, data=None):
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    return response

def get_error_response(message, errors=None):
    response = {"success": False, "message": message}
    if errors is not None:
        response["errors"] = errors
    return response

class RegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        user_data = UserSerializer(user).data
        
        # Optional: Generate JWT token immediately on registration
        refresh = RefreshToken.for_user(user)
        token_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }
        
        return Response(get_success_response("User registered successfully.", token_data), status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
        
    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(get_success_response("Current user retrieved successfully.", serializer.data))
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        updated_data = UserSerializer(instance).data
        return Response(get_success_response("Profile updated successfully.", updated_data))

class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        user = request.user
        if not user.check_password(serializer.validated_data.get("old_password")):
            return Response(get_error_response("Invalid old password.", {"old_password": ["Wrong password."]}), status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(serializer.validated_data.get("new_password"))
        user.save()
        
        return Response(get_success_response("Password changed successfully."))

# Role Verification Test Endpoints
class TestCustomerView(views.APIView):
    permission_classes = [IsAuthenticated, IsCustomer]
    def get(self, request):
        return Response(get_success_response("Customer access granted."))

class TestSecurityView(views.APIView):
    permission_classes = [IsAuthenticated, IsSecurity]
    def get(self, request):
        return Response(get_success_response("Security access granted."))

class TestAdminView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        return Response(get_success_response("Admin access granted."))

import string
import random
from rest_framework import viewsets
from rest_framework.decorators import action
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import SecurityAccessCode
from .serializers import SecurityAccessCodeSerializer, SecurityRegistrationSerializer
from .utils import encrypt_access_code, decrypt_access_code

def generate_random_code(length=10):
    """Generate a random alphanumeric code"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

class SecurityAccessCodeViewSet(viewsets.ModelViewSet):
    """
    Admin management of Security Access Codes.
    """
    queryset = SecurityAccessCode.objects.all().order_by('-created_at')
    serializer_class = SecurityAccessCodeSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        # Generate random code
        raw_code = generate_random_code()
        
        # Encrypt the code
        encrypted_code = encrypt_access_code(raw_code)
        
        data = request.data.copy()
        data['access_code'] = encrypted_code
        
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_create(serializer)
        return Response(get_success_response("Security access code generated.", serializer.data), status=status.HTTP_201_CREATED)
        
    @action(detail=True, methods=['post'], url_path='send-email')
    def send_email(self, request, pk=None):
        code_record = self.get_object()
        
        if not code_record.security_email:
            return Response(get_error_response("No email address configured for this security record."), status=status.HTTP_400_BAD_REQUEST)
            
        if code_record.status != SecurityAccessCode.Status.UNUSED or not code_record.is_active:
            return Response(get_error_response("Cannot send email for a used or inactive access code."), status=status.HTTP_400_BAD_REQUEST)
            
        try:
            raw_code = decrypt_access_code(code_record.access_code)
        except Exception as e:
            return Response(get_error_response("Failed to decrypt access code.", str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        subject = "Your Security Access Code - DMart System"
        message = f"""
Hello {code_record.security_name},

You have been invited to join the DMart Self Checkout & Smart Exit System as a Security Guard.

Your personal Access Code is: {raw_code}

Please use this code during the Security Registration process.
Important: This code is personal and should not be shared with anyone.

Best regards,
DMart Admin Team
        """

        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">DMart Security</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
                <h2 style="color: #1e293b; margin-top: 0;">Welcome, {code_record.security_name}!</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                    You have been invited to join the <strong>DMart Self Checkout & Smart Exit System</strong> as a Security Guard.
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 8px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em;">Your Access Code</p>
                    <p style="color: #0f172a; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin: 0;">{raw_code}</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                    Please use this access code on the Security Registration page to complete your account setup. Your name must exactly match the name shown above.
                </p>
                <p style="color: #ef4444; font-size: 14px; margin-top: 24px; display: flex; align-items: center;">
                    <strong>⚠️ Important:</strong> This code is strictly confidential. Do not share it with anyone.
                </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; {timezone.now().year} DMart Systems. All rights reserved.</p>
            </div>
        </div>
        """
        
        try:
            if getattr(settings, 'USE_AWS_LAMBDA_EMAIL', False):
                import boto3
                import json
                client = boto3.client('lambda', region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'eu-north-1'))
                payload = {
                    'to_email': code_record.security_email,
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
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[code_record.security_email],
                    html_message=html_message,
                    fail_silently=False,
                )
            
            code_record.email_sent_at = timezone.now()
            code_record.save()
            return Response(get_success_response(f"Access code emailed successfully to {code_record.security_email}."))
        except Exception as e:
            return Response(get_error_response("Failed to send email.", str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SecurityRegistrationView(generics.CreateAPIView):
    """
    Public endpoint for registering a Security user using an access code.
    """
    serializer_class = SecurityRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.save()
        
        # Optional: Generate JWT token immediately on registration
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        token_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }
        
        return Response(get_success_response("Security user registered successfully.", token_data), status=status.HTTP_201_CREATED)
