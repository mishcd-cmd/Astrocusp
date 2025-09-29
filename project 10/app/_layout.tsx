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

// ⬇️ use YOUR file/exports
import { AuthSessionProvider, useAuthSession } from '@/providers/AuthSessionProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuthSession(); // expect 'loading' | 'in' | 'out'
  if (status === 'loading') return null;
  return <>{children}</>;
}

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
