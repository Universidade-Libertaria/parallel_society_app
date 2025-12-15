import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useWalletStore } from '@/store/walletStore';

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasWallet, setHasWallet] = useState(false);
    const setWalletCreated = useWalletStore((state) => state.setWalletCreated);

    useEffect(() => {
        checkWalletExists();
    }, []);

    const checkWalletExists = async () => {
        try {
            const privateKey = await SecureStorage.getEncryptedKey('private_key');
            if (privateKey) {
                setHasWallet(true);
                setWalletCreated(true);
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

    // If wallet exists, go to dashboard; otherwise start wallet setup
    if (hasWallet) {
        return <Redirect href="/(tabs)/wallet" />;
    }

    return <Redirect href="/wallet/setup" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
