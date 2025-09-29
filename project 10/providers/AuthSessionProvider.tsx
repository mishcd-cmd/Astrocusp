// providers/AuthSessionProvider.tsx
import React, { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase, getCurrentSession } from '@/utils/supabase';

type Props = { children: React.ReactNode };

export function AuthSessionProvider({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      // 1) Rehydrate session from storage on boot
      await getCurrentSession();
      setReady(true);

      // 2) Listen for auth changes (already persisted by utils/supabase.ts)
      const { data } = supabase.auth.onAuthStateChange(() => {});
      unsub = () => data.subscription.unsubscribe();
    })();

    // 3) Extra: refresh token when app comes back to foreground (native)
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && Platform.OS !== 'web') {
        try {
          await supabase.auth.refreshSession();
        } catch {}
      }
    });

    // 4) Extra: when a backgrounded tab returns (web), encourage refresh
    if (typeof document !== 'undefined') {
      const onVisible = async () => {
        if (document.visibilityState === 'visible') {
          try {
            await supabase.auth.refreshSession();
          } catch {}
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        sub.remove();
        document.removeEventListener('visibilitychange', onVisible);
        unsub?.();
      };
    }

    return () => {
      sub.remove();
      unsub?.();
    };
  }, []);

  if (!ready) return null; // avoid flicker

  return <>{children}</>;
}
