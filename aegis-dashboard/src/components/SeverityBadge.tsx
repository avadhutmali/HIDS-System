import type { Severity } from '../types';

const cfg: Record<Severity, { label: string; className: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'bg-red-500/15 text-red-400 border border-red-500/30 font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full animate-pulse-glow' },
  HIGH:     { label: 'HIGH',     className: 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full' },
  MEDIUM:   { label: 'MEDIUM',  className: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full' },
  LOW:      { label: 'LOW',     className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full' },
  INFO:     { label: 'INFO',    className: 'bg-slate-500/15 text-slate-400 border border-slate-500/30 font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = cfg[severity] ?? cfg.INFO;
  return <span className={className}>{label}</span>;
}
