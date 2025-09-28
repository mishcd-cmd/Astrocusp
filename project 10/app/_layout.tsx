// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

// Hemisphere context (required for useHemisphere)
import { HemisphereProvider } from '@/providers/HemisphereProvider';

// ✅ Your global font initializer (you already created this)
import GlobalFontDefault from '@/components/GlobalFontDefault';

// If you use Gesture Handler anywhere, keep this import at the top-level entry once in your app
// import 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <HemisphereProvider initialHemisphere="Northern">
      {/* Load Vazirmatn and set global defaults for <Text>/<TextInput> */}
      <GlobalFontDefault />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </HemisphereProvider>
  );
}
