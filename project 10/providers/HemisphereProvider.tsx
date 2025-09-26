import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

type Hemisphere = 'Northern' | 'Southern';

type Ctx = {
  hemisphere: Hemisphere;
  setHemisphereSafe: (h: Hemisphere) => Promise<void>;
  saving: boolean;
};

const HemisphereContext = createContext<Ctx | null>(null);

export function HemisphereProvider({ children }: { children: React.ReactNode }) {
  const [hemisphere, setHemisphere] = useState<Hemisphere>('Southern'); // default
  const [saving, setSaving] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // bootstrap from profile OR localStorage once at mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // local cache first
        const cached = typeof window !== 'undefined'
          ? (window.localStorage.getItem('hemisphere') as Hemisphere | null)
          : null;

        if (cached === 'Northern' || cached === 'Southern') {
          if (!alive) return;
          setHemisphere(cached);
        }

        // profile value
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!alive) return;
          setBootstrapped(true);
          return;
        }

        const { data: prof } = await supabase
          .from('user_profiles')
          .select('hemisphere')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!alive) return;
        if (prof?.hemisphere === 'Northern' || prof?.hemisphere === 'Southern') {
          setHemisphere(prof.hemisphere);
          if (typeof window !== 'undefined') localStorage.setItem('hemisphere', prof.hemisphere);
        }
      } finally {
        if (alive) setBootstrapped(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  // single writer that won't be "undone" by bootstrap effects
  const setHemisphereSafe = useCallback(async (h: Hemisphere) => {
    if (saving) return; // debounce
    setSaving(true);

    // optimistic update
    setHemisphere(h);
    if (typeof window !== 'undefined') localStorage.setItem('hemisphere', h);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('user_profiles')
          .update({ hemisphere: h })
          .eq('user_id', session.user.id);
      }
    } finally {
      setSaving(false);
    }
  }, [saving]);

  return (
    <HemisphereContext.Provider value={{ hemisphere, setHemisphereSafe, saving }}>
      {/* block children until we decide initial value once, to avoid "overwrite" races */}
      {bootstrapped ? children : null}
    </HemisphereContext.Provider>
  );
}

export function useHemisphere() {
  const ctx = useContext(HemisphereContext);
  if (!ctx) throw new Error('useHemisphere must be used inside HemisphereProvider');
  return ctx;
}