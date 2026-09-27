from rest_framework import viewsets, views, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from apps.accounts.permissions import IsAdmin
from apps.accounts.models import User

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.ADMIN:
            return Category.objects.all()
        return Category.objects.filter(is_active=True)

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'barcode', 'sku']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.ADMIN:
            return Product.objects.select_related('category', 'inventory').all()
        return Product.objects.select_related('category', 'inventory').filter(is_active=True)

class BarcodeLookupView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, barcode, *args, **kwargs):
        # Barcode must be treated as a string, including leading zeros.
        barcode_str = str(barcode)
        
        user = request.user
        qs = Product.objects.select_related('category', 'inventory').filter(barcode=barcode_str)
        
        # Only ADMIN can see inactive products via barcode lookup if needed, 
        # but the prompt says: "Only return active products to customers/security users."
        if not (user.is_authenticated and user.role == User.Role.ADMIN):
            qs = qs.filter(is_active=True)
            
        product = qs.first()
        
        if not product:
            return Response({
                "success": False,
                "message": "Product not found for this barcode."
            }, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ProductSerializer(product)
        return Response({
            "success": True,
            "message": "Product found.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
