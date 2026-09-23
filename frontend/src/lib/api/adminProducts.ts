import { apiClient } from './client';
import { Product, ProductFilterParams, ProductPagination, Category } from '@/types/product';

export const getAdminProducts = async (params?: ProductFilterParams): Promise<ProductPagination> => {
  const response = await apiClient.get('/api/products/', { params });
  return response.data;
};

export const getAdminProduct = async (id: number): Promise<Product> => {
  const response = await apiClient.get(`/api/products/${id}/`);
  return response.data;
};

export const createAdminProduct = async (data: Partial<Product> | FormData): Promise<Product> => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.post('/api/products/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const updateAdminProduct = async (id: number, data: Partial<Product> | FormData): Promise<Product> => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.patch(`/api/products/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const deleteAdminProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/products/${id}/`);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/api/categories/');
  return response.data;
};
