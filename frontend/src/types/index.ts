/**
 * Standard API Error Response
 */
export interface ApiError {
  message?: string;
  detail?: string;
  code?: string;
  [key: string]: any;
}

/**
 * Standard Paginated Response Pattern (DRF)
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Common Model Fields
 */
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
}
