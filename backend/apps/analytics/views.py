from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminRole
from django.utils.dateparse import parse_datetime
from .services import (
    get_sales_summary,
    get_order_summary,
    get_customer_summary,
    get_product_summary,
    get_inventory_summary,
    get_loyalty_summary,
    get_security_summary,
    get_fraud_summary
)

class BaseAnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def _get_date_filters(self, request):
        """Helper to extract and validate date filters."""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        custom_start = None
        custom_end = None
        
        if start_date_str:
            custom_start = parse_datetime(start_date_str)
            if not custom_start:
                raise ValueError("Invalid start_date format.")
        
        if end_date_str:
            custom_end = parse_datetime(end_date_str)
            if not custom_end:
                raise ValueError("Invalid end_date format.")
                
        if custom_start and custom_end and custom_start > custom_end:
            raise ValueError("start_date cannot be greater than end_date.")
            
        return custom_start, custom_end
        
    def _handle_request(self, request, service_func, **kwargs):
        try:
            custom_start, custom_end = self._get_date_filters(request)
        except ValueError as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        # Prioritize 'custom' if both are provided, otherwise use explicit filter_type passed, or None
        filter_type = 'custom' if (custom_start or custom_end) else None
        
        try:
            data = service_func(filter_type=filter_type, custom_start=custom_start, custom_end=custom_end, **kwargs)
            return Response({
                "status": "success",
                "data": data,
                "filters": {
                    "start_date": custom_start.isoformat() if custom_start else None,
                    "end_date": custom_end.isoformat() if custom_end else None
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    def get(self, request):
        sales_today = get_sales_summary(filter_type='today')
        sales_month = get_sales_summary(filter_type='current_month')
        sales_total = get_sales_summary()
        
        orders = get_order_summary()
        customers = get_customer_summary(filter_type='current_month')
        inventory = get_inventory_summary()
        loyalty = get_loyalty_summary()
        security = get_security_summary()
        fraud = get_fraud_summary()
        
        return Response({
            "status": "success",
            "data": {
                "sales": {
                    "today": sales_today,
                    "current_month": sales_month,
                    "total": sales_total
                },
                "orders": orders,
                "customers": {
                    "total": customers['total_customers'],
                    "active": customers['active_customers'],
                    "new_in_period": customers['new_customers']
                },
                "inventory": {
                    "total_products": inventory['total_inventory_items'],
                    "low_stock": inventory['low_stock_products'],
                    "out_of_stock": inventory['out_of_stock_products']
                },
                "loyalty": {
                    "total_points_earned": loyalty['total_loyalty_points_earned_period'],
                    "total_points_redeemed": loyalty['total_loyalty_points_redeemed_period']
                },
                "security": {
                    "total_verifications": security['total_verification_attempts'],
                    "allowed": security['allowed_exits'],
                    "rejected": security['rejected_exits']
                },
                "fraud": {
                    "open_suspicious": fraud['open_activities'],
                    "high_severity": fraud['high_severity_activities'],
                    "critical_severity": fraud['critical_severity_activities']
                }
            }
        })


class SalesAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_sales_summary)


class OrdersAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_order_summary)


class ProductsAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        try:
            custom_start, custom_end = self._get_date_filters(request)
        except ValueError as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        filter_type = 'custom' if (custom_start or custom_end) else None
        
        limit = request.query_params.get('limit', 10)
        try:
            limit = int(limit)
            if limit < 1 or limit > 100:
                raise ValueError
        except ValueError:
            return Response({"status": "error", "message": "Invalid limit parameter. Must be integer between 1 and 100."}, status=status.HTTP_400_BAD_REQUEST)
            
        data = get_product_summary(filter_type=filter_type, custom_start=custom_start, custom_end=custom_end)
        
        data['highest_revenue_products'] = data['highest_revenue_products'][:limit]
        data['highest_quantity_products'] = data['highest_quantity_products'][:limit]
        
        return Response({
            "status": "success",
            "data": data,
            "filters": {
                "start_date": custom_start.isoformat() if custom_start else None,
                "end_date": custom_end.isoformat() if custom_end else None,
                "limit": limit
            }
        })


class InventoryAnalyticsView(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    
    def get(self, request):
        data = get_inventory_summary()
        return Response({
            "status": "success",
            "data": {
                "total_stock": data['total_current_stock'],
                "reserved_stock": data['total_reserved_stock'],
                "available_stock": data['total_available_stock'],
                "low_stock_count": data['low_stock_products'],
                "out_of_stock_count": data['out_of_stock_products']
            }
        })


class CustomersAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_customer_summary)


class LoyaltyAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_loyalty_summary)


class SecurityAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_security_summary)


class FraudAnalyticsView(BaseAnalyticsView):
    def get(self, request):
        return self._handle_request(request, get_fraud_summary)
