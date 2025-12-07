import { create } from 'zustand';

interface WalletState {
    mnemonic: string[] | null; // Temporary storage during creation
    isWalletCreated: boolean;
    setMnemonic: (mnemonic: string[]) => void;
    clearMnemonic: () => void;
    setWalletCreated: (created: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
    mnemonic: null,
    isWalletCreated: false,
    setMnemonic: (mnemonic) => set({ mnemonic }),
    clearMnemonic: () => set({ mnemonic: null }),
    setWalletCreated: (created) => set({ isWalletCreated: created }),
}));
