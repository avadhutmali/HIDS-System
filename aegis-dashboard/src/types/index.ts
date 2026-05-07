// TypeScript types matching the Spring Boot backend DTOs

export interface Device {
  id: string;
  prn: string;
  deviceModel: string;
  deviceType: 'ANDROID' | 'PC';
  department: string;
  currentScore: number;
  riskLevel: 'CLEAN' | 'SUSPICIOUS' | 'COMPROMISED';
  erpAccessBlocked: boolean;
  lastSeen: string;
}

export interface SecurityEvent {
  id: number;
  deviceId: string;
  eventType: EventType;
  severity: Severity;
  payload: Record<string, unknown>;
  acknowledged: boolean;
  occurredAt: string;
  receivedAt: string;
}

export type EventType =
  | 'EVIL_TWIN'
  | 'APK_UNKNOWN_SOURCE'
  | 'OTP_READER_APP'
  | 'ERP_BRUTEFORCE'
  | 'FIM_CHANGE'
  | 'PROCESS_ANOMALY'
  | 'PORT_SCAN'
  | 'MALICIOUS_IP';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface DeviceListResponse {
  devices: Device[];
  total: number;
  page: number;
  size: number;
}

export interface DeviceDetailResponse {
  device: Device;
  recentEvents: SecurityEvent[];
  scoreHistory: { score: number; timestamp: string }[];
}

export interface AnalyticsSummary {
  devicesOnline: number;
  alertsToday: number;
  criticalActive: number;
  erpHitsToday: number;
  scoreDistribution: { clean: number; suspicious: number; compromised: number };
  topThreatTypes: { type: string; count: number }[];
}

export interface PatientZeroCluster {
  threatPattern: string;
  patientZeroDevice: Device | null;
  affectedCount: number;
  firstSeen: string;
}

export interface Policy {
  erpMinScore: number;
  knownBssids: string[];
  appWhitelist: string[];
  erpAccessBlocked?: boolean;
  updatedAt?: string;
}

export interface WsAlertMessage {
  type: 'NEW_ALERT' | 'SCORE_UPDATE' | 'DEVICE_STATUS' | 'PATIENT_ZERO';
  eventId?: number;
  deviceId?: string;
  deviceModel?: string;
  prn?: string;
  eventType?: string;
  severity?: Severity;
  summary?: string;
  timestamp: string;
}

export interface ThreatListResponse {
  events: SecurityEvent[];
  total: number;
  page: number;
  size: number;
}
