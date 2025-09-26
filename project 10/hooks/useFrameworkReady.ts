import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useFrameworkReady() {
  useEffect(() => {
    // Framework ready signal - required for Expo Router to function properly
    if (Platform.OS === 'web') {
      console.log('Framework ready');
    }
  }, []);
}