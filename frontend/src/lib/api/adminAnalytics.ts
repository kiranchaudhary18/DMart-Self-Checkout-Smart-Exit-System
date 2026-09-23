import { apiClient } from './client';

export interface DashboardAnalytics {
  sales: {
    today: any;
    current_month: any;
    total: any;
  };
  orders: any;
  customers: {
    total: number;
    active: number;
    new_in_period: number;
  };
  inventory: {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
  };
  loyalty: {
    total_points_earned: number;
    total_points_redeemed: number;
  };
  security: {
    total_verifications: number;
    allowed: number;
    rejected: number;
  };
  fraud: {
    open_suspicious: number;
    high_severity: number;
    critical_severity: number;
  };
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await apiClient.get<{ status: string, data: DashboardAnalytics }>('/analytics/dashboard/');
  return response.data.data;
};

export const getSalesAnalytics = async (params?: any) => {
  const response = await apiClient.get('/analytics/sales/', { params });
  return response.data.data;
};

export const getOrdersAnalytics = async (params?: any) => {
  const response = await apiClient.get('/analytics/orders/', { params });
  return response.data.data;
};

export const getProductsAnalytics = async (params?: any) => {
  const response = await apiClient.get('/analytics/products/', { params });
  return response.data.data;
};

export const getInventoryAnalytics = async () => {
  const response = await apiClient.get('/analytics/inventory/');
  return response.data.data;
};
