export interface SecurityDashboardStats {
  total_scans_today: number;
  successful_verifications: number;
  rejected_verifications: number;
  suspicious_attempts: number;
}

export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'INVALID' | 'SUSPICIOUS' | 'PENDING';

export interface VerificationRecord {
  id: string;
  scanned_at: string;
  order_number: string | null;
  status: VerificationStatus;
  result: string;
  rejection_reason: string | null;
}

export interface SecurityDashboardResponse {
  status: string;
  data: {
    stats: SecurityDashboardStats;
    recent_activity: VerificationRecord[];
  };
}
