import { apiClient } from './client';
import { Order } from '@/types/dashboard';

/**
 * Fetch all orders for admin.
 * NOTE: The Django backend currently does not implement a dedicated 
 * /api/admin/orders endpoint or a ModelViewSet for admin orders.
 * This will intentionally fail or return an empty state so the UI 
 * can gracefully handle the missing backend implementation as requested.
 */
export const getAdminOrders = async (params?: any): Promise<{ results: Order[], count: number }> => {
  // We can try to call a non-existent endpoint or just throw a 404 to trigger the empty state.
  // The instruction says "Do not invent endpoints."
  // So we throw an error that the UI will catch.
  throw {
    response: {
      status: 404,
      data: { message: "Admin Orders endpoint is not implemented on the backend yet." }
    }
  };
};

/**
 * Fetch a specific order detail for admin.
 */
export const getAdminOrderDetail = async (id: string | number): Promise<Order> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Order Detail endpoint is not implemented on the backend yet." }
    }
  };
};
