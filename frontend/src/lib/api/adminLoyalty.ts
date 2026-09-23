import { apiClient } from './client';

export interface AdminLoyaltyAccount {
  customer_email: string;
  points_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
}

export interface AdminLoyaltyTransaction {
  id: number;
  transaction_type: "EARN" | "REDEEM" | "ADJUSTMENT" | "REVERSAL";
  points: number;
  balance_after: number;
  customer_email: string;
  order_reference?: string;
  description: string;
  created_at: string;
}

/**
 * NOTE: The Django backend currently does not implement a dedicated 
 * admin loyalty endpoints.
 */
export const getAdminLoyaltyAccounts = async (params?: any): Promise<{ results: AdminLoyaltyAccount[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Loyalty Accounts endpoint is not implemented on the backend yet." }
    }
  };
};

export const getAdminLoyaltyTransactions = async (params?: any): Promise<{ results: AdminLoyaltyTransaction[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Loyalty Transactions endpoint is not implemented on the backend yet." }
    }
  };
};
