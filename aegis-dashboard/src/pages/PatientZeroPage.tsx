import { useQuery } from '@tanstack/react-query';
import { Activity, GitBranch, AlertTriangle, Clock, Users } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/format';

const threatMap: Record<string, { bg: string; color: string; border: string }> = {
  EVIL_TWIN: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  APK_UNKNOWN_SOURCE: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  OTP_READER_APP: { bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  ERP_BRUTEFORCE: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  FIM_CHANGE: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  PROCESS_ANOMALY: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  PORT_SCAN: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  MALICIOUS_IP: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
};
const defaultThreat = { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function PatientZeroPage() {
  const { data, isLoading } = useQuery({ queryKey: ['patient-zero'], queryFn: () => adminApi.getPatientZero().then(r => r.data), refetchInterval: 60_000 });
  if (isLoading) return <PageLoader />;
  const clusters = data?.clusters ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
          <Activity style={{ width: '22px', height: '22px', color: '#4f46e5' }} /> Patient Zero Tracker
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>Threat origin correlation across campus devices</p>
      </div>

      <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#eef2ff', borderColor: '#c7d2fe' }}>
        <GitBranch style={{ width: '18px', height: '18px', color: '#4f46e5', marginTop: '2px', flexShrink: 0 }} />
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#3730a3' }}>
          When ≥3 devices report the same threat type within a 2-hour window, Aegis identifies the 
          first infected device (Patient Zero) and tracks lateral spread. Use this view to contain 
          outbreaks and quarantine source devices first.
        </p>
      </div>

      {clusters.length === 0 ? (
        <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Activity style={{ width: '28px', height: '28px', color: '#22c55e' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No Active Clusters</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>No multi-device threat spread detected. Campus is secure.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {clusters.map((cluster, i) => {
            const tc = threatMap[cluster.threatPattern] ?? defaultThreat;
            return (
            <div key={i} style={{ ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#ea580c' }} />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                    {cluster.threatPattern.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                    <Users style={{ width: '14px', height: '14px' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ea580c' }}>{cluster.affectedCount}</span> affected
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <Clock style={{ width: '14px', height: '14px' }} />{formatDateTime(cluster.firstSeen)}
                  </div>
                </div>
              </div>

              {cluster.patientZeroDevice && (
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px' }}>Patient Zero</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#dc2626', background: '#fee2e2' }}>0</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{cluster.patientZeroDevice.deviceModel ?? cluster.patientZeroDevice.prn}</div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginTop: '2px' }}>PRN: {cluster.patientZeroDevice.prn} · {cluster.patientZeroDevice.department}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', marginBottom: '4px', border: '1px solid',
                        ...(cluster.patientZeroDevice.riskLevel === 'COMPROMISED' ? { color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' } : { color: '#d97706', background: '#fffbeb', borderColor: '#fde68a' })
                      }}>{cluster.patientZeroDevice.riskLevel}</div>
                      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4f46e5' }}>Score: {cluster.patientZeroDevice.currentScore}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px' }}>Spread Timeline</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#dc2626', background: '#fee2e2', border: '2px solid #fecaca' }}>P0</div>
                      <div style={{ flex: 1, height: '3px', borderRadius: '999px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                      {Array.from({ length: Math.min(cluster.affectedCount - 1, 8) }).map((_, j) => (
                        <div key={j} style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa' }}>{j+1}</div>
                      ))}
                      {cluster.affectedCount > 9 && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>+{cluster.affectedCount-9} more</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}
