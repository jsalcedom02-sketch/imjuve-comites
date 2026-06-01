import { create } from 'zustand';
import * as authApi from '../api/auth';
import { normalizeEstado } from '../data/municipios';

interface AuthStore {
  isAuthenticated: boolean;
  loggingOut: boolean;
  userId: string | null;
  username: string | null;
  fullName: string;
  role: string | null;
  assignedStates: string[];
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  startLogout: () => void;
  checkSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  isAuthenticated: false,
  loggingOut: false,
  userId: null,
  username: null,
  fullName: '',
  role: null,
  assignedStates: [],

  login: async (user, pass) => {
    try {
      const data = await authApi.login(user, pass);
      set({
        isAuthenticated: true, loggingOut: false,
        userId: data.user.id, username: data.user.username,
        fullName: data.user.fullName || '',
        role: data.user.role, assignedStates: (data.user.assignedStates || []).map(normalizeEstado),
      });
      const { useComiteStore } = await import('./comiteStore');
      useComiteStore.getState().setActiveTab('registro');
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    authApi.logout();
    set({
      isAuthenticated: false, loggingOut: false,
      userId: null, username: null, fullName: '', role: null, assignedStates: [],
    });
  },

  startLogout: () => {
    set({ loggingOut: true });
    setTimeout(() => {
      const state = useAuthStore.getState();
      state.logout();
    }, 300);
  },

  checkSession: async () => {
    const token = localStorage.getItem('comites-auth-token');
    if (!token) return;
    try {
      const data = await authApi.checkAuth();
      set({
        isAuthenticated: true,
        userId: data.user.id, username: data.user.username,
        fullName: data.user.fullName || '',
        role: data.user.role, assignedStates: (data.user.assignedStates || []).map(normalizeEstado),
      });
    } catch {
      authApi.logout();
      set({ isAuthenticated: false, userId: null, username: null, fullName: '', role: null, assignedStates: [] });
    }
  },

  refreshUser: async () => {
    try {
      const data = await authApi.checkAuth();
      set({
        userId: data.user.id, username: data.user.username,
        fullName: data.user.fullName || '',
        role: data.user.role, assignedStates: (data.user.assignedStates || []).map(normalizeEstado),
      });
    } catch { /* ignore */ }
  },
}));
