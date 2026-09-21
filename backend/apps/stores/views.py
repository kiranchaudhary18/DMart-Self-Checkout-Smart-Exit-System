from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from .models import Store
from .serializers import StoreSerializer
from apps.accounts.permissions import IsAdmin
from apps.accounts.views import get_success_response, get_error_response

class CurrentStoreView(generics.RetrieveUpdateAPIView):
    serializer_class = StoreSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_object(self):
        store = Store.objects.first()
        if not store:
            raise NotFound("Store configuration not found.")
        return store

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except NotFound as e:
            return Response(get_error_response(str(e)), status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(instance)
        return Response(get_success_response("Store details retrieved successfully.", serializer.data))

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        
        try:
            instance = self.get_object()
        except NotFound as e:
            return Response(get_error_response(str(e)), status=status.HTTP_404_NOT_FOUND)
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return Response(get_error_response("Validation failed.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        updated_data = self.get_serializer(instance).data
        return Response(get_success_response("Store settings updated successfully.", updated_data))
