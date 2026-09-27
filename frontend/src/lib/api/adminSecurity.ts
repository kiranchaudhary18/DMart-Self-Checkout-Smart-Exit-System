import { apiClient } from './client';
import { User } from '@/types/auth';

export interface AdminSecurityStaff extends User {
  last_login?: string;
  verification_count?: number;
}

/**
 * NOTE: The Django backend currently does not implement a dedicated 
 * admin security staff endpoint.
 */
export const getAdminSecurityStaff = async (params?: any): Promise<{ results: AdminSecurityStaff[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Security Staff endpoint is not implemented on the backend yet." }
    }
  };
};

/**
 * Toggle security staff active status
 */
export const toggleAdminSecurityStaffStatus = async (id: number | string, isActive: boolean): Promise<AdminSecurityStaff> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Security Staff management endpoint is not implemented on the backend yet." }
    }
  };
};

export interface SecurityAccessCode {
  id: number;
  security_name: string;
  security_email: string | null;
  masked_code: string;
  raw_code: string | null;
  status: 'UNUSED' | 'USED' | 'INACTIVE';
  used_by: number | null;
  created_at: string;
  used_at: string | null;
  email_sent_at: string | null;
  is_active: boolean;
}

export const getSecurityAccessCodes = async (): Promise<{ results: SecurityAccessCode[], count: number }> => {
  const response = await apiClient.get('/auth/admin/security-codes/');
  // DRF viewsets with pagination return { results: [], count: ... } or just array based on settings.
  // The backend might return { success, data } based on our custom response wrapper.
  if (response.data.data && Array.isArray(response.data.data)) {
    return { results: response.data.data, count: response.data.data.length };
  } else if (response.data.results) {
    return response.data;
  } else if (Array.isArray(response.data)) {
    return { results: response.data, count: response.data.length };
  }
  return { results: [], count: 0 };
};

export const generateSecurityAccessCode = async (security_name: string): Promise<SecurityAccessCode> => {
  const response = await apiClient.post('/auth/admin/security-codes/', { security_name });
  return response.data.data || response.data;
};

export const updateSecurityAccessCode = async (id: number, data: Partial<SecurityAccessCode>): Promise<SecurityAccessCode> => {
  const response = await apiClient.patch(`/auth/admin/security-codes/${id}/`, data);
  return response.data.data || response.data;
};

export const deleteSecurityAccessCode = async (id: number): Promise<void> => {
  await apiClient.delete(`/auth/admin/security-codes/${id}/`);
};

export const sendSecurityAccessCodeEmail = async (id: number): Promise<{ success: boolean, message: string }> => {
  const response = await apiClient.post(`/auth/admin/security-codes/${id}/send-email/`);
  return response.data;
};
