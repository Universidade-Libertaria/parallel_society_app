import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { WalletService } from '@/core/wallet/WalletService';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useWalletStore } from '@/store/walletStore';

export default function ImportWalletScreen() {
    const router = useRouter();
    const { setWalletCreated, setWalletAddress } = useWalletStore();
    const [mnemonicInput, setMnemonicInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async () => {
        const words = mnemonicInput.trim().split(/\s+/);
        if (words.length !== 24 && words.length !== 12) {
            Alert.alert('Invalid Phrase', 'Please enter a valid 12 or 24-word recovery phrase.');
            return;
        }

        setIsImporting(true);
        try {
            const wallet = WalletService.importMnemonic(words);
            await SecureStorage.saveEncryptedKey('private_key', wallet.privateKey);

            // Save the wallet address to store
            setWalletAddress(wallet.address);

            setWalletCreated(true);
            router.push('/auth/set-pin');
        } catch (e) {
            Alert.alert('Error', 'Invalid recovery phrase. Please check and try again.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Import Wallet</Text>
            <Text style={styles.description}>
                Enter your 12 or 24-word recovery phrase to restore your wallet.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Enter your recovery phrase here..."
                multiline
                numberOfLines={4}
                value={mnemonicInput}
                onChangeText={setMnemonicInput}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <TouchableOpacity
                style={[styles.button, isImporting && styles.buttonDisabled]}
                onPress={handleImport}
                disabled={isImporting}
            >
                <Text style={styles.buttonText}>{isImporting ? 'Importing...' : 'Import Wallet'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
