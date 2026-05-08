import { useQuery } from '@tanstack/react-query';
import { Monitor, Bell, AlertTriangle, Activity, Shield, Cpu, Smartphone, TrendingUp } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { StatCard } from '../components/StatCard';
import { AlertCard } from '../components/AlertCard';
import { PageLoader } from '../components/LoadingSpinner';
import { useAlertStore } from '../store/alertStore';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { Link } from 'react-router-dom';
import type { Severity } from '../types';
import { formatDistanceToNow } from '../utils/format';

const cardStyle = {
  background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
};

export function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => adminApi.getAnalyticsSummary().then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices-overview'],
    queryFn: () => adminApi.getDevices({ size: 5 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: threatsData } = useQuery({
    queryKey: ['threats-overview'],
    queryFn: () => adminApi.getThreats({ size: 5, acknowledged: false }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const { alerts } = useAlertStore();

  if (isLoading) return <PageLoader />;

  const sd = summary?.scoreDistribution;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Security Overview
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            WCE Campus · Real-time intrusion detection
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', fontFamily: 'var(--font-mono)',
          padding: '8px 14px', borderRadius: '10px',
          background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <Activity style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
          Live · {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Devices Online" value={summary?.devicesOnline ?? '—'}
          icon={<Monitor style={{ width: '20px', height: '20px' }} />} accent="cyan" subtitle="Last 5 minutes" />
        <StatCard title="Alerts Today" value={summary?.alertsToday ?? '—'}
          icon={<Bell style={{ width: '20px', height: '20px' }} />} accent="yellow" subtitle="All severities" />
        <StatCard title="Critical Active" value={summary?.criticalActive ?? '—'}
          icon={<AlertTriangle style={{ width: '20px', height: '20px' }} />} accent="red" subtitle="Unacknowledged" />
        <StatCard title="Clean Devices" value={sd?.clean ?? '—'}
          icon={<Shield style={{ width: '20px', height: '20px' }} />} accent="green"
          subtitle={`Suspicious: ${sd?.suspicious ?? 0} · Compromised: ${sd?.compromised ?? 0}`} />
      </div>

      {/* Risk Distribution */}
      {sd && (
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <TrendingUp style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
            Risk Distribution
          </h2>
          <div style={{ display: 'flex', gap: '4px', height: '10px', borderRadius: '999px', overflow: 'hidden', background: '#f1f5f9' }}>
            {(sd.clean + sd.suspicious + sd.compromised) > 0 && (<>
              <div style={{ width: `${(sd.clean / (sd.clean + sd.suspicious + sd.compromised)) * 100}%`, background: '#22c55e', borderRadius: '999px', transition: 'width 0.7s ease' }} />
              <div style={{ width: `${(sd.suspicious / (sd.clean + sd.suspicious + sd.compromised)) * 100}%`, background: '#f59e0b', borderRadius: '999px', transition: 'width 0.7s ease' }} />
              <div style={{ width: `${(sd.compromised / (sd.clean + sd.suspicious + sd.compromised)) * 100}%`, background: '#ef4444', borderRadius: '999px', transition: 'width 0.7s ease' }} />
            </>)}
          </div>
          <div style={{ display: 'flex', gap: '28px', marginTop: '14px' }}>
            {[
              { label: 'Clean', count: sd.clean, color: '#059669', dot: '#22c55e' },
              { label: 'Suspicious', count: sd.suspicious, color: '#d97706', dot: '#f59e0b' },
              { label: 'Compromised', count: sd.compromised, color: '#dc2626', dot: '#ef4444' },
            ].map(({ label, count, color, dot }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color }}>{count}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column: Devices + Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Devices */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu style={{ width: '16px', height: '16px', color: '#4f46e5' }} /> Devices
            </h2>
            <Link to="/devices" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div>
            {devicesData?.devices.map((d, i) => (
              <Link key={d.id} to={`/devices/${d.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 22px', textDecoration: 'none',
                borderBottom: i < (devicesData.devices.length - 1) ? '1px solid #f8fafc' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f1f5f9', flexShrink: 0,
                }}>
                  {d.deviceType === 'ANDROID'
                    ? <Smartphone style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
                    : <Monitor style={{ width: '16px', height: '16px', color: '#059669' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.deviceModel ?? d.prn}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    {d.department} · {formatDistanceToNow(d.lastSeen)}
                  </div>
                </div>
                <ScoreBadge score={d.currentScore} />
              </Link>
            )) ?? (
              <p style={{ padding: '40px 22px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                No devices enrolled
              </p>
            )}
          </div>
        </div>

        {/* Live Alert Feed */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.4)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
              Live Feed
            </h2>
            <Link to="/alerts" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {alerts.slice(0, 8).length > 0
              ? alerts.slice(0, 8).map((a, i) => <AlertCard key={i} alert={a} />)
              : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '10px' }}>
                  <Shield style={{ width: '32px', height: '32px', color: '#e2e8f0' }} />
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>No live alerts</p>
                  <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>Waiting for events…</p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Recent Threats */}
      {threatsData && threatsData.events.length > 0 && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} /> Recent Threats
            </h2>
            <Link to="/alerts" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>View all →</Link>
          </div>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['Event Type', 'Severity', 'Device', 'Time'].map(h => (
                  <th key={h} style={{ padding: '12px 22px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {threatsData.events.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 22px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                    {e.eventType.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '12px 22px' }}><SeverityBadge severity={e.severity as Severity} /></td>
                  <td style={{ padding: '12px 22px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#475569' }}>{e.deviceId.slice(0, 8)}…</td>
                  <td style={{ padding: '12px 22px', fontSize: '12px', color: '#94a3b8' }}>{formatDistanceToNow(e.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
