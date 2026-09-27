import { apiClient } from './client';
import { Product, ProductFilterParams, ProductPagination, Category } from '@/types/product';

export const getAdminProducts = async (params?: ProductFilterParams): Promise<ProductPagination> => {
  const response = await apiClient.get('/products/', { params });
  return response.data;
};

export const getAdminProduct = async (id: number): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}/`);
  return response.data;
};

export const createAdminProduct = async (data: Partial<Product> | FormData): Promise<Product> => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.post('/products/', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const updateAdminProduct = async (id: number, data: Partial<Product> | FormData): Promise<Product> => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.patch(`/products/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const deleteAdminProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}/`);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/products/categories/');
  if (response.data && 'results' in response.data) {
    return response.data.results;
  }
  return Array.isArray(response.data) ? response.data : [];
};

export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  const response = await apiClient.post('/products/categories/', data);
  return response.data;
};

export const updateCategory = async (id: number, data: Partial<Category>): Promise<Category> => {
  const response = await apiClient.patch(`/products/categories/${id}/`, data);
  return response.data;
};
