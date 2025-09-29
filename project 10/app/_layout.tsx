// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// Fonts
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

// Hemisphere provider (no initialHemisphere prop needed)
import { HemisphereProvider } from '@/providers/HemisphereProvider';

// Global font defaults (the simple component you created earlier)
import GlobalFontDefault from '@/components/GlobalFontDefault';

// Session wait helper
import { waitForInitialSession } from '@/utils/sessionReady';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium': Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  });

  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // ⬇️ Critical: hydrate Supabase session first
        await waitForInitialSession();
      } finally {
        if (isMounted) setSessionReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && sessionReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, sessionReady]);

  if (!fontsLoaded || !sessionReady) {
    // Tiny splash while we load fonts + session
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.bootText}>Preparing your sky…</Text>
      </View>
    );
  }

  return (
    <HemisphereProvider>
      <GlobalFontDefault />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </HemisphereProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1021' },
  bootText: { marginTop: 10, color: '#8b9dc3', fontFamily: 'Vazirmatn-Regular' },
});
