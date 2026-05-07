import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Smartphone, Lock, Unlock, CheckCircle } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ScoreBadge } from '../components/ScoreBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime, formatDistanceToNow } from '../utils/format';
import type { Severity } from '../types';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => adminApi.getDevice(id!).then(r => r.data),
    enabled: !!id,
    refetchInterval: 20_000,
  });

  const blockMutation = useMutation({
    mutationFn: (blocked: boolean) => adminApi.blockDevice(id!, blocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device', id] }),
  });

  const ackMutation = useMutation({
    mutationFn: (eventId: number) => adminApi.acknowledgeEvent(eventId, 'Acknowledged from device detail'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device', id] }),
  });

  if (isLoading || !data) return <PageLoader />;
  const { device, recentEvents, scoreHistory } = data;

  // Chart data
  const chartData = {
    labels: scoreHistory.slice().reverse().map(s => formatDistanceToNow(s.timestamp)),
    datasets: [{
      data: scoreHistory.slice().reverse().map(s => s.score),
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0,212,255,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#00d4ff',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#545f70', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#545f70', font: { size: 10 }, maxTicksLimit: 8 } },
    },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#141c24', borderColor: '#1e2d3d', borderWidth: 1 } },
  };

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link to="/devices" className="mt-1 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'var(--color-surface2)' }}>
              {device.deviceType === 'ANDROID'
                ? <Smartphone className="w-5 h-5 text-blue-400" />
                : <Monitor className="w-5 h-5 text-green-400" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{device.deviceModel ?? device.prn}</h1>
              <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>
                {device.prn} · {device.department} · {device.deviceType}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={device.currentScore} />
          <button
            onClick={() => blockMutation.mutate(!device.erpAccessBlocked)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
              device.erpAccessBlocked
                ? 'text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                : 'text-green-400 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
            }`}>
            {device.erpAccessBlocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {device.erpAccessBlocked ? 'Blocked' : 'ERP Allowed'}
          </button>
        </div>
      </div>

      {/* Score History Chart */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold text-white mb-4">Score History</h2>
        {scoreHistory.length > 1 ? (
          <div className="h-40">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Not enough data for chart</p>
          </div>
        )}
      </div>

      {/* Events Timeline */}
      <div className="rounded-xl border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold text-white">Security Events</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {recentEvents.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              No security events recorded
            </p>
          ) : recentEvents.map(e => (
            <div key={e.id} className={`flex items-start gap-4 px-5 py-4 transition-all ${
              e.acknowledged ? 'opacity-60' : 'hover:bg-white/3'
            }`}>
              <div className="mt-0.5"><SeverityBadge severity={e.severity as Severity} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs mb-1" style={{ color: 'var(--color-blue)' }}>
                  {e.eventType.replace(/_/g, ' ')}
                </div>
                {e.payload && Object.keys(e.payload).length > 0 && (
                  <pre className="text-[10px] font-mono rounded px-2 py-1.5 mt-1 overflow-x-auto"
                       style={{ background: 'var(--color-surface2)', color: 'var(--color-dim)' }}>
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                )}
                <div className="text-[11px] mt-1.5" style={{ color: 'var(--color-muted)' }}>
                  {formatDateTime(e.occurredAt)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {e.acknowledged ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-green-400">
                    <CheckCircle className="w-3 h-3" /> Ack'd
                  </span>
                ) : (
                  <button
                    onClick={() => ackMutation.mutate(e.id)}
                    className="text-[10px] font-mono px-2 py-1 rounded transition-all hover:bg-white/10"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
