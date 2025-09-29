// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Env (Expo): set these in your .env / Netlify
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Cross-platform storage (LocalStorage on web, AsyncStorage on native)
const isWeb = typeof window !== 'undefined';

const storage = {
  getItem: async (key: string) => {
    try {
      if (isWeb && window?.localStorage) return window.localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWeb && window?.localStorage) { window.localStorage.setItem(key, value); return; }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (isWeb && window?.localStorage) { window.localStorage.removeItem(key); return; }
    await AsyncStorage.removeItem(key);
  },
};

// IMPORTANT: we set detectSessionInUrl=false (your /auth/callback handles PKCE)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
    storageKey: 'astro-cusp-auth-session', // stable key so it restores after reload
  },
});

// Small helper you can import anywhere
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
