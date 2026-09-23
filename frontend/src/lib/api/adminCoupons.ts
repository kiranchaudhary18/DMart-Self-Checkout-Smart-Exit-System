import { apiClient } from './client';

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discount_type: "PERCENTAGE" | "FIXED";
  discount_value: string;
  minimum_cart_value: string;
  maximum_discount: string | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

/**
 * NOTE: The Django backend currently does not implement a dedicated 
 * admin coupons list endpoint.
 */
export const getAdminCoupons = async (params?: any): Promise<{ results: AdminCoupon[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Coupons endpoint is not implemented on the backend yet." }
    }
  };
};

export const createAdminCoupon = async (data: Partial<AdminCoupon>): Promise<AdminCoupon> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Create Coupon endpoint is not implemented on the backend yet." }
    }
  };
};

export const updateAdminCoupon = async (id: number, data: Partial<AdminCoupon>): Promise<AdminCoupon> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Update Coupon endpoint is not implemented on the backend yet." }
    }
  };
};

export const deleteAdminCoupon = async (id: number): Promise<void> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Delete Coupon endpoint is not implemented on the backend yet." }
    }
  };
};
