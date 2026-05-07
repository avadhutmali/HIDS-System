import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Filter, CheckCheck, Download } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { SeverityBadge } from '../components/SeverityBadge';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/format';
import type { Severity } from '../types';

export function AlertsPage() {
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [acked, setAcked] = useState<'all' | 'unacked' | 'acked'>('all');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['threats', severity, eventType, acked, page],
    queryFn: () => adminApi.getThreats({
      severity: severity || undefined,
      eventType: eventType || undefined,
      acknowledged: acked === 'all' ? undefined : acked === 'acked',
      page, size: 25,
    }).then(r => r.data),
    refetchInterval: 15_000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: number) => adminApi.acknowledgeEvent(id, 'Acknowledged from alerts view'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threats'] }),
  });

  const handleExport = async () => {
    try {
      const res = await adminApi.exportReport('CSV');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'aegis-threats.csv'; a.click();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /> Alert Feed
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {data?.total ?? 0} total events
          </p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all hover:bg-white/5"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
        {[
          { label: 'All Severity', options: ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], onChange: setSeverity },
          { label: 'All Types', options: ['', 'EVIL_TWIN', 'APK_UNKNOWN_SOURCE', 'OTP_READER_APP', 'ERP_BRUTEFORCE', 'FIM_CHANGE', 'PROCESS_ANOMALY', 'PORT_SCAN', 'MALICIOUS_IP'], onChange: setEventType },
        ].map((s, i) => (
          <select key={i} onChange={e => s.onChange(e.target.value)} defaultValue=""
            className="px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            {s.options.map(o => <option key={o} value={o}>{o || s.label}</option>)}
          </select>
        ))}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          {[['all', 'All'], ['unacked', 'Unacked'], ['acked', 'Acked']].map(([v, l]) => (
            <button key={v} onClick={() => setAcked(v as 'all' | 'unacked' | 'acked')}
              className={`px-3 py-2 text-xs font-mono transition-colors ${acked === v ? 'text-white' : ''}`}
              style={{
                background: acked === v ? 'var(--color-accent)' : 'var(--color-surface)',
                color: acked === v ? 'var(--color-bg)' : 'var(--color-muted)',
              }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
                  {['Severity', 'Event Type', 'Device', 'Occurred', 'Received', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-mono tracking-wider uppercase"
                        style={{ color: 'var(--color-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {data?.events.map(e => (
                  <tr key={e.id} className={`transition-colors ${e.acknowledged ? 'opacity-50' : 'hover:bg-white/3'}`}>
                    <td className="px-4 py-3.5"><SeverityBadge severity={e.severity as Severity} /></td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: 'var(--color-blue)' }}>
                      {e.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                      {e.deviceId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
                      {formatDateTime(e.occurredAt)}
                    </td>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
                      {formatDateTime(e.receivedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        e.acknowledged
                          ? 'text-green-400 bg-green-500/10 border-green-500/30'
                          : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        {e.acknowledged ? 'Ack\'d' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {!e.acknowledged && (
                        <button onClick={() => ackMutation.mutate(e.id)}
                          className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-all hover:bg-green-500/20 text-green-400"
                          style={{ border: '1px solid rgba(166,227,161,0.3)' }}>
                          <CheckCheck className="w-3 h-3" /> Ack
                        </button>
                      )}
                    </td>
                  </tr>
                )) ?? null}
                {!data?.events.length && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    No events found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 25 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t"
               style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {page * 25 + 1}–{Math.min((page + 1) * 25, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-3 py-1.5 rounded text-xs disabled:opacity-30 transition-all hover:bg-white/5"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 25 >= data.total}
                      className="px-3 py-1.5 rounded text-xs disabled:opacity-30 transition-all hover:bg-white/5"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
