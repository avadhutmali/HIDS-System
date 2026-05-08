import type { Severity } from '../types';

const cfg: Record<Severity, { label: string; bg: string; color: string; border: string }> = {
  CRITICAL: { label: 'CRITICAL', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  HIGH:     { label: 'HIGH',     bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  MEDIUM:   { label: 'MEDIUM',   bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  LOW:      { label: 'LOW',      bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  INFO:     { label: 'INFO',     bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const c = cfg[severity] ?? cfg.INFO;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: '999px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {severity === 'CRITICAL' && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 4px rgba(239,68,68,0.5)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
      )}
      {c.label}
    </span>
  );
}
