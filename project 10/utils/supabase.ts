// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
// Native storage (used on iOS/Android)
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isWeb = typeof window !== 'undefined';

// Use localStorage on web, AsyncStorage on native
const webStorage = isWeb ? window.localStorage : undefined;
const nativeStorage = isWeb ? undefined : AsyncStorage;

// Key names (keep stable to survive reloads)
export const AUTH_STORAGE_KEY = 'astro-cusp-auth-session';
export const CODE_VERIFIER_KEY = 'astro-cusp-auth-session-code-verifier';

// Create client with explicit storage + persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: AUTH_STORAGE_KEY,
    // Supply platform storage
    storage: (webStorage as any) ?? (nativeStorage as any),
  },
});

// --- Optional: extra hardening for web rehydration -------------------------

// Keep a plain JSON copy for manual rehydration if needed (web only)
if (isWeb) {
  supabase.auth.onAuthStateChange((_event, session) => {
    try {
      if (session) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {}
  });
}

/**
 * Rehydrates a session early in app boot if Supabase hasn't yet.
 * Safe to call multiple times; no-op if already signed in.
 */
export async function rehydrateSessionIfNeeded() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;

  if (isWeb) {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      const access_token = stored?.access_token ?? stored?.currentSession?.access_token;
      const refresh_token = stored?.refresh_token ?? stored?.currentSession?.refresh_token;

      if (access_token && refresh_token) {
        // setSession will validate and refresh if needed
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    } catch {
      // ignore
    }
  }
}
