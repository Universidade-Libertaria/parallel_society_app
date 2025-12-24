import { ethers } from 'ethers';

/**
 * EIP-712 Domain for LUT Governance
 * Must match backend exactly
 */
export const EIP712_DOMAIN = {
    name: 'LUT Governance',
    version: '1',
    chainId: 30, // RSK Mainnet - MUST match the network your backend RPC uses
    verifyingContract: '0x0000000000000000000000000000000000000000'
};

/**
 * EIP-712 Types for Vote
 * Must match backend exactly
 */
export const EIP712_TYPES = {
    Vote: [
        { name: 'proposalId', type: 'string' },
        { name: 'voter', type: 'address' },
        { name: 'choice', type: 'string' },
        { name: 'snapshotBlock', type: 'uint256' },
        { name: 'timestamp', type: 'uint64' }
    ]
};

/**
 * Vote message structure
 */
export interface VoteMessage {
    proposalId: string;
    voter: string;
    choice: 'FOR' | 'AGAINST';
    snapshotBlock: number;
    timestamp: number;
}

/**
 * Signs a vote using EIP-712 typed data
 * @param privateKey The voter's private key (hex string)
 * @param message The vote message to sign
 * @returns The signature (hex string)
 */
export async function signVote(
    privateKey: string,
    message: VoteMessage
): Promise<string> {
    try {
        // Create wallet from private key
        const wallet = new ethers.Wallet(privateKey);

        // Sign the typed data
        const signature = await wallet.signTypedData(
            EIP712_DOMAIN,
            EIP712_TYPES,
            message
        );

        return signature;
    } catch (error: any) {
        console.error('Failed to sign vote:', error.message);
        throw new Error('Failed to sign vote');
    }
}
