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
    <div className={`relative rounded-lg border p-3.5 animate-slide-in transition-all ${
      isCritical
        ? 'border-red-500/40 bg-red-500/5'
        : 'border-slate-700/50 bg-slate-800/30'
    }`}>
      {isCritical && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg bg-gradient-to-r from-red-500 to-orange-500" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {alert.severity && <SeverityBadge severity={alert.severity as Severity} />}
            <span className="text-xs font-mono text-slate-400">
              {eventTypeLabel[alert.eventType ?? alert.type] ?? alert.type}
            </span>
          </div>
          {alert.summary && (
            <p className="text-sm text-slate-200 leading-snug truncate">{alert.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {alert.prn && (
              <span className="text-[11px] font-mono text-slate-500">PRN: {alert.prn}</span>
            )}
            {alert.deviceModel && (
              <span className="text-[11px] text-slate-500 truncate">{alert.deviceModel}</span>
            )}
            <span className="text-[11px] text-slate-600 ml-auto">
              {formatDistanceToNow(alert.timestamp)}
            </span>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0 text-lg leading-none mt-0.5"
          >×</button>
        )}
      </div>
    </div>
  );
}
