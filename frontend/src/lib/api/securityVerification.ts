import { apiClient } from './client';
import { VerificationPayload, VerificationResponse } from '@/types/securityVerification';

/**
 * Verifies an exit QR token securely through the backend.
 * 
 * @param qr_data The raw QR payload or fallback token code
 * @returns VerificationResponse with status and message/reason
 */
export const verifyExitQR = async (qr_data: string): Promise<VerificationResponse> => {
  try {
    const response = await apiClient.post<VerificationResponse>('/api/exit-verification/verify/', {
      qr_data
    });
    
    return response.data;
  } catch (error: any) {
    // Return backend error payload if available, else throw a generic error state
    if (error.response && error.response.data) {
      return error.response.data as VerificationResponse;
    }
    
    return {
      status: 'rejected',
      reason: 'NETWORK_ERROR',
      message: 'Failed to communicate with the verification server.'
    };
  }
};
