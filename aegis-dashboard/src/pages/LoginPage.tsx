import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '0 20px' }}>
        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            marginBottom: '20px',
          }}>
            <ShieldCheck style={{ width: '28px', height: '28px', color: '#ffffff' }} />
          </div>
          <h1 style={{
            fontSize: '26px', fontWeight: 700, color: '#0f172a',
            letterSpacing: '-0.03em', marginBottom: '6px',
          }}>Aegis HIDS</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Secure Admin Dashboard
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px 32px 32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#334155', marginBottom: '8px',
              }}>Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#334155', marginBottom: '8px',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingRight: '42px' }}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                    padding: '2px', display: 'flex', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {showPass ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="animate-fade-in" style={{
                fontSize: '13px', color: '#dc2626',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? (
                <div style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
              ) : (
                <LogIn style={{ width: '18px', height: '18px' }} />
              )}
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div style={{
            textAlign: 'center', marginTop: '20px', paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Default: <span style={{ color: '#64748b', fontWeight: 500 }}>admin</span> / <span style={{ color: '#64748b', fontWeight: 500 }}>admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '28px',
          fontSize: '12px', color: '#94a3b8',
        }}>
          Aegis HIDS v1.0 · Walchand College of Engineering, Sangli
        </p>
      </div>
    </div>
  );
}
