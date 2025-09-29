// providers/AuthSessionProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';

type Status = 'loading' | 'in' | 'out';
type Ctx = {
  status: Status;
  user: import('@supabase/supabase-js').User | null;
};

const AuthCtx = createContext<Ctx>({ status: 'loading', user: null });

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<Ctx['user']>(null);

  useEffect(() => {
    let mounted = true;

    // 1) Bootstrap from current session (from localStorage/AsyncStorage)
    supabase.auth.getSession().then(({ data, error }) => {
      const hasUser = !!data?.session?.user;
      if (!mounted) return;
      setUser(hasUser ? data!.session!.user! : null);
      setStatus(hasUser ? 'in' : 'out');
      console.log('🔐 [auth] bootstrap', { hasUser, event: 'getSession' });
    });

    // 2) Subscribe to auth changes. Treat INITIAL_SESSION as “in” when a user exists.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const hasUser = !!session?.user;
      console.log('🔐 [auth] event', event, hasUser ? session!.user!.email : null);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setUser(session?.user ?? null);
          setStatus(session?.user ? 'in' : 'out');
          break;
        case 'INITIAL_SESSION':
          // IMPORTANT: count this as signed in if a user exists
          setUser(session?.user ?? null);
          setStatus(session?.user ? 'in' : 'out');
          break;
        case 'SIGNED_OUT':
          setUser(null);
          setStatus('out');
          break;
        case 'USER_UPDATED':
          setUser(session?.user ?? null);
          setStatus(session?.user ? 'in' : 'out');
          break;
        default:
          // keep current but ensure we never stay stuck on loading
          if (status === 'loading') setStatus(hasUser ? 'in' : 'out');
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []); // eslint-disable-line

  const value = useMemo(() => ({ status, user }), [status, user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuthSession() {
  return useContext(AuthCtx);
}
