export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 40 : 24;
  return (
    <div style={{
      width: `${s}px`, height: `${s}px`,
      border: '2.5px solid #e2e8f0',
      borderTopColor: '#4f46e5',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '300px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <LoadingSpinner size="lg" />
        <p style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Loading…</p>
      </div>
    </div>
  );
}
