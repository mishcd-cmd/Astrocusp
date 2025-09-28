// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Fonts (alias to names your styles already use)
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

// ⬇️ Hemisphere context provider (the one that defines useHemisphere)
import { HemisphereProvider } from '@/providers/HemisphereProvider';

// If you use Gesture Handler anywhere, keep this import at the top-level entry once in your app
// import 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Load fonts and alias to app-wide family names already used in your StyleSheets
  const [loaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium':  Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold':    Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <HemisphereProvider initialHemisphere="Northern">
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </HemisphereProvider>
  );
}
