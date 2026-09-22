export type BackendVerificationStatus = 'allowed' | 'rejected';

export interface VerificationResponse {
  status: BackendVerificationStatus;
  message: string;
  order_number?: string;
  verified_at?: string;
  reason?: string;
}

export interface VerificationPayload {
  qr_data: string;
}
