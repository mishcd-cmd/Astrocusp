// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Load Vazirmatn and alias to the family names you already use in styles
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

// Hemisphere context (provides useHemisphere)
import { HemisphereProvider } from '@/providers/HemisphereProvider';

// Global font defaults (you created this at components/GlobalFontDefault.tsx)
import GlobalFontDefault from '@/components/GlobalFontDefault';

// Keep the splash screen up until fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium': Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <HemisphereProvider initialHemisphere="Northern">
      {/* Sets Vazirmatn as the default for all Text/TextInput (and injects CSS on web) */}
      <GlobalFontDefault />
      {/* Your app stack */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </HemisphereProvider>
  );
}
