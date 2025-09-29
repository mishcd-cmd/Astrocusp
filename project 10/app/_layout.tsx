// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

import { HemisphereProvider } from '@/providers/HemisphereProvider';
import GlobalFontDefault from '@/components/GlobalFontDefault';
import AuthBootstrap from '@/components/AuthBootstrap';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium':  Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold':     Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <HemisphereProvider initialHemisphere="Northern">
      <GlobalFontDefault />
      <AuthBootstrap>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthBootstrap>
    </HemisphereProvider>
  );
}
