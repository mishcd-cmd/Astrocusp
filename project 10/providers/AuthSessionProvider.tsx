// providers/AuthSessionProvider.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabase';

type Status = 'loading' | 'in' | 'out';

type Ctx = {
  status: Status;
  userEmail?: string | null;
};

const AuthSessionCtx = createContext<Ctx>({ status: 'loading', userEmail: null });

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 1) Bootstrap from storage synchronously on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!cancelled) {
        if (session?.user) {
          setStatus('in');
          setUserEmail(session.user.email ?? null);
        } else {
          setStatus('out');
          setUserEmail(null);
        }
      }
    })();

    // 2) Subscribe to future changes (sign-in/out, refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Helpful logs (optional)
      const email = session?.user?.email ?? null;
      console.log('🔐 [auth] event', event, email || '');

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setStatus('in');
        setUserEmail(email);
      } else if (event === 'SIGNED_OUT') {
        setStatus('out');
        setUserEmail(null);
      } else if (event === 'INITIAL_SESSION') {
        // This fires on load; we already handled getSession above.
        if (session?.user) {
          setStatus('in');
          setUserEmail(email);
        } else {
          setStatus('out');
          setUserEmail(null);
        }
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ status, userEmail }), [status, userEmail]);

  return <AuthSessionCtx.Provider value={value}>{children}</AuthSessionCtx.Provider>;
}

export function useAuthSession() {
  return useContext(AuthSessionCtx);
}
