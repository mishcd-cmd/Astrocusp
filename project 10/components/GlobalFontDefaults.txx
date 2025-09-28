// components/GlobalFontDefaults.tsx
import React, { useEffect } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function GlobalFontDefaults() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': Vazirmatn_400Regular,
    'Vazirmatn-Medium': Vazirmatn_500Medium,
    'Vazirmatn-SemiBold': Vazirmatn_600SemiBold,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    // Set global defaults once fonts are ready
    // Text
    (RNText as any).defaultProps ??= {};
    (RNText as any).defaultProps.style = [
      { fontFamily: 'Vazirmatn-Regular' },
      (RNText as any).defaultProps.style,
    ];

    // TextInput
    (RNTextInput as any).defaultProps ??= {};
    (RNTextInput as any).defaultProps.style = [
      { fontFamily: 'Vazirmatn-Regular' },
      (RNTextInput as any).defaultProps.style,
    ];

    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Avoid flashing unstyled text
  if (!fontsLoaded) return null;
  return null;
}
