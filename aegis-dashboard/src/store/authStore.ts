import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      username: null,
      isAuthenticated: false,
      login: (token, role, username) =>
        set({ token, role, username, isAuthenticated: true }),
      logout: () =>
        set({ token: null, role: null, username: null, isAuthenticated: false }),
    }),
    { name: 'aegis-auth' }
  )
);
