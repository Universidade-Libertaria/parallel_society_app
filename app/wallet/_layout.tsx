import { Stack } from 'expo-router';

export default function WalletLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, title: '' }}>
            <Stack.Screen name="setup" options={{ title: 'Wallet Setup' }} />
            <Stack.Screen name="new/intro" options={{ title: 'Create New Wallet' }} />
            <Stack.Screen name="new/display" options={{ title: 'Your Recovery Phrase' }} />
            <Stack.Screen name="new/confirm" options={{ title: 'Confirm Phrase' }} />
            <Stack.Screen name="import" options={{ title: 'Import Wallet' }} />
        </Stack>
    );
}
