export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-400 border-green-500/40 bg-green-500/10' :
    score >= 40 ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
                  'text-red-400 border-red-500/40 bg-red-500/10 animate-pulse-glow';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded border ${color}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
          score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
          score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
      </span>
      {score}
    </span>
  );
}
