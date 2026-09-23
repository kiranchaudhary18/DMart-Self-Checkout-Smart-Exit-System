import { apiClient } from './client';

export interface FraudEvent {
  id: number;
  activity_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "FALSE_POSITIVE";
  order_reference?: string;
  ip_address?: string;
  detected_at: string;
  description: string;
}

/**
 * NOTE: The Django backend currently does not implement dedicated 
 * admin fraud management endpoints beyond the analytics summary.
 */
export const getAdminFraudEvents = async (params?: any): Promise<{ results: FraudEvent[], count: number }> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Fraud events endpoint is not implemented on the backend yet." }
    }
  };
};

export const getAdminFraudEventDetail = async (id: number | string): Promise<FraudEvent> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Fraud event detail endpoint is not implemented on the backend yet." }
    }
  };
};

export const updateAdminFraudEventStatus = async (id: number | string, status: FraudEvent['status']): Promise<FraudEvent> => {
  throw {
    response: {
      status: 404,
      data: { message: "Admin Fraud event update endpoint is not implemented on the backend yet." }
    }
  };
};
