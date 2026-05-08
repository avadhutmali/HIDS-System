import { formatDistanceToNow } from '../utils/format';
import { SeverityBadge } from './SeverityBadge';
import type { WsAlertMessage } from '../types';
import type { Severity } from '../types';

const eventTypeLabel: Record<string, string> = {
  EVIL_TWIN: 'Evil Twin AP',
  APK_UNKNOWN_SOURCE: 'Unknown APK',
  OTP_READER_APP: 'OTP Reader',
  ERP_BRUTEFORCE: 'ERP Brute Force',
  FIM_CHANGE: 'File Integrity',
  PROCESS_ANOMALY: 'Process Anomaly',
  PORT_SCAN: 'Port Scan',
  MALICIOUS_IP: 'Malicious IP',
  NEW_ALERT: 'Alert',
  SCORE_UPDATE: 'Score Update',
  DEVICE_STATUS: 'Device Status',
  PATIENT_ZERO: 'Patient Zero',
};

interface AlertCardProps {
  alert: WsAlertMessage;
  onDismiss?: () => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div className="animate-slide-in" style={{
      position: 'relative',
      borderRadius: '12px',
      padding: '14px 16px',
      background: isCritical ? '#fef2f2' : '#f8fafc',
      border: `1px solid ${isCritical ? '#fecaca' : '#e2e8f0'}`,
      transition: 'all 0.15s ease',
    }}>
      {isCritical && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(90deg, #ef4444, #f97316)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {alert.severity && <SeverityBadge severity={alert.severity as Severity} />}
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
              {eventTypeLabel[alert.eventType ?? alert.type] ?? alert.type}
            </span>
          </div>
          {alert.summary && (
            <p style={{
              fontSize: '13px', lineHeight: 1.5, color: '#1e293b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{alert.summary}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            {alert.prn && (
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                PRN: {alert.prn}
              </span>
            )}
            {alert.deviceModel && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>{alert.deviceModel}</span>
            )}
            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
              {formatDistanceToNow(alert.timestamp)}
            </span>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '18px', lineHeight: 1, color: '#94a3b8',
              padding: '2px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >×</button>
        )}
      </div>
    </div>
  );
}
