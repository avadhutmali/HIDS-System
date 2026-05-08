import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Filter, CheckCheck, Download } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { SeverityBadge } from '../components/SeverityBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/format';
import type { Severity } from '../types';

const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function AlertsPage() {
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [acked, setAcked] = useState<'all' | 'unacked' | 'acked'>('all');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['threats', severity, eventType, acked, page],
    queryFn: () => adminApi.getThreats({ severity: severity || undefined, eventType: eventType || undefined, acknowledged: acked === 'all' ? undefined : acked === 'acked', page, size: 25 }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: number) => adminApi.acknowledgeEvent(id, 'Acknowledged from alerts view'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threats'] }),
  });

  const handleExport = async () => {
    try { const res = await adminApi.exportReport('CSV'); const url = window.URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = url; a.download = 'aegis-threats.csv'; a.click(); } catch { /* silent */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
            <Bell style={{ width: '22px', height: '22px', color: '#4f46e5' }} /> Alert Feed
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{data?.total ?? 0} total events</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download style={{ width: '14px', height: '14px' }} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <Filter style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
        <select onChange={e => setSeverity(e.target.value)} defaultValue="" className="input-field" style={{ width: 'auto', minWidth: '140px', padding: '8px 30px 8px 12px' }}>
          <option value="">All Severity</option>{['CRITICAL','HIGH','MEDIUM','LOW','INFO'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select onChange={e => setEventType(e.target.value)} defaultValue="" className="input-field" style={{ width: 'auto', minWidth: '160px', padding: '8px 30px 8px 12px' }}>
          <option value="">All Types</option>{['EVIL_TWIN','APK_UNKNOWN_SOURCE','OTP_READER_APP','ERP_BRUTEFORCE','FIM_CHANGE','PROCESS_ANOMALY','PORT_SCAN','MALICIOUS_IP'].map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
        </select>
        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
          {[['all','All'],['unacked','Unacked'],['acked','Acked']].map(([v,l]) => (
            <button key={v} onClick={() => setAcked(v as 'all'|'unacked'|'acked')} style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: acked === v ? '#4f46e5' : '#ffffff', color: acked === v ? '#ffffff' : '#64748b',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        {isLoading ? <PageLoader /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Severity','Event Type','Device','Occurred','Received','Status',''].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.events.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: e.acknowledged ? 0.5 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 20px' }}><SeverityBadge severity={e.severity as Severity} /></td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>{e.eventType.replace(/_/g,' ')}</td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#475569' }}>{e.deviceId.slice(0,8)}…</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDateTime(e.occurredAt)}</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDateTime(e.receivedAt)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', border: '1px solid',
                        ...(e.acknowledged ? { color: '#059669', background: '#f0fdf4', borderColor: '#bbf7d0' } : { color: '#d97706', background: '#fffbeb', borderColor: '#fde68a' })
                      }}>{e.acknowledged ? "Ack'd" : 'Open'}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {!e.acknowledged && (
                        <button onClick={() => ackMutation.mutate(e.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                          padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', border: 'none',
                          color: '#059669', background: '#f0fdf4', transition: 'background 0.15s',
                        }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = '#dcfce7')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = '#f0fdf4')}>
                          <CheckCheck style={{ width: '12px', height: '12px' }} /> Ack
                        </button>
                      )}
                    </td>
                  </tr>
                )) ?? null}
                {!data?.events.length && (
                  <tr><td colSpan={7} style={{ padding: '50px 20px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>No events found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > 25 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{page*25+1}–{Math.min((page+1)*25,data.total)} of {data.total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page === 0} className="btn-secondary" style={{ opacity: page===0?0.4:1 }}>← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={(page+1)*25 >= data.total} className="btn-secondary" style={{ opacity: (page+1)*25>=data.total?0.4:1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
