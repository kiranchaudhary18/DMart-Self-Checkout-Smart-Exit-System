import { apiClient } from './client';
import { SecurityAlert } from '@/types/securityAlert';

/**
 * Fetch security alerts / suspicious activity.
 * Fails gracefully if backend endpoint is not yet implemented.
 */
export const getSecurityAlerts = async (): Promise<SecurityAlert[]> => {
  try {
    const response = await apiClient.get('/api/exit-verification/alerts/');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    if (error.response && [404, 403].includes(error.response.status)) {
      return []; // Return empty if not implemented or unauthorized
    }
    throw error;
  }
};
