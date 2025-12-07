import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SecureStorage } from '@/core/secure/SecureStorage';
import { useAuthStore } from '@/store/authStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { ethers } from 'ethers';

export default function SetPinScreen() {
    const router = useRouter();
    const { setBiometricsEnabled } = useAuthStore();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFinish = async () => {
        if (pin.length !== 6) {
            Alert.alert('Invalid PIN', 'PIN must be 6 digits.');
            return;
        }
        if (pin !== confirmPin) {
            Alert.alert('Mismatch', 'PINs do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const hash = ethers.keccak256(ethers.toUtf8Bytes(pin));
            await SecureStorage.savePinHash(hash);

            if (useBiometrics) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                if (hasHardware) {
                    await SecureStorage.saveEncryptedKey('use_biometrics', 'true');
                    // Update store after a small delay or ensure it doesn't unmount this component prematurely
                    // Actually, updating the store is fine, but we should navigate first or ensure the store update doesn't kill the route.
                    setBiometricsEnabled(true);
                }
            }

            // Use replace to go home, but ensure we are not in a race condition
            router.dismissAll();
            router.replace('/home');
        } catch (e) {
            Alert.alert('Error', 'Failed to save security settings.');
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set App Lock</Text>
            <Text style={styles.description}>
                Create a 6-digit PIN to secure your wallet.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
            />

            <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Use Biometrics for Quick Access</Text>
                <Switch
                    value={useBiometrics}
                    onValueChange={setUseBiometrics}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleFinish}
                disabled={isSubmitting}
            >
                <Text style={styles.buttonText}>{isSubmitting ? 'Setting up...' : 'Finish Wallet Setup'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        justifyContent: 'center',
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
        marginBottom: 16,
        textAlign: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
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
