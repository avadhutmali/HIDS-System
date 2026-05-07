import apiClient from './apiClient';
import type {
  DeviceListResponse, DeviceDetailResponse,
  ThreatListResponse, AnalyticsSummary,
  PatientZeroCluster, Policy
} from '../types';

export const adminApi = {
  login: (username: string, password: string) =>
    apiClient.post('/admin/auth/login', { username, password }),

  getDevices: (params?: {
    department?: string; riskLevel?: string;
    deviceType?: string; page?: number; size?: number;
  }) => apiClient.get<DeviceListResponse>('/admin/devices', { params }),

  getDevice: (id: string) =>
    apiClient.get<DeviceDetailResponse>(`/admin/devices/${id}`),

  blockDevice: (id: string, blocked: boolean, reason?: string) =>
    apiClient.put(`/admin/devices/${id}/block`, { blocked, reason }),

  getThreats: (params?: {
    severity?: string; eventType?: string; acknowledged?: boolean;
    from?: string; to?: string; page?: number; size?: number;
  }) => apiClient.get<ThreatListResponse>('/admin/threats', { params }),

  acknowledgeEvent: (id: number, note?: string) =>
    apiClient.put(`/admin/threats/${id}/acknowledge`, { note }),

  getAnalyticsSummary: () =>
    apiClient.get<AnalyticsSummary>('/admin/analytics/summary'),

  getTrends: (period = 'DAILY', metric = 'ALERTS') =>
    apiClient.get('/admin/analytics/trends', { params: { period, metric } }),

  getPatientZero: () =>
    apiClient.get<{ clusters: PatientZeroCluster[] }>('/admin/patient-zero'),

  getPolicy: () =>
    apiClient.get<Policy>('/admin/policy').catch(() => ({
      data: { erpMinScore: 60, knownBssids: [], appWhitelist: [] } as Policy
    })),

  updatePolicy: (data: Partial<Policy>) =>
    apiClient.put<Policy>('/admin/policy', data),

  exportReport: (format = 'CSV') =>
    apiClient.get('/admin/reports/export', { params: { format }, responseType: 'blob' }),
};
