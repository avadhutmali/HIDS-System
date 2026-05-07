import { useQuery } from '@tanstack/react-query';
import { Activity, GitBranch, AlertTriangle, Clock, Users } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';
import { formatDateTime } from '../utils/format';

const threatColors: Record<string, string> = {
  EVIL_TWIN: 'text-red-400 bg-red-500/10 border-red-500/30',
  APK_UNKNOWN_SOURCE: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  OTP_READER_APP: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  ERP_BRUTEFORCE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  FIM_CHANGE: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  PROCESS_ANOMALY: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  PORT_SCAN: 'text-green-400 bg-green-500/10 border-green-500/30',
  MALICIOUS_IP: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export function PatientZeroPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-zero'],
    queryFn: () => adminApi.getPatientZero().then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PageLoader />;

  const clusters = data?.clusters ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Patient Zero Tracker
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
          Threat origin correlation across campus devices
        </p>
      </div>

      {/* Explainer */}
      <div className="rounded-xl border p-4 flex items-start gap-3"
           style={{ background: 'var(--color-surface)', borderColor: 'rgba(0,212,255,0.2)' }}>
        <GitBranch className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--color-dim)' }}>
          When ≥3 devices report the same threat type within a 2-hour window, Aegis identifies the 
          first infected device (Patient Zero) and tracks lateral spread. Use this view to contain 
          outbreaks and quarantine source devices first.
        </p>
      </div>

      {clusters.length === 0 ? (
        <div className="rounded-xl border p-12 text-center"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(166,227,161,0.1)', border: '1px solid rgba(166,227,161,0.2)' }}>
            <Activity className="w-7 h-7 text-green-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Active Clusters</h3>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            No multi-device threat spread detected. Campus is secure.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clusters.map((cluster, i) => (
            <div key={i} className="rounded-xl border overflow-hidden"
                 style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              {/* Cluster Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b"
                   style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                    threatColors[cluster.threatPattern] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                  }`}>
                    {cluster.threatPattern.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold text-orange-400">{cluster.affectedCount}</span>
                    <span>affected</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(cluster.firstSeen)}
                  </div>
                </div>
              </div>

              {/* Patient Zero Device */}
              {cluster.patientZeroDevice && (
                <div className="px-5 py-4">
                  <div className="text-[10px] font-mono tracking-wider uppercase mb-3"
                       style={{ color: 'var(--color-muted)' }}>Patient Zero</div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg border"
                       style={{ background: 'rgba(249,114,135,0.05)', borderColor: 'rgba(249,114,135,0.2)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                         style={{ background: 'rgba(249,114,135,0.15)', color: '#f38ba8' }}>
                      0
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        {cluster.patientZeroDevice.deviceModel ?? cluster.patientZeroDevice.prn}
                      </div>
                      <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        PRN: {cluster.patientZeroDevice.prn} · {cluster.patientZeroDevice.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-mono px-2 py-0.5 rounded-full border mb-1 ${
                        cluster.patientZeroDevice.riskLevel === 'COMPROMISED'
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        {cluster.patientZeroDevice.riskLevel}
                      </div>
                      <div className="font-mono text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                        Score: {cluster.patientZeroDevice.currentScore}
                      </div>
                    </div>
                  </div>

                  {/* Spread visualization */}
                  <div className="mt-4">
                    <div className="text-[10px] font-mono tracking-wider uppercase mb-2"
                         style={{ color: 'var(--color-muted)' }}>Spread Timeline</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold font-mono"
                           style={{ background: 'rgba(249,114,135,0.15)', color: '#f38ba8', border: '1px solid rgba(249,114,135,0.4)' }}>
                        P0
                      </div>
                      <div className="flex-1 h-0.5 rounded" style={{ background: 'linear-gradient(to right, #f38ba8, #fab387)' }} />
                      {Array.from({ length: Math.min(cluster.affectedCount - 1, 8) }).map((_, j) => (
                        <div key={j} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                             style={{ background: `rgba(250,179,135,${0.3 - j * 0.03})`, color: '#fab387', border: '1px solid rgba(250,179,135,0.3)' }}>
                          {j + 1}
                        </div>
                      ))}
                      {cluster.affectedCount > 9 && (
                        <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
                          +{cluster.affectedCount - 9} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
