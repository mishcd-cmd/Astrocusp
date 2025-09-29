// providers/AuthSessionProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';

type Session = NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']> | null;

type Ctx = {
  session: Session;
  user: Session['user'] | null;
  loading: boolean;
};

const AuthSessionContext = createContext<Ctx>({ session: null, user: null, loading: true });

const STORAGE_KEY = 'astro-cusp-auth-session'; // must match utils/supabase.ts

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  // Restore on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[auth] getSession error:', error.message);
      }
      if (!mounted) return;

      setSession(data.session ?? null);
      setLoading(false);

      // 🔁 Mirror to localStorage so it survives reloads (Supabase already uses storage,
      // but this helps keep things in sync if you ever swap storage backends).
      if (typeof window !== 'undefined') {
        try {
          if (data.session) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
          } else {
            // DO NOT remove the key on INITIAL load; leaving the old value doesn’t hurt
            // and avoids “flash-logout” if getSession is late. We only overwrite on events below.
          }
        } catch {}
      }
    })();

    // Live updates
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('🔐 [supabase] auth state:', event, sess?.user?.email);
      // IMPORTANT: never sign out on INITIAL_SESSION
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(sess ?? null);
        if (typeof window !== 'undefined') {
          try {
            if (sess) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
          } catch {}
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {}
        }
      }
    });

    // Refresh on tab visibility resume (helps long-lived tabs)
    const onVis = async () => {
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, []);

  const value = useMemo<Ctx>(() => ({
    session,
    user: session?.user ?? null,
    loading,
  }), [session, loading]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
