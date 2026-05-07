import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Plus, Trash2, Wifi, Package, Shield } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';

export function PolicyPage() {
  const qc = useQueryClient();

  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy'],
    queryFn: () => adminApi.getPolicy().then(r => r.data),
  });

  const [erpMinScore, setErpMinScore] = useState(60);
  const [bssids, setBssids] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newBssid, setNewBssid] = useState('');
  const [newPkg, setNewPkg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (policy) {
      setErpMinScore(policy.erpMinScore ?? 60);
      setBssids(policy.knownBssids ?? []);
      setWhitelist(policy.appWhitelist ?? []);
    }
  }, [policy]);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updatePolicy({
      erpMinScore,
      knownBssids: bssids,
      appWhitelist: whitelist,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policy'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const addBssid = () => {
    const v = newBssid.trim();
    if (v && !bssids.includes(v)) { setBssids(b => [...b, v]); setNewBssid(''); }
  };

  const addPkg = () => {
    const v = newPkg.trim();
    if (v && !whitelist.includes(v)) { setWhitelist(w => [...w, v]); setNewPkg(''); }
  };

  if (isLoading) return <PageLoader />;

  const scoreColor = erpMinScore >= 70 ? '#a6e3a1' : erpMinScore >= 50 ? '#f9e2af' : '#f38ba8';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Policy Manager
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
          Configure campus-wide security thresholds and access controls
        </p>
      </div>

      {/* ERP Access Threshold */}
      <div className="rounded-xl border p-6"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-sm font-semibold text-white">ERP Access Threshold</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
          Devices with a security score below this value will be automatically blocked from accessing the ERP system.
        </p>
        <div className="flex items-center gap-5">
          <input
            type="range" min={0} max={100} value={erpMinScore}
            onChange={e => setErpMinScore(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer outline-none"
            style={{ accentColor: scoreColor }}
          />
          <div className="w-16 text-center">
            <div className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>
              {erpMinScore}
            </div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>MIN SCORE</div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
          <span>0 — All blocked</span>
          <span>50 — Balanced</span>
          <span>100 — None blocked</span>
        </div>
      </div>

      {/* Known BSSIDs */}
      <div className="rounded-xl border p-6"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-sm font-semibold text-white">Trusted Wi-Fi BSSIDs</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          Agents will alert when connected to an AP not in this list (Evil Twin detection).
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={newBssid}
            onChange={e => setNewBssid(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBssid()}
            placeholder="aa:bb:cc:dd:ee:ff"
            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          <button onClick={addBssid}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all hover:brightness-110"
            style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--color-accent)' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-2">
          {bssids.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>No trusted BSSIDs configured</p>
          ) : bssids.map(b => (
            <div key={b} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                 style={{ background: 'var(--color-surface2)' }}>
              <span className="font-mono text-sm" style={{ color: 'var(--color-teal)' }}>{b}</span>
              <button onClick={() => setBssids(bs => bs.filter(x => x !== b))}
                className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* App Whitelist */}
      <div className="rounded-xl border p-6"
           style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-sm font-semibold text-white">App Whitelist (Android)</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          APK packages not in this list will trigger an alert if installed from unknown sources.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={newPkg}
            onChange={e => setNewPkg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPkg()}
            placeholder="com.example.app"
            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          <button onClick={addPkg}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all hover:brightness-110"
            style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--color-accent)' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {whitelist.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>No apps whitelisted</p>
          ) : whitelist.map(pkg => (
            <div key={pkg} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                 style={{ background: 'var(--color-surface2)' }}>
              <span className="font-mono text-xs" style={{ color: 'var(--color-blue)' }}>{pkg}</span>
              <button onClick={() => setWhitelist(w => w.filter(x => x !== pkg))}
                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 ml-3">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          id="save-policy-btn"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
          {updateMutation.isPending
            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          Save Policy
        </button>
        {saved && (
          <span className="text-sm text-green-400 animate-fade-in flex items-center gap-1.5">
            ✓ Policy saved and pushed to agents
          </span>
        )}
        {updateMutation.isError && (
          <span className="text-sm text-red-400 animate-fade-in">Failed to save policy</span>
        )}
      </div>
    </div>
  );
}
