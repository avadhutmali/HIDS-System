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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Security Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            WCE Campus · Real-time intrusion detection
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border"
             style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-surface)' }}>
          <Activity className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
          Live · {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Devices Online"
          value={summary?.devicesOnline ?? '—'}
          icon={<Monitor className="w-5 h-5" />}
          accent="cyan"
          subtitle="Last 5 minutes"
        />
        <StatCard
          title="Alerts Today"
          value={summary?.alertsToday ?? '—'}
          icon={<Bell className="w-5 h-5" />}
          accent="yellow"
          subtitle="All severities"
        />
        <StatCard
          title="Critical Active"
          value={summary?.criticalActive ?? '—'}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
          subtitle="Unacknowledged"
        />
        <StatCard
          title="Clean Devices"
          value={sd?.clean ?? '—'}
          icon={<Shield className="w-5 h-5" />}
          accent="green"
          subtitle={`Suspicious: ${sd?.suspicious ?? 0} · Compromised: ${sd?.compromised ?? 0}`}
        />
      </div>

      {/* Score Distribution */}
      {sd && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            Risk Distribution
          </h2>
          <div className="flex gap-2 h-3 rounded-full overflow-hidden">
            {(sd.clean + sd.suspicious + sd.compromised) > 0 && (
              <>
                <div className="bg-green-500 rounded-full transition-all duration-700"
                     style={{ width: `${(sd.clean / (sd.clean + sd.suspicious + sd.compromised)) * 100}%` }} />
                <div className="bg-yellow-500 rounded-full transition-all duration-700"
                     style={{ width: `${(sd.suspicious / (sd.clean + sd.suspicious + sd.compromised)) * 100}%` }} />
                <div className="bg-red-500 rounded-full transition-all duration-700"
                     style={{ width: `${(sd.compromised / (sd.clean + sd.suspicious + sd.compromised)) * 100}%` }} />
              </>
            )}
          </div>
          <div className="flex gap-6 mt-3">
            {[
              { label: 'Clean', count: sd.clean, color: 'text-green-400' },
              { label: 'Suspicious', count: sd.suspicious, color: 'text-yellow-400' },
              { label: 'Compromised', count: sd.compromised, color: 'text-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${color}`}>{count}</span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column: Recent Devices + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Devices */}
        <div className="rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> Devices
            </h2>
            <Link to="/devices" className="text-xs font-mono transition-colors hover:text-white"
                  style={{ color: 'var(--color-accent)' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {devicesData?.devices.map(d => (
              <Link key={d.id} to={`/devices/${d.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'var(--color-surface2)' }}>
                  {d.deviceType === 'ANDROID'
                    ? <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--color-blue)' }} />
                    : <Monitor className="w-3.5 h-3.5" style={{ color: 'var(--color-green)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                    {d.deviceModel ?? d.prn}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: 'var(--color-muted)' }}>
                    {d.department} · {formatDistanceToNow(d.lastSeen)}
                  </div>
                </div>
                <ScoreBadge score={d.currentScore} />
              </Link>
            )) ?? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No devices enrolled
              </p>
            )}
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live Feed
            </h2>
            <Link to="/alerts" className="text-xs font-mono transition-colors hover:text-white"
                  style={{ color: 'var(--color-accent)' }}>View all →</Link>
          </div>
          <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
            {alerts.slice(0, 8).length > 0
              ? alerts.slice(0, 8).map((a, i) => <AlertCard key={i} alert={a} />)
              : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Shield className="w-8 h-8 opacity-20" />
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No live alerts</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-border2)' }}>
                    Waiting for events…
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Recent Threats */}
      {threatsData && threatsData.events.length > 0 && (
        <div className="rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Recent Threats
            </h2>
            <Link to="/alerts" className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  {['Event Type', 'Severity', 'Device', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-mono tracking-wider uppercase"
                        style={{ color: 'var(--color-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {threatsData.events.map(e => (
                  <tr key={e.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--color-blue)' }}>
                      {e.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3">
                      <SeverityBadge severity={e.severity as Severity} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                      {e.deviceId.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                      {formatDistanceToNow(e.occurredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
