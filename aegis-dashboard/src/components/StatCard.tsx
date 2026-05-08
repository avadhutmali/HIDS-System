import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: 'cyan' | 'red' | 'yellow' | 'green' | 'purple' | 'blue';
  trend?: { value: number; label: string };
}

const accentStyles: Record<string, { iconBg: string; iconColor: string; borderColor: string }> = {
  cyan:   { iconBg: '#eef2ff', iconColor: '#4f46e5', borderColor: '#e0e7ff' },
  red:    { iconBg: '#fef2f2', iconColor: '#dc2626', borderColor: '#fecaca' },
  yellow: { iconBg: '#fffbeb', iconColor: '#d97706', borderColor: '#fde68a' },
  green:  { iconBg: '#f0fdf4', iconColor: '#059669', borderColor: '#bbf7d0' },
  purple: { iconBg: '#faf5ff', iconColor: '#7c3aed', borderColor: '#e9d5ff' },
  blue:   { iconBg: '#eff6ff', iconColor: '#2563eb', borderColor: '#bfdbfe' },
};

export function StatCard({ title, value, subtitle, icon, accent = 'cyan', trend }: StatCardProps) {
  const a = accentStyles[accent] ?? accentStyles.cyan;

  return (
    <div className="animate-fade-in" style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          padding: '10px', borderRadius: '12px',
          background: a.iconBg, color: a.iconColor,
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
            padding: '3px 10px', borderRadius: '999px',
            color: trend.value >= 0 ? '#dc2626' : '#059669',
            background: trend.value >= 0 ? '#fef2f2' : '#f0fdf4',
          }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
          </span>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '2px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
