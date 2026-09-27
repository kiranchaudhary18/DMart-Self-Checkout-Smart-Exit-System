import os
import base64
from cryptography.fernet import Fernet
from django.conf import settings
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def get_encryption_key():
    """
    Derive a 32-byte url-safe base64-encoded key from the DJANGO_SECRET_KEY
    using PBKDF2. This avoids needing a separate ENCRYPTION_KEY env var.
    """
    secret = settings.SECRET_KEY.encode('utf-8')
    # Using a static salt derived from the project name for consistency
    salt = b'dmart_security_access_code_salt'
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret))
    return key

def encrypt_access_code(raw_code: str) -> str:
    """
    Encrypt a plaintext access code using Fernet symmetric encryption.
    """
    key = get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(raw_code.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_access_code(encrypted_code: str) -> str:
    """
    Decrypt an encrypted access code using Fernet symmetric encryption.
    """
    key = get_encryption_key()
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_code.encode('utf-8'))
    return decrypted.decode('utf-8')
