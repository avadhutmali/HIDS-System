import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Bell, Activity, BarChart2,
  Shield, Settings, LogOut, Wifi
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
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col z-30"
           style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--color-accent)' }}>
              Aegis
            </div>
            <div className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--color-muted)' }}>
              HIDS · Admin
            </div>
          </div>
        </div>

        {/* WS Status */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <Wifi className="w-3 h-3" style={{ color: connected ? '#a6e3a1' : 'var(--color-muted)' }} />
          <span className="font-mono text-[9px]" style={{ color: connected ? '#a6e3a1' : 'var(--color-muted)' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="font-mono text-[9px] tracking-widest uppercase px-2"
                style={{ color: 'var(--color-muted)' }}>Navigation</span>
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => { if (label === 'Alerts') markAllRead(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all duration-150 group ${
                isActive
                  ? 'text-white'
                  : 'hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive
              ? { background: 'rgba(0,212,255,0.10)', color: 'var(--color-accent)', borderLeft: '2px solid var(--color-accent)' }
              : { color: 'var(--color-dim)' }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Alerts' && unreadCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold"
               style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--color-accent)' }}>
            {username?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{username ?? 'Admin'}</div>
            <div className="font-mono text-[9px]" style={{ color: 'var(--color-muted)' }}>ADMINISTRATOR</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all hover:bg-red-500/10 hover:text-red-400 group"
          style={{ color: 'var(--color-muted)' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
