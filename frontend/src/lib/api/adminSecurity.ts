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

/**
 * Get the current secure access code
 */
export const getAdminSecurityAccessCode = async (): Promise<{ code: string }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Security Access Code endpoint is not implemented on the backend yet." }
    }
  };
};
