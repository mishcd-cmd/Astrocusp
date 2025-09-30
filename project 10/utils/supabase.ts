// utils/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use IndexedDB (via localforage) on Web to make persistence more robust than localStorage
import localforage from 'localforage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const isWeb = typeof window !== 'undefined';

// A storage adapter that uses IndexedDB on web (via localforage) and AsyncStorage on native
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        // localforage returns the value we set (string)
        const v = await localforage.getItem<string>(key);
        return v ?? null;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      await localforage.setItem<string>(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      await localforage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// Configure localforage (web only)
if (isWeb) {
  localforage.config({
    name: 'astrocusp',
    storeName: 'auth', // table name
    description: 'Supabase auth session',
  });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // you already complete PKCE in /auth/callback
    storage,
    storageKey: 'astro-cusp-auth-session',
  },
});

// Helper
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn('[supabase] getSession error:', error.message);
  return data.session ?? null;
}
