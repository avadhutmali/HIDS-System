import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { useAuthStore } from '../store/authStore';
import { connectWebSocket } from '../api/wsClient';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.login(username, password);
      const { token, role } = res.data;
      login(token, role, username);
      connectWebSocket(token);
      navigate('/');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'var(--color-bg)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, var(--color-purple) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Aegis HIDS</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Admin Dashboard · WCE Sangli
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 border"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold mb-1.5 tracking-wider uppercase"
                     style={{ color: 'var(--color-muted)' }}>Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold mb-1.5 tracking-wider uppercase"
                     style={{ color: 'var(--color-muted)' }}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--color-muted)' }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 animate-fade-in">
                {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-98 disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: '#080c10' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-4 text-[11px] font-mono" style={{ color: 'var(--color-muted)' }}>
            Default: admin / admin123
          </p>
        </div>

        <p className="text-center mt-6 text-[11px] font-mono" style={{ color: 'var(--color-muted)' }}>
          Aegis HIDS v1.0 · Walchand College of Engineering, Sangli
        </p>
      </div>
    </div>
  );
}
