from decimal import Decimal

class PricingService:
    @staticmethod
    def calculate_cart_pricing(cart):
        """
        Calculates the pricing breakdown for a cart.
        Returns a dictionary with item-level and cart-level breakdowns.
        """
        items = cart.items.select_related('product').all()
        
        # 1. Cart Items & Subtotal
        subtotal = Decimal('0.00')
        item_details = []
        
        for item in items:
            item_subtotal = (item.quantity * item.unit_price).quantize(Decimal('0.00'))
            subtotal += item_subtotal
            item_details.append({
                'item_id': item.id,
                'product_id': item.product.id,
                'product_name': item.product.name,
                'barcode': item.product.barcode,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'item_subtotal': item_subtotal,
                'gst_percentage': item.product.gst_percentage,
                # Placeholders to be updated
                'item_discount': Decimal('0.00'),
                'item_taxable': Decimal('0.00'),
                'item_gst': Decimal('0.00'),
                'item_final': Decimal('0.00')
            })

        # 2. Coupon Discount
        discount = Decimal('0.00')
        coupon_data = None
        
        if cart.applied_coupon:
            is_valid, _ = cart.applied_coupon.is_valid_for_cart(subtotal)
            if is_valid:
                discount = cart.applied_coupon.calculate_discount(subtotal)
                coupon_data = {
                    "code": cart.applied_coupon.code,
                    "discount_type": cart.applied_coupon.discount_type
                }
            else:
                # If it became invalid (e.g. they removed an item and subtotal dropped)
                pass

        # 3. Prorate Discount & Calculate GST
        total_taxable = Decimal('0.00')
        total_gst = Decimal('0.00')
        
        # We need to distribute the discount across items based on their contribution to subtotal
        # to correctly calculate GST on the discounted price.
        remaining_discount = discount
        
        for i, detail in enumerate(item_details):
            if subtotal > 0:
                # Calculate prorated discount
                if i == len(item_details) - 1:
                    # Last item takes the exact remaining discount to avoid rounding leaks
                    item_discount = remaining_discount
                else:
                    ratio = detail['item_subtotal'] / subtotal
                    item_discount = (discount * ratio).quantize(Decimal('0.00'))
                    remaining_discount -= item_discount
            else:
                item_discount = Decimal('0.00')

            detail['item_discount'] = item_discount
            
            # Taxable Amount
            item_taxable = detail['item_subtotal'] - item_discount
            if item_taxable < Decimal('0.00'):
                item_taxable = Decimal('0.00')
            detail['item_taxable'] = item_taxable
            
            # GST Calculation
            item_gst = (item_taxable * detail['gst_percentage'] / Decimal('100.00')).quantize(Decimal('0.00'))
            detail['item_gst'] = item_gst
            
            detail['item_final'] = item_taxable + item_gst
            
            total_taxable += item_taxable
            total_gst += item_gst

        # 4. Final Total
        final_total = total_taxable + total_gst

        return {
            "items": item_details,
            "coupon": coupon_data,
            "subtotal": subtotal.quantize(Decimal('0.00')),
            "discount": discount.quantize(Decimal('0.00')),
            "taxable_amount": total_taxable.quantize(Decimal('0.00')),
            "gst": total_gst.quantize(Decimal('0.00')),
            "final_total": final_total.quantize(Decimal('0.00'))
        }
