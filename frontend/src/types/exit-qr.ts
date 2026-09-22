export type ExitPassStatus = "ACTIVE" | "USED" | "EXPIRED" | "INVALID" | "PENDING";

export interface ExitPass {
  id: string;
  order_number: string;
  status: ExitPassStatus;
  qr_data: string; // The encrypted data payload for the QR code
  created_at: string;
  expires_at: string | null;
}

export interface ExitPassResponse {
  pass: ExitPass | null; // Null if no eligible pass exists
  message?: string;
}
