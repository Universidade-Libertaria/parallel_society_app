import { create } from 'zustand';
import { TokenBalance, WalletBalances } from '@/core/types/TokenBalance';
import { balanceService } from '@/core/services/BalanceService';
import { transactionService } from '@/core/services/TransactionService';
import { WalletTx } from '@/core/types/Transaction';

interface WalletState {
    // Mnemonic state (existing)
    mnemonic: string[] | null;
    isWalletCreated: boolean;

    // Wallet address
    walletAddress: string | null;

    // Balance state
    balances: WalletBalances;
    loadingBalances: boolean;
    balanceError: string | null;

    // Transaction History
    txHistory: WalletTx[];
    loadingTxHistory: boolean;

    // Mnemonic actions (existing)
    setMnemonic: (mnemonic: string[]) => void;
    clearMnemonic: () => void;
    setWalletCreated: (created: boolean) => void;

    // Address actions
    setWalletAddress: (address: string) => void;

    // Balance actions
    loadBalances: (address?: string) => Promise<void>;
    refreshBalances: () => Promise<void>;

    // History Actions
    loadTxHistory: (address?: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    // Initial state
    mnemonic: null,
    isWalletCreated: false,
    walletAddress: null,
    balances: {
        RBTC: null,
        LUT: null
    },
    loadingBalances: false,
    balanceError: null,
    txHistory: [],
    loadingTxHistory: false,

    // Mnemonic actions
    setMnemonic: (mnemonic) => set({ mnemonic }),
    clearMnemonic: () => set({ mnemonic: null }),
    setWalletCreated: (created) => set({ isWalletCreated: created }),

    // Address actions
    setWalletAddress: (address) => set({ walletAddress: address }),

    // Balance actions
    loadBalances: async (address?: string) => {
        const targetAddress = address || get().walletAddress;

        if (!targetAddress) {
            set({ balanceError: 'No wallet address provided' });
            return;
        }

        set({ loadingBalances: true, balanceError: null });

        try {
            const balances = await balanceService.fetchAllBalances(targetAddress);
            set({
                balances,
                loadingBalances: false,
                walletAddress: targetAddress
            });
        } catch (error) {
            set({
                loadingBalances: false,
                balanceError: error instanceof Error ? error.message : 'Failed to load balances'
            });
        }
    },

    refreshBalances: async () => {
        const address = get().walletAddress;
        if (address) {
            await get().loadBalances(address);
        }
    },

    loadTxHistory: async (address?: string) => {
        const targetAddress = address || get().walletAddress;
        if (!targetAddress) return;

        set({ loadingTxHistory: true });
        try {
            const history = await transactionService.getTransactions(targetAddress);
            set({ txHistory: history });
        } catch (error) {
            console.error('Failed to load transaction history:', error);
        } finally {
            set({ loadingTxHistory: false });
        }
    }
}));
