import { apiClient } from './client';
import { SecurityDashboardStats, VerificationRecord } from '@/types/security';

/**
 * Get Security Dashboard Statistics
 * Since the backend might not have this implemented for the SECURITY role yet,
 * we handle 404 or 403 gracefully and return null or empty data if unavailable.
 */
export const getSecurityDashboardStats = async (): Promise<SecurityDashboardStats | null> => {
  try {
    const response = await apiClient.get('/api/analytics/security/');
    if (response.data && response.data.data) {
      const data = response.data.data;
      return {
        total_scans_today: data.total_verifications || 0,
        successful_verifications: data.allowed || 0,
        rejected_verifications: data.rejected || 0,
        suspicious_attempts: 0 // Mock mapping if not provided directly
      };
    }
    return null;
  } catch (error: any) {
    // If the endpoint doesn't exist or is forbidden, return null to indicate unavailable data
    if (error.response && [403, 404].includes(error.response.status)) {
      return null;
    }
    throw error;
  }
};

/**
 * Get Recent Verification Activity
 */
export const getRecentVerificationActivity = async (): Promise<VerificationRecord[] | null> => {
  try {
    // Attempt to hit a potential recent activity endpoint
    const response = await apiClient.get('/api/exit-verification/history/');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    if (error.response && [403, 404].includes(error.response.status)) {
      return null;
    }
    throw error;
  }
};
