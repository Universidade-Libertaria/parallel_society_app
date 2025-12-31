import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthService } from '@/core/services/AuthService';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        const unsubscribe = AuthService.subscribeToAuthChanges((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, [setUser]);

    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome/index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="legal" />
                <Stack.Screen name="home" />
            </Stack>
        </SafeAreaProvider>
    );
}
