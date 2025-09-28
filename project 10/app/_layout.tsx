// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput, Platform } from 'react-native';

// Fonts
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

// Hemisphere context (needed for useHemisphere hooks in screens)
import { HemisphereProvider } from '@/providers/HemisphereProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function applyGlobalFontDefaults() {
  // Ensure we don’t overwrite other defaultProps if they exist
  const baseTextDefaults = Text.defaultProps ?? {};
  const baseInputDefaults = TextInput.defaultProps ?? {};

  Text.defaultProps = {
    ...baseTextDefaults,
    style: [{ fontFamily: 'Vazirmatn-Regular' }, baseTextDefaults.style],
  };

  TextInput.defaultProps = {
    ...baseInputDefaults,
    style: [{ fontFamily: 'Vazirmatn-Regular' }, baseInputDefaults.style],
  };
}

export default function RootLayout() {
  // Load Vazirmatn weights and expose them under the names your styles use
  const [loaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium': Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    // Set global Text/TextInput defaults once fonts are ready
    applyGlobalFontDefaults();
    // Hide splash when ready
    SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Don’t render until fonts are ready (prevents FOUT)
  if (!loaded) return null;

  return (
    <HemisphereProvider initialHemisphere="Northern">
      <Stack screenOptions={{ headerShown: false, animation: Platform.OS === 'web' ? 'fade' : 'default' }} />
    </HemisphereProvider>
  );
}
