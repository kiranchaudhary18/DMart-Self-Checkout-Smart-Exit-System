import { apiClient } from './client';
import { Inventory, StockTransaction, InventoryAdjustmentPayload } from '@/types/inventory';

export const getInventoryList = async (params?: any): Promise<Inventory[]> => {
  const response = await apiClient.get('/api/inventory/', { params });
  return response.data.results || response.data; // Depending on pagination
};

export const getInventoryByProduct = async (productId: number): Promise<Inventory> => {
  const response = await apiClient.get(`/api/inventory/${productId}/`);
  return response.data.data; // Wrapped in standard response based on backend view
};

export const getLowStock = async (): Promise<Inventory[]> => {
  const response = await apiClient.get('/api/inventory/low-stock/');
  return response.data.results || response.data;
};

export const getStockTransactions = async (params?: any): Promise<StockTransaction[]> => {
  const response = await apiClient.get('/api/inventory/transactions/', { params });
  return response.data.results || response.data;
};

export const adjustStock = async (payload: InventoryAdjustmentPayload): Promise<Inventory> => {
  const response = await apiClient.post('/api/inventory/adjust/', payload);
  return response.data.data;
};
