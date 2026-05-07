export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className={`${sz} border-2 border-current border-t-transparent rounded-full animate-spin`}
         style={{ color: 'var(--color-accent)' }} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>Loading…</p>
      </div>
    </div>
  );
}
