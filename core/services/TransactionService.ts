import { WalletTx, TxDirection, TxStatus } from '../types/Transaction';
import { TOKENS } from '../config/tokens';

/**
 * Service for fetching transaction history
 * Currently mocked until an indexer API is available
 */
export class TransactionService {
    /**
     * Generates a list of mock transactions for development
     * @param address User's wallet address
     * @returns Array of WalletTx
     */
    async getTransactions(address: string): Promise<WalletTx[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Helper to generate mock hash
        const mockHash = () => '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

        const transactions: WalletTx[] = [
            // Today
            {
                hash: mockHash(),
                token: 'RBTC',
                direction: 'in',
                title: 'Received RBTC',
                from: '0xExchange...',
                to: address,
                amount: '0.005',
                rawAmount: '5000000000000000',
                timestamp: now - (2 * 60 * 60 * 1000), // 2 hours ago
                status: 'confirmed',
                usdValue: '$216.25',
                fee: '0.0001 RBTC'
            },
            {
                hash: mockHash(),
                token: 'LUT',
                direction: 'out',
                title: 'Transferred to @user',
                from: address,
                to: '0xUser...',
                amount: '50.00',
                rawAmount: '50000000000000000000',
                timestamp: now - (4 * 60 * 60 * 1000), // 4 hours ago
                status: 'confirmed',
                fee: '0.0002 RBTC'
            },
            // Yesterday
            {
                hash: mockHash(),
                token: 'RBTC',
                direction: 'contract',
                title: 'Staked in Pool',
                from: address,
                to: '0xPool...',
                amount: '0.1',
                rawAmount: '100000000000000000',
                timestamp: now - oneDay - (3 * 60 * 60 * 1000),
                status: 'pending',
                usdValue: '$4,325.00',
                fee: '0.0005 RBTC'
            },
            // Earlier this month
            {
                hash: mockHash(),
                token: 'LUT',
                direction: 'out',
                title: 'Governance Vote',
                from: address,
                to: '0xGov...',
                amount: '0.00',
                rawAmount: '0',
                timestamp: now - (5 * oneDay),
                status: 'confirmed',
                fee: '0.0001 RBTC'
            },
            {
                hash: mockHash(),
                token: 'RBTC',
                direction: 'out',
                title: 'Sent to Exchange',
                from: address,
                to: '0xExchange...',
                amount: '0.02',
                rawAmount: '20000000000000000',
                timestamp: now - (10 * oneDay),
                status: 'failed',
                usdValue: '$865.00',
                fee: '0.0001 RBTC'
            }
        ];

        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Gets a single transaction by hash
     * @param hash Transaction hash
     */
    async getTransaction(hash: string): Promise<WalletTx | undefined> {
        // In a real app, this might fetch from an API
        // For now, we'll just mock it or rely on the list data
        return undefined;
    }
}

export const transactionService = new TransactionService();
