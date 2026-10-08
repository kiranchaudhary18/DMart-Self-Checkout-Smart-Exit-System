import { apiClient } from './client';
import { User } from '@/types/auth';

export interface AdminCustomer extends User {
  registration_date?: string;
  order_count?: number;
  loyalty_points?: number;
}

export const getAdminCustomers = async (params?: any): Promise<{ results: AdminCustomer[], count: number }> => {
  const response = await apiClient.get('/auth/admin/customers/', { params });
  return response.data;
};

export const getAdminCustomerDetail = async (id: string | number): Promise<AdminCustomer> => {
  const response = await apiClient.get(`/auth/admin/customers/${id}/`);
  return response.data;
};
