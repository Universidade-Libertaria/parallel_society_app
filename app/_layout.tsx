import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-get-random-values'; // Polyfill for ethers

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome/index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="wallet" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="legal" />
                <Stack.Screen name="home" />
            </Stack>
        </SafeAreaProvider>
    );
}
