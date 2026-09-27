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
        case 400: {
          let customMessage = 'Bad Request. Please check your input.';
          
          if (data && typeof data === 'object') {
            // Check if there is an explicit "errors" dict from the backend
            const errDict = data.errors || data;
            
            // Find the first key that isn't 'message' or 'success'
            const keys = Object.keys(errDict).filter(k => k !== 'message' && k !== 'success');
            
            if (keys.length > 0) {
              const firstKey = keys[0];
              const firstError = errDict[firstKey];
              if (Array.isArray(firstError) && typeof firstError[0] === 'string') {
                customMessage = `${firstKey}: ${firstError[0]}`;
              } else if (typeof firstError === 'string') {
                customMessage = firstError;
              }
            } else if (data.message) {
              customMessage = data.message;
            }
          }
          return { code: '400', ...data, message: customMessage };
        }
        case 401:
          return { code: '401', ...data, message: 'Unauthorized. Please login again.' };
        case 403:
          return { code: '403', ...data, message: 'Forbidden. You do not have permission to access this resource.' };
        case 404:
          return { code: '404', ...data, message: 'Resource not found.' };
        case 409:
          return { code: '409', ...data, message: 'Conflict. The resource already exists or state is invalid.' };
        case 422:
          return { code: '422', ...data, message: 'Validation Error.' };
        case 429:
          return { code: '429', ...data, message: 'Too Many Requests. Please try again later.' };
        case 500:
          return { message: 'Internal Server Error. Our team has been notified.', code: '500' };
        default:
          return { code: String(status), ...data, message: data?.message || 'An unexpected server error occurred.' };
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
