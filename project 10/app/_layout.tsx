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

import GlobalFontDefault from '@/components/GlobalFontDefault';
import { HemisphereProvider } from '@/providers/HemisphereProvider';
import { AuthSessionProvider, useAuthSession } from '@/providers/AuthSessionProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate({ fontsLoaded, children }: { fontsLoaded: boolean; children: React.ReactNode }) {
  const { status } = useAuthSession(); // 'loading' | 'in' | 'out'

  // Keep splash up until fonts AND auth are ready
  useEffect(() => {
    if (fontsLoaded && status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === 'loading') return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium' : Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold'   : Vazirmatn_700Bold,
  });

  // Do not hide splash here—AuthGate will do it when both are ready
  if (!fontsLoaded) return null;

  return (
    <AuthSessionProvider>
      <HemisphereProvider>
        <GlobalFontDefault />
        <AuthGate fontsLoaded={fontsLoaded}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </AuthGate>
      </HemisphereProvider>
    </AuthSessionProvider>
  );
}
