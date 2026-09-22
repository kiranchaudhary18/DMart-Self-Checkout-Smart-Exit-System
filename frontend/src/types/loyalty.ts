export interface LoyaltyTransaction {
  transaction_type: "EARNED" | "REDEEMED" | "ADJUSTMENT";
  points: number;
  balance_before: number;
  balance_after: number;
  order_number: string | null;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface LoyaltySummary {
  points_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  created_at: string;
}
