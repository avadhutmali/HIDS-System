import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Smartphone, Lock, Unlock, CheckCircle } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime, formatDistanceToNow } from '../utils/format';
import type { Severity } from '../types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['device', id], queryFn: () => adminApi.getDevice(id!).then(r => r.data), enabled: !!id, refetchInterval: 20_000 });
  const blockMutation = useMutation({ mutationFn: (blocked: boolean) => adminApi.blockDevice(id!, blocked), onSuccess: () => qc.invalidateQueries({ queryKey: ['device', id] }) });
  const ackMutation = useMutation({ mutationFn: (eventId: number) => adminApi.acknowledgeEvent(eventId, 'Acknowledged from device detail'), onSuccess: () => qc.invalidateQueries({ queryKey: ['device', id] }) });

  if (isLoading || !data) return <PageLoader />;
  const { device, recentEvents, scoreHistory } = data;

  const chartData = {
    labels: scoreHistory.slice().reverse().map(s => formatDistanceToNow(s.timestamp)),
    datasets: [{ data: scoreHistory.slice().reverse().map(s => s.score), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.06)', borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#4f46e5' }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 8 } },
    },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <Link to="/devices" className="btn-secondary" style={{ marginTop: '4px', padding: '8px' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
              {device.deviceType === 'ANDROID' ? <Smartphone style={{ width: '20px', height: '20px', color: '#4f46e5' }} /> : <Monitor style={{ width: '20px', height: '20px', color: '#059669' }} />}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{device.deviceModel ?? device.prn}</h1>
              <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{device.prn} · {device.department} · {device.deviceType}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ScoreBadge score={device.currentScore} />
          <button onClick={() => blockMutation.mutate(!device.erpAccessBlocked)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            ...(device.erpAccessBlocked ? { color: '#dc2626', background: '#fef2f2' } : { color: '#059669', background: '#f0fdf4' }),
          }}>
            {device.erpAccessBlocked ? <Lock style={{ width: '14px', height: '14px' }} /> : <Unlock style={{ width: '14px', height: '14px' }} />}
            {device.erpAccessBlocked ? 'Blocked' : 'ERP Allowed'}
          </button>
        </div>
      </div>

      <div style={{ ...card, padding: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '18px' }}>Score History</h2>
        {scoreHistory.length > 1 ? (
          <div style={{ height: '180px' }}><Line data={chartData} options={chartOptions} /></div>
        ) : (
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Not enough data for chart</p>
          </div>
        )}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Security Events</h2>
        </div>
        {recentEvents.length === 0 ? (
          <p style={{ padding: '50px 22px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No security events recorded</p>
        ) : recentEvents.map(e => (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 22px',
            borderBottom: '1px solid #f8fafc', opacity: e.acknowledged ? 0.5 : 1,
            transition: 'background 0.15s',
          }}
          onMouseEnter={ev => { if (!e.acknowledged) ev.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; }}>
            <div style={{ marginTop: '2px' }}><SeverityBadge severity={e.severity as Severity} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#4f46e5', marginBottom: '4px' }}>{e.eventType.replace(/_/g, ' ')}</div>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', borderRadius: '8px', padding: '8px 12px', marginTop: '6px', overflowX: 'auto', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              )}
              <div style={{ fontSize: '11px', marginTop: '6px', color: '#94a3b8' }}>{formatDateTime(e.occurredAt)}</div>
            </div>
            <div style={{ flexShrink: 0 }}>
              {e.acknowledged ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>
                  <CheckCircle style={{ width: '14px', height: '14px' }} /> Ack'd
                </span>
              ) : (
                <button onClick={() => ackMutation.mutate(e.id)} className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}>Acknowledge</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
