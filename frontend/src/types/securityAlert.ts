export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  detectedAt: string;
  orderReference?: string;
  message?: string;
}
