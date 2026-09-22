import axios, { AxiosError } from 'axios';
import { ApiError } from '@/types';

/**
 * Parses and returns a clean error object from Axios errors
 * Prevents backend stack traces from being exposed to the UI.
 */
export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Server responded with a status other than 2xx
    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      switch (status) {
        case 400:
          return { message: 'Bad Request. Please check your input.', code: '400', ...data };
        case 401:
          return { message: 'Unauthorized. Please login again.', code: '401', ...data };
        case 403:
          return { message: 'Forbidden. You do not have permission to access this resource.', code: '403', ...data };
        case 404:
          return { message: 'Resource not found.', code: '404', ...data };
        case 409:
          return { message: 'Conflict. The resource already exists or state is invalid.', code: '409', ...data };
        case 422:
          return { message: 'Validation Error.', code: '422', ...data };
        case 429:
          return { message: 'Too Many Requests. Please try again later.', code: '429', ...data };
        case 500:
          return { message: 'Internal Server Error. Our team has been notified.', code: '500' };
        default:
          return { message: data?.message || 'An unexpected server error occurred.', code: String(status), ...data };
      }
    }
    
    // Request was made but no response received (Network Error)
    if (axiosError.request) {
      return { message: 'Network error. Please check your internet connection.', code: 'NETWORK_ERROR' };
    }
  }

  // Something else happened
  return { message: 'An unexpected error occurred.', code: 'UNKNOWN_ERROR' };
};
