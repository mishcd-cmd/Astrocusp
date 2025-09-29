// utils/supabase.ts
import 'react-native-url-polyfill/auto'; // ✅ ensure URL/crypto/etc. are available everywhere
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Env (Expo): set these in .env / Netlify UI
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Auth/session will not work until these are set.'
  );
}

// Cross-platform storage (LocalStorage on web, AsyncStorage on native)
const isWeb = typeof window !== 'undefined';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb && window?.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb && window?.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb && window?.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// IMPORTANT: detectSessionInUrl=false because your /auth/callback handles PKCE exchange
export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON!, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
    storageKey: 'astro-cusp-auth-session', // keep this stable for restore after reload
  },
});

// Helper for quick checks
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn('[supabase] getSession error:', error.message);
  return data.session ?? null;
}
