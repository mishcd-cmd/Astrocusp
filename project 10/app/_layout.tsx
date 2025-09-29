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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthSession();         // ✅ use loading boolean
  if (loading) return null;                     // keep splash while auth hydrates
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium' : Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold'   : Vazirmatn_700Bold,
  });

  useEffect(() => {
    // We hide the splash inside AuthGate once auth is ready,
    // but we also need fonts first. So only hide when fonts are ready
    // AND AuthGate has rendered (i.e., not loading).
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthSessionProvider>
      <HemisphereProvider>
        <GlobalFontDefault />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </AuthGate>
      </HemisphereProvider>
    </AuthSessionProvider>
  );
}
