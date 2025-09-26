import { supabase } from '@/utils/supabase';
import { clearUserData } from '@/utils/userData';
import { syncStripeToSupabase } from '@/utils/profileSync';

// Web-compatible storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
};

const LAST_USER_ID_KEY = '@astro_cusp:last_user_id';

export async function ensureFreshUser(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const currentId = user?.id || null;
  const prevId = await storage.getItem(LAST_USER_ID_KEY);

  if (!currentId) {
    // Only clear user data if explicitly signed out, not on session refresh
    await clearUserData().catch(() => {});
    await storage.removeItem(LAST_USER_ID_KEY);
    return;
  }

  if (prevId && prevId !== currentId) {
    // Different user than last time -> purge all user caches
    await clearUserData().catch(() => {});
  }

  await storage.setItem(LAST_USER_ID_KEY, currentId);
    // Check if user has a Supabase profile, create one if missing
    if (user?.email) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) {
          console.log('🔄 [authGuard] No profile found, creating from auth data for:', user.email);
          await syncStripeToSupabase(user.id, user.email);
        }
      } catch (syncError) {
        console.error('❌ [authGuard] Profile sync failed:', syncError);
        // Don't throw - let user continue even if sync fails
      }
    }

}

export function attachAuthStateListener() {
  // Listen to auth changes and run the same guard
  supabase.auth.onAuthStateChange(async () => {
    try { await ensureFreshUser(); } catch {}
  });
}