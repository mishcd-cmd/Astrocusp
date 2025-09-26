import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// EMERGENCY: Log environment at startup to verify correct build
console.log('🔍 [env] SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('🔍 [env] ANON_KEY prefix:', (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').slice(0, 16));
console.log('🔍 [env] ANON_KEY length:', (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').length);
console.log('🔍 [env] SITE_URL:', process.env.EXPO_PUBLIC_SITE_URL);
console.log('🔍 [env] Build timestamp:', new Date().toISOString());

// EMERGENCY: Hardcode credentials to prevent lockout
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fulzqbwojvrripsuoreh.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bHpxYndvanZycmlwc3VvcmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MzU2NjAsImV4cCI6MjA2OTUxMTY2MH0.W6Ok6anVypNt6NegyEHNs2F8pNIrR6Uq7O1vxdNDmGw';

console.log('🔍 [supabase] Initializing with:', {
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  keyLength: SUPABASE_ANON_KEY?.length,
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY
});

const isBrowser = typeof window !== 'undefined';

// Create a robust storage adapter that ensures session persistence
const createStorageAdapter = () => {
  if (!isBrowser) {
    // During static build (Node.js environment), don't use any storage
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  
  // In browser, use localStorage with enhanced persistence
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        try {
          const item = localStorage.getItem(key);
          console.log(`🔍 [storage] getItem(${key}):`, item ? `found (${item.length} chars)` : 'null');
          return item;
        } catch (error) {
          console.error(`❌ [storage] getItem(${key}) failed:`, error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          console.log(`💾 [storage] setItem(${key}): saved (${value.length} chars)`);
          
          // Verify it was actually saved
          const verification = localStorage.getItem(key);
          if (!verification) {
            console.error(`❌ [storage] setItem verification failed for ${key}`);
          } else {
            console.log(`✅ [storage] setItem verified for ${key}`);
          }
        } catch (error) {
          console.error(`❌ [storage] setItem(${key}) failed:`, error);
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ [storage] removeItem(${key}): removed`);
          
          // Verify it was actually removed
          const verification = localStorage.getItem(key);
          if (verification) {
            console.error(`❌ [storage] removeItem verification failed for ${key}`);
          } else {
            console.log(`✅ [storage] removeItem verified for ${key}`);
          }
        } catch (error) {
          console.error(`❌ [storage] removeItem(${key}) failed:`, error);
        }
      },
    };
  }
  
  // Fallback for non-web environments
  return {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  };
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'astro-cusp-auth-session',
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false, // Reduce noise but keep persistence logging
  },
});

export default supabase;
