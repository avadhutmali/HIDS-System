import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { PatientZeroPage } from './pages/PatientZeroPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PolicyPage } from './pages/PolicyPage';
import { useAuthStore } from './store/authStore';
import { connectWebSocket } from './api/wsClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

// Protected layout: Sidebar + main content
function AppLayout() {
  const { isAuthenticated, token } = useAuthStore();

  // Re-connect WebSocket if already authenticated (e.g., page refresh)
  useEffect(() => {
    if (isAuthenticated && token) {
      connectWebSocket(token);
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <main className="flex-1 ml-56 p-7 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="devices/:id" element={<DeviceDetailPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="patient-zero" element={<PatientZeroPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="policy" element={<PolicyPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
