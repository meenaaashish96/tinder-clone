import { Stack } from 'expo-router';
import React from 'react';
// Updated import to use the alias '@' for consistent root-relative resolution
import { AppProvider } from '@/hooks/useAppState';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Authentication Screens */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        
        {/* Main App (Tabs) - This matches the folder name '(tabs)' */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}