import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasWallet, setHasWallet] = useState(false);
    const setWalletCreated = useWalletStore((state) => state.setWalletCreated);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        checkWalletExists();
    }, []);

    const checkWalletExists = async () => {
        try {
            // We check for mnemonic as it's required for the signature flow
            const mnemonic = await SecureStorage.getEncryptedKey('mnemonic');
            if (mnemonic) {
                setHasWallet(true);
                setWalletCreated(true);
            } else {
                // Also check private_key for legacy or fallback
                const privateKey = await SecureStorage.getEncryptedKey('private_key');
                if (privateKey) {
                    setHasWallet(true);
                    setWalletCreated(true);
                }
            }
        } catch (e) {
            // No wallet found
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // 1. If we have a Firebase session, go to the dashboard
    if (isAuthenticated) {
        return <Redirect href="/(tabs)/wallet" />;
    }

    // 2. If we have a local wallet but no Firebase session, go to Login (Signature Flow)
    if (hasWallet) {
        return <Redirect href="/auth/login" />;
    }

    // 3. If no wallet at all, start onboarding
    return <Redirect href="/(tabs)/wallet/setup" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
