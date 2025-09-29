// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Fonts
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

import { HemisphereProvider } from '@/providers/HemisphereProvider';
import GlobalFontDefault from '@/components/GlobalFontDefault';
import { AuthSessionProvider } from '@/providers/AuthSessionProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium': Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <HemisphereProvider initialHemisphere="Northern">
      <GlobalFontDefault />
      <AuthSessionProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthSessionProvider>
    </HemisphereProvider>
  );
}
