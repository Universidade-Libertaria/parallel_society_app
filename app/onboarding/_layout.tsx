import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: true, title: '' }}>
            <Stack.Screen name="create-profile" options={{ title: 'Create Your Profile' }} />
        </Stack>
    );
}
