import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: 'cyan' | 'red' | 'yellow' | 'green' | 'purple' | 'blue';
  trend?: { value: number; label: string };
}

const accentMap = {
  cyan:   'border-cyan-500/40 bg-cyan-500/5',
  red:    'border-red-500/40 bg-red-500/5',
  yellow: 'border-yellow-500/40 bg-yellow-500/5',
  green:  'border-green-500/40 bg-green-500/5',
  purple: 'border-purple-500/40 bg-purple-500/5',
  blue:   'border-blue-500/40 bg-blue-500/5',
};

const iconAccentMap = {
  cyan:   'text-cyan-400 bg-cyan-500/10',
  red:    'text-red-400 bg-red-500/10',
  yellow: 'text-yellow-400 bg-yellow-500/10',
  green:  'text-green-400 bg-green-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
  blue:   'text-blue-400 bg-blue-500/10',
};

export function StatCard({ title, value, subtitle, icon, accent = 'cyan', trend }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 hover:scale-[1.01] animate-fade-in ${accentMap[accent]}`}
         style={{ background: 'var(--color-surface)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${iconAccentMap[accent]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
            trend.value >= 0 ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'
          }`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{title}</div>
      {subtitle && <div className="text-[11px] text-slate-500 mt-1 font-mono">{subtitle}</div>}
    </div>
  );
}
