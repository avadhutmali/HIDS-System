import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Plus, Trash2, Wifi, Package, Shield } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { PageLoader } from '../components/LoadingSpinner';

const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)' };

export function PolicyPage() {
  const qc = useQueryClient();
  const { data: policy, isLoading } = useQuery({ queryKey: ['policy'], queryFn: () => adminApi.getPolicy().then(r => r.data) });

  const [erpMinScore, setErpMinScore] = useState(60);
  const [bssids, setBssids] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newBssid, setNewBssid] = useState('');
  const [newPkg, setNewPkg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (policy) { setErpMinScore(policy.erpMinScore ?? 60); setBssids(policy.knownBssids ?? []); setWhitelist(policy.appWhitelist ?? []); } }, [policy]);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updatePolicy({ erpMinScore, knownBssids: bssids, appWhitelist: whitelist }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['policy'] }); setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const addBssid = () => { const v = newBssid.trim(); if (v && !bssids.includes(v)) { setBssids(b => [...b, v]); setNewBssid(''); } };
  const addPkg = () => { const v = newPkg.trim(); if (v && !whitelist.includes(v)) { setWhitelist(w => [...w, v]); setNewPkg(''); } };

  if (isLoading) return <PageLoader />;

  const scoreColor = erpMinScore >= 70 ? '#059669' : erpMinScore >= 50 ? '#d97706' : '#dc2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.02em' }}>
          <Settings style={{ width: '22px', height: '22px', color: '#4f46e5' }} /> Policy Manager
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>Configure campus-wide security thresholds and access controls</p>
      </div>

      {/* ERP Threshold */}
      <div style={{ ...card, padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5' }}><Shield style={{ width: '16px', height: '16px' }} /></div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>ERP Access Threshold</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 }}>
          Devices with a security score below this value will be automatically blocked from accessing the ERP system.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <input type="range" min={0} max={100} value={erpMinScore} onChange={e => setErpMinScore(Number(e.target.value))}
            style={{ flex: 1, height: '6px', borderRadius: '999px', appearance: 'none', cursor: 'pointer', outline: 'none', accentColor: scoreColor }} />
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: scoreColor, letterSpacing: '-0.02em' }}>{erpMinScore}</div>
            <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8' }}>MIN SCORE</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
          <span>0 — All blocked</span><span>50 — Balanced</span><span>100 — None blocked</span>
        </div>
      </div>

      {/* BSSIDs */}
      <div style={{ ...card, padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5' }}><Wifi style={{ width: '16px', height: '16px' }} /></div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Trusted Wi-Fi BSSIDs</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.6 }}>
          Agents will alert when connected to an AP not in this list (Evil Twin detection).
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input value={newBssid} onChange={e => setNewBssid(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBssid()}
            placeholder="aa:bb:cc:dd:ee:ff" className="input-field" style={{ fontFamily: 'var(--font-mono)' }} />
          <button onClick={addBssid} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Add
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {bssids.length === 0 ? (
            <p style={{ fontSize: '12px', textAlign: 'center', padding: '20px', color: '#cbd5e1' }}>No trusted BSSIDs configured</p>
          ) : bssids.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#0d9488', fontWeight: 500 }}>{b}</span>
              <button onClick={() => setBssids(bs => bs.filter(x => x !== b))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', transition: 'color 0.15s', padding: '4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Whitelist */}
      <div style={{ ...card, padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: '#eef2ff', color: '#4f46e5' }}><Package style={{ width: '16px', height: '16px' }} /></div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>App Whitelist (Android)</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.6 }}>
          APK packages not in this list will trigger an alert if installed from unknown sources.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input value={newPkg} onChange={e => setNewPkg(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPkg()}
            placeholder="com.example.app" className="input-field" style={{ fontFamily: 'var(--font-mono)' }} />
          <button onClick={addPkg} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Add
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
          {whitelist.length === 0 ? (
            <p style={{ fontSize: '12px', textAlign: 'center', padding: '20px', color: '#cbd5e1' }}>No apps whitelisted</p>
          ) : whitelist.map(pkg => (
            <div key={pkg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: '#f8fafc' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#4f46e5', fontWeight: 500 }}>{pkg}</span>
              <button onClick={() => setWhitelist(w => w.filter(x => x !== pkg))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', transition: 'color 0.15s', padding: '4px', flexShrink: 0, marginLeft: '12px' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button id="save-policy-btn" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
          {updateMutation.isPending
            ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            : <Save style={{ width: '18px', height: '18px' }} />}
          Save Policy
        </button>
        {saved && <span className="animate-fade-in" style={{ fontSize: '13px', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>✓ Policy saved and pushed to agents</span>}
        {updateMutation.isError && <span className="animate-fade-in" style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>Failed to save policy</span>}
      </div>
    </div>
  );
}
