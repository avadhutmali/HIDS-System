import { create } from 'zustand';
import type { WsAlertMessage } from '../types';

interface AlertState {
  alerts: WsAlertMessage[];
  connected: boolean;
  unreadCount: number;
  addAlert: (alert: WsAlertMessage) => void;
  clearAlerts: () => void;
  markAllRead: () => void;
  setConnected: (connected: boolean) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  connected: false,
  unreadCount: 0,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 200), // keep last 200
      unreadCount: state.unreadCount + 1,
    })),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
  markAllRead: () => set({ unreadCount: 0 }),
  setConnected: (connected) => set({ connected }),
}));
