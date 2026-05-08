import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Monitor, Smartphone, Search, Lock, Unlock, ChevronRight } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { ScoreBadge } from '../components/ScoreBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDistanceToNow } from '../utils/format';

const riskMap: Record<string, { bg: string; color: string; border: string }> = {
  CLEAN:       { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
  SUSPICIOUS:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  COMPROMISED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function DevicesPage() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['devices', riskFilter, typeFilter, page],
    queryFn: () => adminApi.getDevices({ riskLevel: riskFilter || undefined, deviceType: typeFilter || undefined, page, size: 20 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => adminApi.blockDevice(id, blocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  });

  const filtered = data?.devices.filter(d =>
    !search || d.prn.toLowerCase().includes(search.toLowerCase()) || d.deviceModel?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Device Health Board</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{data?.total ?? 0} enrolled devices</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PRN or model…"
            className="input-field" style={{ paddingLeft: '40px' }} />
        </div>
        <select onChange={e => setRiskFilter(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Risk</option><option value="CLEAN">Clean</option><option value="SUSPICIOUS">Suspicious</option><option value="COMPROMISED">Compromised</option>
        </select>
        <select onChange={e => setTypeFilter(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '130px' }}>
          <option value="">All Types</option><option value="ANDROID">Android</option><option value="PC">PC</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {isLoading ? <PageLoader /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Device', 'PRN', 'Type', 'Score', 'Risk', 'ERP', 'Last Seen', ''].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', flexShrink: 0 }}>
                          {d.deviceType === 'ANDROID' ? <Smartphone style={{ width: '16px', height: '16px', color: '#4f46e5' }} /> : <Monitor style={{ width: '16px', height: '16px', color: '#059669' }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{d.deviceModel ?? '—'}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{d.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>{d.prn}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>{d.deviceType}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}><ScoreBadge score={d.currentScore} /></td>
                    <td style={{ padding: '14px 20px' }}>
                      {(() => { const r = riskMap[d.riskLevel] ?? riskMap.CLEAN; return (
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>{d.riskLevel}</span>
                      ); })()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button onClick={() => blockMutation.mutate({ id: d.id, blocked: !d.erpAccessBlocked })} title={d.erpAccessBlocked ? 'Unblock ERP' : 'Block ERP'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                          padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                          ...(d.erpAccessBlocked
                            ? { color: '#dc2626', background: '#fef2f2' }
                            : { color: '#059669', background: '#f0fdf4' }),
                        }}>
                        {d.erpAccessBlocked ? <Lock style={{ width: '12px', height: '12px' }} /> : <Unlock style={{ width: '12px', height: '12px' }} />}
                        {d.erpAccessBlocked ? 'Blocked' : 'Allowed'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: '#94a3b8' }}>{formatDistanceToNow(d.lastSeen)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link to={`/devices/${d.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
                        Detail <ChevronRight style={{ width: '14px', height: '14px' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No devices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 20 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{page * 20 + 1}–{Math.min((page + 1) * 20, data.total)} of {data.total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary" style={{ opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 20 >= data.total} className="btn-secondary" style={{ opacity: (page + 1) * 20 >= data.total ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
