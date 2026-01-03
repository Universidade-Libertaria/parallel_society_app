import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface WalletState {
    mnemonic: string[] | null; // Sensitive data
    isWalletCreated: boolean;
    setMnemonic: (mnemonic: string[]) => void;
    clearMnemonic: () => void;
    setWalletCreated: (created: boolean) => void;
}

// Custom storage adapter for Expo SecureStore
const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
};

export const useWalletStore = create<WalletState>()(
    persist(
        (set) => ({
            mnemonic: null,
            isWalletCreated: false,
            setMnemonic: (mnemonic) => set({ mnemonic }),
            clearMnemonic: () => set({ mnemonic: null }),
            setWalletCreated: (created) => set({ isWalletCreated: created }),
        }),
        {
            name: 'wallet-storage',
            storage: createJSONStorage(() => secureStorage),
        }
    )
);
