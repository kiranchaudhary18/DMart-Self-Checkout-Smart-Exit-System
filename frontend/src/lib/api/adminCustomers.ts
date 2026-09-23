import { apiClient } from './client';
import { User } from '@/types/auth';

export interface AdminCustomer extends User {
  registration_date?: string;
  order_count?: number;
  loyalty_points?: number;
}

/**
 * Fetch all customers for admin.
 * NOTE: The Django backend currently does not implement a dedicated 
 * admin customer list endpoint.
 */
export const getAdminCustomers = async (params?: any): Promise<{ results: AdminCustomer[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Customers endpoint is not implemented on the backend yet." }
    }
  };
};

/**
 * Fetch a specific customer detail for admin.
 */
export const getAdminCustomerDetail = async (id: string | number): Promise<AdminCustomer> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Customer Detail endpoint is not implemented on the backend yet." }
    }
  };
};
