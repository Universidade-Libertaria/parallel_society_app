import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function CreateProfileScreen() {
    const router = useRouter();
    const { username, email, setUsername, setEmail, walletMode } = useOnboardingStore();

    const handleNext = () => {
        if (!username) return;

        if (walletMode === 'CREATE') {
            router.push('/wallet/new/intro');
        } else if (walletMode === 'IMPORT') {
            router.push('/wallet/import');
        } else {
            // Fallback if mode is lost, though it shouldn't happen
            router.push('/wallet/setup');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.stepIndicator}>Step 2 of 3</Text>
            <Text style={styles.description}>
                Let's start with the basics. Your username will be your public identity.
            </Text>

            <View style={styles.form}>
                <Text style={styles.label}>Name / Username</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., citizen_one"
                    value={username}
                    onChangeText={setUsername}
                />

                <Text style={styles.label}>Email (Recommended)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !username && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!username}
                >
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
                    <Text style={styles.skipButtonText}>Skip email for now</Text>
                </TouchableOpacity>
            </View>
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
    stepIndicator: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#1a1a1a',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    footer: {
        marginTop: 48,
        gap: 16,
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
    skipButton: {
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});
