from django.db import transaction
from django.db.models import F
from apps.orders.models import Order
from .models import LoyaltyAccount, LoyaltyTransaction

class LoyaltyService:
    @staticmethod
    def calculate_earn_points(amount):
        """
        Rule: 1 point for every 100 of eligible purchase amount.
        floor(eligible_amount / 100)
        """
        # We ensure amount is treated safely. No floating-point math.
        # Since amount is Decimal, amount // 100 does floor division safely.
        return int(amount // 100)

    @staticmethod
    @transaction.atomic
    def award_points_for_order(order: Order):
        """
        Awards loyalty points to the customer for a successfully paid order.
        """
        if order.payment_status != Order.PaymentStatus.PAID:
            raise ValueError("Can only award points for PAID orders.")
            
        # Verify if points have already been awarded
        if LoyaltyTransaction.objects.filter(
            order=order, 
            transaction_type=LoyaltyTransaction.TransactionType.EARN
        ).exists():
            raise ValueError("Points already awarded for this order.")
            
        points_to_award = LoyaltyService.calculate_earn_points(order.total_amount)
        
        if points_to_award <= 0:
            return None # No points earned
            
        # Get or create the loyalty account with lock
        account, created = LoyaltyAccount.objects.select_for_update().get_or_create(
            customer=order.customer
        )
        
        balance_before = account.points_balance
        balance_after = balance_before + points_to_award
        
        # Create transaction
        trx = LoyaltyTransaction.objects.create(
            loyalty_account=account,
            transaction_type=LoyaltyTransaction.TransactionType.EARN,
            points=points_to_award,
            balance_before=balance_before,
            balance_after=balance_after,
            order=order,
            description=f"Earned from Order {order.order_number}"
        )
        
        # Update account safely
        account.points_balance = balance_after
        account.lifetime_earned = account.lifetime_earned + points_to_award
        account.save()
        
        return trx
