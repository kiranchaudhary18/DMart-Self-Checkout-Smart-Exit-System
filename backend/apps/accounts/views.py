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

class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    
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
