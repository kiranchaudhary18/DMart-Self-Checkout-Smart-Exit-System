from django.db.models import Sum
from apps.loyalty.models import LoyaltyAccount, LoyaltyTransaction
from .utils import apply_date_filter

def get_loyalty_summary(filter_type=None, custom_start=None, custom_end=None):
    """
    Returns loyalty program analytics.
    """
    qs_acc = LoyaltyAccount.objects.all()
    qs_trans = LoyaltyTransaction.objects.all()
    
    if filter_type:
        qs_trans = apply_date_filter(qs_trans, 'created_at', filter_type, custom_start, custom_end)
        
    # Transaction Aggregates
    earned_qs = qs_trans.filter(transaction_type=LoyaltyTransaction.TransactionType.EARN)
    redeemed_qs = qs_trans.filter(transaction_type=LoyaltyTransaction.TransactionType.REDEEM)
    
    total_earned_period = earned_qs.aggregate(total=Sum('points'))['total'] or 0
    total_redeemed_period = redeemed_qs.aggregate(total=Sum('points'))['total'] or 0
    
    # Account Aggregates (Lifetime values usually shouldn't be date filtered, but they are requested generally)
    total_active_balances = qs_acc.aggregate(total=Sum('points_balance'))['total'] or 0
    number_of_loyalty_customers = qs_acc.count()
    loyalty_transactions_count = qs_trans.count()
    
    return {
        "total_loyalty_points_earned_period": total_earned_period,
        "total_loyalty_points_redeemed_period": total_redeemed_period,
        "total_active_loyalty_balances": total_active_balances,
        "number_of_loyalty_customers": number_of_loyalty_customers,
        "loyalty_transactions_count": loyalty_transactions_count
    }
