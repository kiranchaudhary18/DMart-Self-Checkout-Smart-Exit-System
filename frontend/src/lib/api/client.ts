import axios from 'axios';
import { handleApiError } from './errors';

// Get base URL from environment variables, fallback to localhost for safety during dev
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Global Axios Instance for Backend Communication
 * Includes centralized config, timeout, and intercepts headers.
 */
export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Requests (Attaching JWT token)
apiClient.interceptors.request.use(
  (config) => {
    // Lazy import to prevent circular dependencies if auth functions call apiClient
    const { getAccessToken } = require('@/lib/auth/token');
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for Responses (Handle 401 Unauthorized / Token Refresh)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { getRefreshToken, setTokens, removeTokens } = require('@/lib/auth/token');
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          // Attempt to refresh token
          const refreshResponse = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (refreshResponse.data.access) {
            // Success, save new tokens
            setTokens({
              access: refreshResponse.data.access,
              refresh: refreshResponse.data.refresh || refreshToken // sometimes DRF returns only access
            });

            // Update header and retry original request
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return apiClient(originalRequest);
          }
        }
        
        // Refresh token invalid or absent
        removeTokens();
        // Fallthrough to reject
      } catch (refreshError) {
        // Refresh failed, logout
        const { removeTokens } = require('@/lib/auth/token');
        removeTokens();
      }
    }

    // We will parse the error to ensure no backend traces leak to the UI
    const parsedError = handleApiError(error);
    return Promise.reject(parsedError);
  }
);
