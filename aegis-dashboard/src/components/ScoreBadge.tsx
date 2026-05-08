export function ScoreBadge({ score }: { score: number }) {
  const isGood = score >= 70;
  const isWarn = score >= 40 && score < 70;
  const color = isGood ? '#059669' : isWarn ? '#d97706' : '#dc2626';
  const bg = isGood ? '#f0fdf4' : isWarn ? '#fffbeb' : '#fef2f2';
  const border = isGood ? '#bbf7d0' : isWarn ? '#fde68a' : '#fecaca';
  const dotColor = isGood ? '#22c55e' : isWarn ? '#f59e0b' : '#ef4444';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
      padding: '4px 12px', borderRadius: '8px',
      background: bg, color, border: `1px solid ${border}`,
    }}>
      <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: dotColor, opacity: 0.4,
          animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
        <span style={{
          position: 'relative', width: '6px', height: '6px',
          borderRadius: '50%', background: dotColor,
        }} />
      </span>
      {score}
    </span>
  );
}
