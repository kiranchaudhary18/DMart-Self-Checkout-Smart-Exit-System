import { apiClient } from './client';
import { VerificationHistoryRecord, VerificationDetail } from '@/types/securityHistory';

/**
 * Fetch exit verification history.
 * If endpoint doesn't exist yet, fails gracefully.
 */
export const getVerificationHistory = async (filters?: { search?: string; status?: string }): Promise<VerificationHistoryRecord[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    
    const response = await apiClient.get(`/api/exit-verification/history/?${params.toString()}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    if (error.response && [404, 403].includes(error.response.status)) {
      // Backend doesn't support this yet, or user lacks permission
      return [];
    }
    throw error;
  }
};

/**
 * Fetch verification details.
 */
export const getVerificationDetail = async (id: string): Promise<VerificationDetail | null> => {
  try {
    // Attempt to hit either a dedicated detail endpoint or fallback to the token detail endpoint
    const response = await apiClient.get(`/api/exit-verification/${id}/`);
    
    // Attempt to map the token detail view structure if that's what's returned
    if (response.data && response.data.data) {
      const data = response.data.data;
      return {
        id: data.token_reference || id,
        orderNumber: data.order_number || id,
        status: data.status, // ACTIVE, EXPIRED, USED
        timestamp: data.verified_at || data.expires_at || new Date().toISOString(),
        verifiedBy: data.verified_by || 'System',
        reason: data.is_valid ? 'Token Valid' : 'Token Invalid',
      };
    }
    return null;
  } catch (error: any) {
    if (error.response && [404, 403].includes(error.response.status)) {
      return null;
    }
    throw error;
  }
};
