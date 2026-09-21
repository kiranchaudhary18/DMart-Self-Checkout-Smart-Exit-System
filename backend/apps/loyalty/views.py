from rest_framework import views, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.accounts.views import get_success_response, get_error_response
from apps.cart.views import IsCustomer
from apps.accounts.models import User
from rest_framework.permissions import IsAdminUser

from .models import LoyaltyAccount, LoyaltyTransaction
from .serializers import (
    LoyaltyAccountSerializer, 
    LoyaltyTransactionSerializer, 
    AdminAdjustSerializer
)

class LoyaltyBalanceView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        # Safely get or create to ensure customer always has a loyalty account when requested
        account, created = LoyaltyAccount.objects.get_or_create(customer=request.user)
        serializer = LoyaltyAccountSerializer(account)
        return Response(get_success_response("Loyalty balance retrieved.", serializer.data))


class LoyaltyTransactionHistoryView(views.APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        # We assume get_or_create was triggered by them checking balance, or we can just fetch
        try:
            account = LoyaltyAccount.objects.get(customer=request.user)
            transactions = LoyaltyTransaction.objects.filter(loyalty_account=account)[:50]
        except LoyaltyAccount.DoesNotExist:
            transactions = []
            
        serializer = LoyaltyTransactionSerializer(transactions, many=True)
        return Response(get_success_response("Loyalty transactions retrieved.", serializer.data))


class AdminLoyaltyAdjustView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AdminAdjustSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(get_error_response("Invalid data.", serializer.errors), status=status.HTTP_400_BAD_REQUEST)
            
        customer_id = serializer.validated_data['customer_id']
        points = serializer.validated_data['points']
        description = serializer.validated_data['description']
        
        if points == 0:
            return Response(get_error_response("Points cannot be 0."), status=status.HTTP_400_BAD_REQUEST)
            
        customer = get_object_or_404(User, id=customer_id)
        
        with transaction.atomic():
            account, created = LoyaltyAccount.objects.select_for_update().get_or_create(customer=customer)
            
            balance_before = account.points_balance
            balance_after = balance_before + points
            
            if balance_after < 0:
                return Response(get_error_response("Adjustment would result in negative balance."), status=status.HTTP_400_BAD_REQUEST)
                
            trx = LoyaltyTransaction.objects.create(
                loyalty_account=account,
                transaction_type=LoyaltyTransaction.TransactionType.ADJUSTMENT,
                points=abs(points),
                balance_before=balance_before,
                balance_after=balance_after,
                description=description
            )
            
            account.points_balance = balance_after
            # Usually, admin manual adjustment removals don't reduce lifetime_earned, 
            # and positive additions might or might not. We will just update points_balance here.
            account.save()
            
            return Response(get_success_response("Loyalty adjusted successfully.", {
                "balance_after": balance_after
            }))
