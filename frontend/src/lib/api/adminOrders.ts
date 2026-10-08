import { apiClient } from './client';
import { Order } from '@/types/dashboard';

export const getAdminOrders = async (params?: any): Promise<{ results: Order[], count: number }> => {
  const response = await apiClient.get('/orders/admin/all/', { params });
  return response.data;
};

export const getAdminOrderDetail = async (id: string | number): Promise<Order> => {
  const response = await apiClient.get(`/orders/${id}/`);
  return response.data;
};
