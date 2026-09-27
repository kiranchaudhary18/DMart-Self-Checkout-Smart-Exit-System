from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, SecurityAccessCode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'phone', 'profile_picture', 'role', 'is_active', 'created_at', 'updated_at')
        read_only_fields = fields

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('name', 'phone', 'profile_picture')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'phone', 'password', 'confirm_password')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        # Force role to CUSTOMER on public registration
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            phone=validated_data.get('phone', ''),
            role=User.Role.CUSTOMER
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if self.user.role == User.Role.SECURITY:
            try:
                access_code = getattr(self.user, 'security_access_code', None)
                if access_code is None:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed("Your access code has been deleted. You cannot log in.")
                elif not access_code.is_active:
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed("Your access code has been deactivated by the admin. You cannot log in.")
            except Exception as e:
                from rest_framework.exceptions import AuthenticationFailed
                if isinstance(e, AuthenticationFailed):
                    raise e
                raise AuthenticationFailed("Access code validation failed. You cannot log in.")
        
        # Add custom claims
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': self.user.name,
            'role': self.user.role,
            'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None
        }
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "New password fields didn't match."})
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from old password."})
        return attrs

class SecurityAccessCodeSerializer(serializers.ModelSerializer):
    masked_code = serializers.SerializerMethodField()
    raw_code = serializers.SerializerMethodField()
    access_code = serializers.CharField(write_only=True)
    is_active = serializers.BooleanField(default=True)

    class Meta:
        model = SecurityAccessCode
        fields = ('id', 'security_name', 'security_email', 'access_code', 'raw_code', 'masked_code', 'status', 'used_by', 'created_at', 'used_at', 'email_sent_at', 'is_active')
        read_only_fields = ('id', 'raw_code', 'masked_code', 'status', 'used_by', 'created_at', 'used_at', 'email_sent_at')

    def get_raw_code(self, obj):
        from .utils import decrypt_access_code
        try:
            return decrypt_access_code(obj.access_code)
        except Exception:
            return None

    def get_masked_code(self, obj):
        from .utils import decrypt_access_code
        try:
            raw_code = decrypt_access_code(obj.access_code)
            if len(raw_code) > 4:
                return '*' * (len(raw_code) - 4) + raw_code[-4:]
            return '****'
        except Exception:
            return '****'

class SecurityRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    access_code = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'phone', 'password', 'confirm_password', 'access_code')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Validate access code
        submitted_code = attrs.get('access_code')
        security_name = attrs.get('name')
        
        from .models import SecurityAccessCode
        from .utils import decrypt_access_code
        
        # We must find the record where the decrypted code matches submitted_code
        # Since access_code is encrypted in DB, we can't do a direct DB lookup easily
        # If the number of codes is large, we should iterate through active unused codes
        active_codes = SecurityAccessCode.objects.filter(is_active=True, status=SecurityAccessCode.Status.UNUSED)
        matched_record = None
        for code_record in active_codes:
            try:
                decrypted = decrypt_access_code(code_record.access_code)
                if decrypted == submitted_code:
                    matched_record = code_record
                    break
            except Exception:
                continue
                
        if not matched_record:
            raise serializers.ValidationError({"access_code": "Invalid, used, or inactive access code."})
            
        # Name validation has been removed as per requirement

        if matched_record.security_email and matched_record.security_email.lower().strip() != attrs.get('email', '').lower().strip():
            raise serializers.ValidationError({"email": "This email does not match the authorized email for this access code."})

        # Store the matched record to update it in create()
        self.context['matched_access_code'] = matched_record

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('access_code')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            phone=validated_data.get('phone', ''),
            role=User.Role.SECURITY
        )
        
        # Mark access code as used
        matched_record = self.context['matched_access_code']
        matched_record.status = SecurityAccessCode.Status.USED
        matched_record.used_by = user
        from django.utils import timezone
        matched_record.used_at = timezone.now()
        matched_record.save()
        
        return user
