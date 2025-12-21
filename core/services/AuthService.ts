import { ethers } from 'ethers';
import { signInWithCustomToken, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';
import { SecureStorage } from '../secure/SecureStorage';

const BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL;

export interface AuthResponse {
    token?: string;
    error?: string;
}

export class AuthService {
    /**
     * Orchestrates the full wallet authentication flow.
     * 1. Get nonce from backend.
     * 2. Sign message with local wallet.
     * 3. Verify signature on backend to get Custom Token.
     * 4. Sign in to Firebase with Custom Token.
     */
    static async signInWithWallet(mnemonic: string): Promise<User> {
        if (!BACKEND_URL) throw new Error('Auth backend URL not configured');

        // Derive wallet from mnemonic
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const address = wallet.address;

        // 1. Request Nonce
        const nonceRes = await fetch(`${BACKEND_URL}/authRequestNonce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        if (!nonceRes.ok) {
            const error = await nonceRes.text();
            throw new Error(`Failed to get nonce: ${error}`);
        }

        const { nonce } = await nonceRes.json();

        // 2. Sign Message
        const message = `Sign in to Parallel Society Governance\nNonce: ${nonce}`;
        const signature = await wallet.signMessage(message);

        // 3. Verify Signature & Get Token
        const verifyRes = await fetch(`${BACKEND_URL}/authVerify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature })
        });

        if (!verifyRes.ok) {
            const error = await verifyRes.text();
            throw new Error(`Failed to verify signature: ${error}`);
        }

        const { token } = await verifyRes.json();

        // 4. Sign in to Firebase
        const userCredential = await signInWithCustomToken(firebaseAuth, token);
        return userCredential.user;
    }

    static async logout(): Promise<void> {
        await signOut(firebaseAuth);
    }

    static subscribeToAuthChanges(callback: (user: User | null) => void) {
        return onAuthStateChanged(firebaseAuth, callback);
    }
}
