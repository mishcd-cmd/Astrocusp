// providers/AuthSessionProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';

// Simple cross-platform storage (uses AsyncStorage on native, localStorage on web)
type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

type Status = 'loading' | 'in' | 'out';

type Ctx = {
  status: Status;
  session: Session | null;
};

const AuthSessionContext = createContext<Ctx | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);

  // On first mount: restore session
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setStatus(data.session ? 'in' : 'out');
    })();

    // Subscribe to auth changes (token refresh, sign in/out)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setStatus(newSession ? 'in' : 'out');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ status, session }), [status, session]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuthSession must be used within AuthSessionProvider');
  return ctx;
}
