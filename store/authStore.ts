import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    hasBiometricsEnabled: boolean;
    setIsAuthenticated: (auth: boolean) => void;
    setBiometricsEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    hasBiometricsEnabled: false,
    setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
    setBiometricsEnabled: (enabled) => set({ hasBiometricsEnabled: enabled }),
}));
