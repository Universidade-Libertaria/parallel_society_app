import { create } from 'zustand';

interface OnboardingState {
    username: string;
    email: string;
    country: string;
    language: 'English';
    walletMode: 'CREATE' | 'IMPORT' | null;
    setUsername: (username: string) => void;
    setEmail: (email: string) => void;
    setCountry: (country: string) => void;
    setLanguage: (language: string) => void;
    setWalletMode: (mode: 'CREATE' | 'IMPORT' | null) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    username: '',
    email: '',
    country: '',
    language: 'English',
    walletMode: null,
    setUsername: (username) => set({ username }),
    setEmail: (email) => set({ email }),
    setCountry: (country) => set({ country }),
    setLanguage: (language) => set({ language }),
    setWalletMode: (mode) => set({ walletMode: mode }),
    reset: () => set({ username: '', email: '', country: '', language: 'English', walletMode: null }),
}));
