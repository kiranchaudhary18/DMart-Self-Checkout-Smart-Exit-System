export interface VerificationHistoryRecord {
  id: string;
  orderNumber: string;
  status: string;
  reason?: string;
  verifiedBy: string;
  timestamp: string;
}

export interface VerificationDetail extends VerificationHistoryRecord {
  paymentStatus?: string;
  securityUserInfo?: string;
  isFraudulent?: boolean;
}
