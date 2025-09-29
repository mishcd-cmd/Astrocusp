// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// One key for all platforms so your logs line up
export const AUTH_STORAGE_KEY = 'astro-cusp-auth-session';

const isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Minimal storage adapter that works on web (localStorage) and native (AsyncStorage)
const storage = {
  getItem: async (_: string) => {
    try {
      if (isWeb) return window.localStorage.getItem(AUTH_STORAGE_KEY);
      return await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  setItem: async (_: string, value: string) => {
    try {
      if (isWeb) window.localStorage.setItem(AUTH_STORAGE_KEY, value);
      else await AsyncStorage.setItem(AUTH_STORAGE_KEY, value);
    } catch {}
  },
  removeItem: async (_: string) => {
    try {
      if (isWeb) window.localStorage.removeItem(AUTH_STORAGE_KEY);
      else await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  },
};

// Create the client with persistent session + auto refresh + PKCE (for web)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true, // web PKCE callback support
  },
});

// Keep storage in sync on every auth change
supabase.auth.onAuthStateChange(async (_event, session) => {
  try {
    if (session) {
      await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      await storage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
});

// Ensure refresh runs even if the tab stays focused for a long time
// (On web, @supabase/js also refreshes on visibilitychange; this is extra-safe)
if (typeof supabase.auth.startAutoRefresh === 'function') {
  supabase.auth.startAutoRefresh();
}

// Small helper if you want to await rehydration in a provider
export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
