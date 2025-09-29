// providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';

type AuthStatus = 'loading' | 'in' | 'out';
type AuthCtx = {
  status: AuthStatus;
  session: import('@supabase/supabase-js').Session | null;
};

const Ctx = createContext<AuthCtx>({ status: 'loading', session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);

  // 1) First, read any persisted session from storage
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.log('🔐 [auth] getSession error', error);
        setSession(null);
        setStatus('out');
      } else {
        setSession(data.session ?? null);
        setStatus(data.session ? 'in' : 'out');
        if (data.session) {
          console.log('🔐 [auth] restored session for', data.session.user?.email);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2) Subscribe to changes (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc.)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, sess) => {
      // Helpful logs (you can remove later)
      const em = sess?.user?.email;
      console.log('🔐 [auth change]', evt, em || '(no user)');
      setSession(sess ?? null);
      setStatus(sess ? 'in' : 'out');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ status, session }), [status, session]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
