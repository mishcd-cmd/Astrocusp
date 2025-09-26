import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { clearLocalAuthData } from '@/utils/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Force cache refresh - updated 2025-01-30
    console.log('[index] App starting - cache refresh forced');
    
    // Check for existing session and route accordingly
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[index] Initial session check:', !!session);
        if (session) {
          router.replace('/(tabs)/astrology');
        } else {
          router.replace('/welcome');
        }
      })
      .catch((error) => {
        console.error('[index] Session check failed:', error);
        clearLocalAuthData();
        router.replace('/welcome');
      });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[index] Auth state change:', event, !!session);
      if (session) {
        router.replace('/(tabs)/astrology');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/welcome');
      }
    });

    return () => data.subscription.unsubscribe();
  }, [router]);

  return null;
}