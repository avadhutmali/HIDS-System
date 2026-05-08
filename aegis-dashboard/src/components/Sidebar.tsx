import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Bell, Activity, BarChart2,
  Settings, LogOut, Wifi, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { disconnectWebSocket } from '../api/wsClient';

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview'     },
  { to: '/devices',     icon: Cpu,             label: 'Devices'      },
  { to: '/alerts',      icon: Bell,            label: 'Alerts'       },
  { to: '/patient-zero',icon: Activity,        label: 'Patient Zero' },
  { to: '/analytics',   icon: BarChart2,       label: 'Analytics'    },
  { to: '/policy',      icon: Settings,        label: 'Policy'       },
];

export function Sidebar() {
  const { username, logout } = useAuthStore();
  const { connected, unreadCount, markAllRead } = useAlertStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectWebSocket();
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh', width: '240px',
      display: 'flex', flexDirection: 'column', zIndex: 30,
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}>
            <ShieldCheck style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Aegis
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              HIDS ADMIN
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginTop: '14px', padding: '6px 10px', borderRadius: '8px',
          background: connected ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${connected ? '#bbf7d0' : '#e2e8f0'}`,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: connected ? '#22c55e' : '#cbd5e1',
            boxShadow: connected ? '0 0 6px rgba(34,197,94,0.4)' : 'none',
          }} />
          <Wifi style={{ width: '12px', height: '12px', color: connected ? '#16a34a' : '#94a3b8' }} />
          <span style={{
            fontSize: '10px', fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: connected ? '#16a34a' : '#94a3b8',
          }}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px', marginBottom: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#94a3b8',
          }}>Menu</span>
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => { if (label === 'Alerts') markAllRead(); }}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              margin: '2px 10px', padding: '10px 14px', borderRadius: '10px',
              fontSize: '14px', textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#4f46e5' : '#475569',
              background: isActive ? '#eef2ff' : 'transparent',
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.background = '#f8fafc';
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.background = 'transparent';
              }
            }}
          >
            <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {label === 'Alerts' && unreadCount > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                background: '#ef4444', color: '#fff',
                borderRadius: '999px', padding: '2px 7px', minWidth: '20px', textAlign: 'center',
                boxShadow: '0 1px 4px rgba(239,68,68,0.3)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
            color: '#4f46e5', background: '#eef2ff',
          }}>
            {username?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{username ?? 'Admin'}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '8px 12px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 500, color: '#64748b',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
