// components/AuthBootstrap.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import CosmicBackground from '@/components/CosmicBackground';
import { rehydrateSessionIfNeeded, supabase } from '@/utils/supabase';

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Try rehydration (web) or normal getSession (native)
      await rehydrateSessionIfNeeded();

      // 2) Force a getSession once to ensure client state is up
      await supabase.auth.getSession();

      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.text}>Preparing your space…</Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  text: { color: '#8b9dc3', fontFamily: 'Vazirmatn-Regular' },
});
