import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, PointElement, LineElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Filler, Tooltip, Legend
);

const CHART_COLORS = {
  cyan: 'rgba(0,212,255,0.8)',
  red: 'rgba(243,139,168,0.8)',
  yellow: 'rgba(249,226,175,0.8)',
  orange: 'rgba(250,179,135,0.8)',
  blue: 'rgba(137,180,250,0.8)',
  green: 'rgba(166,227,161,0.8)',
  purple: 'rgba(203,166,247,0.8)',
  teal: 'rgba(148,226,213,0.8)',
};

const CHART_COLORS_LIST = Object.values(CHART_COLORS);

export function AnalyticsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => adminApi.getAnalyticsSummary().then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading || !summary) return <PageLoader />;

  const sd = summary.scoreDistribution;
  const total = (sd.clean ?? 0) + (sd.suspicious ?? 0) + (sd.compromised ?? 0);

  // Doughnut: Risk distribution
  const riskDoughnut = {
    labels: ['Clean', 'Suspicious', 'Compromised'],
    datasets: [{
      data: [sd.clean ?? 0, sd.suspicious ?? 0, sd.compromised ?? 0],
      backgroundColor: [
        'rgba(166,227,161,0.8)',
        'rgba(249,226,175,0.8)',
        'rgba(243,139,168,0.8)',
      ],
      borderColor: ['#a6e3a1', '#f9e2af', '#f38ba8'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  // Bar: Top threat types
  const topThreats = summary.topThreatTypes ?? [];
  const threatBar = {
    labels: topThreats.map(t => t.type.replace(/_/g, ' ')),
    datasets: [{
      label: 'Occurrences',
      data: topThreats.map(t => t.count),
      backgroundColor: topThreats.map((_, i) => CHART_COLORS_LIST[i % CHART_COLORS_LIST.length]),
      borderColor: topThreats.map((_, i) => CHART_COLORS_LIST[i % CHART_COLORS_LIST.length].replace('0.8', '1')),
      borderWidth: 1,
      borderRadius: 5,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#89939e', font: { size: 11 }, padding: 16, boxWidth: 12 },
      },
      tooltip: { backgroundColor: '#141c24', borderColor: '#1e2d3d', borderWidth: 1 },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#545f70', font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#545f70', font: { size: 10 }, maxRotation: 30 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#141c24', borderColor: '#1e2d3d', borderWidth: 1 },
    },
  };

  const metrics = [
    {
      label: 'Total Devices',
      value: total,
      sub: `${sd.clean ?? 0} clean`,
      icon: <Shield className="w-5 h-5" />,
      accent: 'text-cyan-400 bg-cyan-500/10',
    },
    {
      label: 'Alerts Today',
      value: summary.alertsToday,
      sub: 'All severities',
      icon: <AlertTriangle className="w-5 h-5" />,
      accent: 'text-yellow-400 bg-yellow-500/10',
    },
    {
      label: 'Critical Unacked',
      value: summary.criticalActive,
      sub: 'Needs attention',
      icon: <TrendingUp className="w-5 h-5" />,
      accent: 'text-red-400 bg-red-500/10',
    },
    {
      label: 'Devices Online',
      value: summary.devicesOnline,
      sub: 'Last 5 minutes',
      icon: <BarChart2 className="w-5 h-5" />,
      accent: 'text-green-400 bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
          Security posture and threat trends
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl border p-4 animate-fade-in"
               style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className={`inline-flex p-2.5 rounded-lg mb-3 ${m.accent}`}>{m.icon}</div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-dim)' }}>{m.label}</div>
            <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--color-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Distribution Doughnut */}
        <div className="rounded-xl border p-5"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Risk Distribution</h2>
          <div className="h-64">
            {total > 0
              ? <Doughnut data={riskDoughnut} options={doughnutOptions} />
              : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No device data</p>
                </div>
              )}
          </div>
          {total > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Clean', val: sd.clean ?? 0, color: 'text-green-400', pct: total },
                { label: 'Suspicious', val: sd.suspicious ?? 0, color: 'text-yellow-400', pct: total },
                { label: 'Compromised', val: sd.compromised ?? 0, color: 'text-red-400', pct: total },
              ].map(({ label, val, color, pct }) => (
                <div key={label} className="text-center p-2 rounded-lg"
                     style={{ background: 'var(--color-surface2)' }}>
                  <div className={`text-lg font-bold ${color}`}>{val}</div>
                  <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{label}</div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--color-border2)' }}>
                    {pct > 0 ? Math.round((val / pct) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Threat Types Bar */}
        <div className="rounded-xl border p-5"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold text-white mb-5">Top Threat Types (Today)</h2>
          <div className="h-64">
            {topThreats.length > 0
              ? <Bar data={threatBar} options={barOptions} />
              : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No threat data for today</p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Top Threats Table */}
      {topThreats.length > 0 && (
        <div className="rounded-xl border overflow-hidden"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold text-white">Threat Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
                <th className="px-5 py-3 text-left text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>#</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>Threat Type</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>Count</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>Share</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {topThreats.map((t, i) => {
                const totalThreats = topThreats.reduce((s, tt) => s + Number(tt.count), 0);
                const pct = totalThreats > 0 ? Math.round((Number(t.count) / totalThreats) * 100) : 0;
                return (
                  <tr key={t.type} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
                      {i + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs" style={{ color: CHART_COLORS_LIST[i % CHART_COLORS_LIST.length].replace('0.8)', '1)') }}>
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-white">
                      {t.count}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                          <div className="h-1.5 rounded-full transition-all duration-500"
                               style={{ width: `${pct}%`, background: CHART_COLORS_LIST[i % CHART_COLORS_LIST.length].replace('0.8)', '1)') }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
