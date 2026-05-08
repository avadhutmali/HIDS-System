import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Tooltip, Legend);

const COLORS = ['rgba(79,70,229,0.8)','rgba(220,38,38,0.8)','rgba(217,119,6,0.8)','rgba(234,88,12,0.8)','rgba(37,99,235,0.8)','rgba(22,163,74,0.8)','rgba(124,58,237,0.8)','rgba(13,148,136,0.8)'];
const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function AnalyticsPage() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['analytics-summary'], queryFn: () => adminApi.getAnalyticsSummary().then(r => r.data), refetchInterval: 60_000 });
  if (isLoading || !summary) return <PageLoader />;

  const sd = summary.scoreDistribution;
  const total = (sd.clean??0) + (sd.suspicious??0) + (sd.compromised??0);

  const riskDoughnut = {
    labels: ['Clean','Suspicious','Compromised'],
    datasets: [{ data: [sd.clean??0,sd.suspicious??0,sd.compromised??0], backgroundColor: ['rgba(22,163,74,0.75)','rgba(245,158,11,0.75)','rgba(239,68,68,0.75)'], borderColor: ['#059669','#d97706','#dc2626'], borderWidth: 2, hoverOffset: 6 }],
  };
  const topThreats = summary.topThreatTypes ?? [];
  const threatBar = {
    labels: topThreats.map(t => t.type.replace(/_/g,' ')),
    datasets: [{ label: 'Occurrences', data: topThreats.map(t => t.count), backgroundColor: topThreats.map((_,i) => COLORS[i%COLORS.length]), borderColor: topThreats.map((_,i) => COLORS[i%COLORS.length].replace('0.8','1')), borderWidth: 1, borderRadius: 6 }],
  };
  const dOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { color: '#475569', font: { size: 11 }, padding: 16, boxWidth: 12 } }, tooltip: { backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } } };
  const bOpts = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 30 } } }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } } };

  const metrics = [
    { label: 'Total Devices', value: total, sub: `${sd.clean??0} clean`, icon: <Shield style={{ width: '20px', height: '20px' }} />, iconBg: '#eef2ff', iconColor: '#4f46e5' },
    { label: 'Alerts Today', value: summary.alertsToday, sub: 'All severities', icon: <AlertTriangle style={{ width: '20px', height: '20px' }} />, iconBg: '#fffbeb', iconColor: '#d97706' },
    { label: 'Critical Unacked', value: summary.criticalActive, sub: 'Needs attention', icon: <TrendingUp style={{ width: '20px', height: '20px' }} />, iconBg: '#fef2f2', iconColor: '#dc2626' },
    { label: 'Devices Online', value: summary.devicesOnline, sub: 'Last 5 minutes', icon: <BarChart2 style={{ width: '20px', height: '20px' }} />, iconBg: '#f0fdf4', iconColor: '#059669' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
          <BarChart2 style={{ width: '22px', height: '22px', color: '#4f46e5' }} /> Analytics
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>Security posture and threat trends</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {metrics.map(m => (
          <div key={m.label} className="animate-fade-in" style={{ ...card, padding: '22px' }}>
            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '12px', background: m.iconBg, color: m.iconColor, marginBottom: '14px' }}>{m.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{m.value}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{m.label}</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginTop: '4px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ ...card, padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>Risk Distribution</h2>
          <div style={{ height: '260px' }}>{total > 0 ? <Doughnut data={riskDoughnut} options={dOpts} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: '13px', color: '#94a3b8' }}>No device data</p></div>}</div>
          {total > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '20px' }}>
              {[{ l: 'Clean', v: sd.clean??0, c: '#059669' },{ l: 'Suspicious', v: sd.suspicious??0, c: '#d97706' },{ l: 'Compromised', v: sd.compromised??0, c: '#dc2626' }].map(({l,v,c}) => (
                <div key={l} style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{l}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{total > 0 ? Math.round((v/total)*100) : 0}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...card, padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>Top Threat Types (Today)</h2>
          <div style={{ height: '260px' }}>{topThreats.length > 0 ? <Bar data={threatBar} options={bOpts} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: '13px', color: '#94a3b8' }}>No threat data for today</p></div>}</div>
        </div>
      </div>

      {topThreats.length > 0 && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Threat Breakdown</h2>
          </div>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['#','Threat Type','Count','Share'].map(h => (
                  <th key={h} style={{ padding: '14px 22px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topThreats.map((t,i) => {
                const tot = topThreats.reduce((s,tt) => s+Number(tt.count),0);
                const pct = tot > 0 ? Math.round((Number(t.count)/tot)*100) : 0;
                return (
                  <tr key={t.type} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 22px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#94a3b8' }}>{i+1}</td>
                    <td style={{ padding: '14px 22px' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: COLORS[i%COLORS.length].replace('0.8)','1)') }}>{t.type.replace(/_/g,' ')}</span></td>
                    <td style={{ padding: '14px 22px', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{t.count}</td>
                    <td style={{ padding: '14px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#f1f5f9' }}>
                          <div style={{ height: '6px', borderRadius: '999px', transition: 'width 0.5s ease', width: `${pct}%`, background: COLORS[i%COLORS.length].replace('0.8)','1)') }} />
                        </div>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#64748b', minWidth: '36px' }}>{pct}%</span>
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
