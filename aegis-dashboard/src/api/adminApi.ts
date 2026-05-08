import type {
  DeviceListResponse, DeviceDetailResponse,
  ThreatListResponse, AnalyticsSummary,
  Policy
} from '../types';

// BYPASS: Mocking all API responses since backend is disconnected
export const adminApi = {
  login: async (username: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (username === 'admin' && password === 'admin123') {
      return { data: { token: 'mock-jwt-token', role: 'ADMIN' } };
    }
    throw new Error('Invalid credentials');
  },

  getDevices: async (_params?: any) => {
    return {
      data: {
        total: 3,
        page: 0,
        size: 20,
        devices: [
          { id: '1', prn: '2021BTECS001', deviceType: 'ANDROID', currentScore: 85, riskLevel: 'CLEAN', erpAccessBlocked: false, lastSeen: new Date().toISOString(), department: 'Computer', deviceModel: 'Samsung Galaxy S22' },
          { id: '2', prn: '2021BTECS002', deviceType: 'PC', currentScore: 45, riskLevel: 'SUSPICIOUS', erpAccessBlocked: true, lastSeen: new Date().toISOString(), department: 'IT', deviceModel: 'Dell XPS 15' },
          { id: '3', prn: '2021BTECS003', deviceType: 'ANDROID', currentScore: 25, riskLevel: 'COMPROMISED', erpAccessBlocked: true, lastSeen: new Date().toISOString(), department: 'Mechanical', deviceModel: 'OnePlus 9' },
        ]
      } as DeviceListResponse
    };
  },

  getDevice: async (id: string) => {
    return {
      data: {
        device: { id, prn: '2021BTECS001', deviceType: 'ANDROID', currentScore: 85, riskLevel: 'CLEAN', erpAccessBlocked: false, lastSeen: new Date().toISOString(), department: 'Computer', deviceModel: 'Samsung Galaxy S22' },
        recentEvents: [
          { id: 1, eventType: 'PORT_SCAN', severity: 'MEDIUM', occurredAt: new Date(Date.now() - 3600000).toISOString(), receivedAt: new Date(Date.now() - 3500000).toISOString(), acknowledged: false, payload: { port: 8080 } },
          { id: 2, eventType: 'EVIL_TWIN', severity: 'CRITICAL', occurredAt: new Date(Date.now() - 86400000).toISOString(), receivedAt: new Date(Date.now() - 86000000).toISOString(), acknowledged: true, payload: { bssid: 'xx:yy:zz' } },
        ],
        scoreHistory: [
          { score: 100, timestamp: new Date(Date.now() - 7200000).toISOString() },
          { score: 85, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { score: 85, timestamp: new Date().toISOString() }
        ]
      } as unknown as DeviceDetailResponse
    };
  },

  blockDevice: async (_id: string, _blocked: boolean, _reason?: string) => {
    return { data: { success: true } };
  },

  getThreats: async (_params?: any) => {
    return {
      data: {
        total: 2,
        page: 0,
        size: 20,
        events: [
          { id: 1, eventType: 'EVIL_TWIN', severity: 'CRITICAL', deviceId: '1', occurredAt: new Date().toISOString(), receivedAt: new Date().toISOString(), acknowledged: false, payload: {} },
          { id: 2, eventType: 'APK_UNKNOWN_SOURCE', severity: 'HIGH', deviceId: '2', occurredAt: new Date(Date.now() - 3600000).toISOString(), receivedAt: new Date(Date.now() - 3500000).toISOString(), acknowledged: true, payload: {} },
        ]
      } as ThreatListResponse
    };
  },

  acknowledgeEvent: async (_id: number, _note?: string) => {
    return { data: { success: true } };
  },

  getAnalyticsSummary: async () => {
    return {
      data: {
        devicesOnline: 42,
        alertsToday: 5,
        criticalActive: 1,
        scoreDistribution: { clean: 35, suspicious: 5, compromised: 2 },
        topThreatTypes: [{ type: 'EVIL_TWIN', count: 3 }, { type: 'PORT_SCAN', count: 2 }, { type: 'APK_UNKNOWN_SOURCE', count: 1 }]
      } as AnalyticsSummary
    };
  },

  getTrends: async (_period = 'DAILY', _metric = 'ALERTS') => {
    return { data: {} };
  },

  getPatientZero: async () => {
    return {
      data: {
        clusters: [
          {
            threatPattern: 'EVIL_TWIN',
            affectedCount: 5,
            firstSeen: new Date(Date.now() - 86400000).toISOString(),
            patientZeroDevice: { id: '3', prn: '2021BTECS003', deviceType: 'ANDROID', currentScore: 25, riskLevel: 'COMPROMISED', erpAccessBlocked: true, lastSeen: new Date().toISOString(), department: 'Mechanical', deviceModel: 'OnePlus 9' }
          }
        ]
      }
    };
  },

  getPolicy: async () => {
    return { data: { erpMinScore: 60, knownBssids: ['aa:bb:cc:dd:ee:ff'], appWhitelist: ['com.whatsapp'] } as Policy };
  },

  updatePolicy: async (data: Partial<Policy>) => {
    return { data: { ...data } as Policy };
  },

  exportReport: async (_format = 'CSV') => {
    return { data: new Blob(['mock csv data'], { type: 'text/csv' }) };
  },
};
