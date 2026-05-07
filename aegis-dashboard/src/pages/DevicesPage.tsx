import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Monitor, Smartphone, Search, Lock, Unlock, ChevronRight } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ScoreBadge } from '../components/ScoreBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDistanceToNow } from '../utils/format';

const riskColors = {
  CLEAN:       'text-green-400 bg-green-500/10 border-green-500/30',
  SUSPICIOUS:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  COMPROMISED: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export function DevicesPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['devices', riskFilter, typeFilter, page],
    queryFn: () => adminApi.getDevices({
      riskLevel: riskFilter || undefined,
      deviceType: typeFilter || undefined,
      page, size: 20,
    }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) =>
      adminApi.blockDevice(id, blocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });

  const filtered = data?.devices.filter(d =>
    !search || d.prn.toLowerCase().includes(search.toLowerCase()) ||
    d.deviceModel?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Device Health Board</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {data?.total ?? 0} enrolled devices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--color-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PRN or model…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>
        {[
          { label: 'All Risk', value: '', setter: setRiskFilter, options: [['', 'All Risk'], ['CLEAN', 'Clean'], ['SUSPICIOUS', 'Suspicious'], ['COMPROMISED', 'Compromised']] },
          { label: 'All Types', value: '', setter: setTypeFilter, options: [['', 'All Types'], ['ANDROID', 'Android'], ['PC', 'PC']] },
        ].map(({ label, options, setter }, i) => (
          <select key={i} onChange={e => setter(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
                  {['Device', 'PRN', 'Type', 'Score', 'Risk', 'ERP', 'Last Seen', ''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-mono tracking-wider uppercase"
                        style={{ color: 'var(--color-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: 'var(--color-surface2)' }}>
                          {d.deviceType === 'ANDROID'
                            ? <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                            : <Monitor className="w-3.5 h-3.5 text-green-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-white text-xs">{d.deviceModel ?? '—'}</div>
                          <div className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            {d.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: 'var(--color-blue)' }}>
                      {d.prn}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border"
                            style={{ color: 'var(--color-dim)', borderColor: 'var(--color-border)' }}>
                        {d.deviceType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><ScoreBadge score={d.currentScore} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${riskColors[d.riskLevel]}`}>
                        {d.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => blockMutation.mutate({ id: d.id, blocked: !d.erpAccessBlocked })}
                        title={d.erpAccessBlocked ? 'Unblock ERP' : 'Block ERP'}
                        className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded transition-all ${
                          d.erpAccessBlocked
                            ? 'text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                            : 'text-green-400 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                        }`}>
                        {d.erpAccessBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {d.erpAccessBlocked ? 'Blocked' : 'Allowed'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                      {formatDistanceToNow(d.lastSeen)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link to={`/devices/${d.id}`}
                            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
                            style={{ color: 'var(--color-accent)' }}>
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    No devices found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t"
               style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {page * 20 + 1}–{Math.min((page + 1) * 20, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-3 py-1 rounded text-xs disabled:opacity-30 transition-all hover:bg-white/5"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 20 >= data.total}
                      className="px-3 py-1 rounded text-xs disabled:opacity-30 transition-all hover:bg-white/5"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
