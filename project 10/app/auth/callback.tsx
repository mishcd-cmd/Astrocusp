import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import CosmicBackground from '@/components/CosmicBackground';
import { absoluteRedirect } from '@/utils/urls';

export default function AuthCallback() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        console.log('[auth/callback] Starting PKCE exchange…');

        // 1) Current URL + guard
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        console.log('[auth/callback] Current URL:', currentUrl.substring(0, 120) + '…');

        if (!currentUrl || currentUrl.includes('webcontainer-api.io')) {
          setErr('Invalid callback environment. Please use the production site.');
          return;
        }

        // 2) Read query params
        const url = new URL(currentUrl);
        const params = url.searchParams;
        const type = (params.get('type') || '').toLowerCase();
        const code = params.get('code'); // PKCE auth code

        console.log('[auth/callback] Params:', { type, hasCode: !!code });

        if (!code) {
          console.error('[auth/callback] No PKCE code found in query string');
          setErr('Invalid or expired link. Please try again.');
          return;
        }

        // 3) Exchange code -> session (PKCE)
        console.log('[auth/callback] Exchanging code for session…');
        const { data, error } = await supabase.auth.exchangeCodeForSession({ authCode: code });

        if (error) {
          console.error('[auth/callback] exchangeCodeForSession error:', error);
          setErr(error.message || 'Sign-in failed. Please try again.');
          return;
        }

        console.log('[auth/callback] Session established:', !!data?.session);
        console.log('[auth/callback] User:', data?.session?.user?.email);

        // 4) Optional: respect ?next=/path for post-auth redirect
        const next = params.get('next');
        const target = next ? absoluteRedirect(next) : '/(tabs)/astrology';

        console.log('[auth/callback] Redirecting to:', target);
        router.replace(target);
      } catch (e: any) {
        console.error('[auth/callback] Fatal error:', e);
        setErr(e?.message || 'Failed to complete sign-in');
      }
    })();
  }, [router]);

  if (err) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sign-in error: {err}</Text>
          <Text style={styles.helpText}>Please try again from the app.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>Completing sign-in…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8b9dc3', marginTop: 12, fontSize: 16, fontFamily: 'Vazirmatn-Regular' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: '#ff6b6b', fontSize: 16, fontFamily: 'Vazirmatn-Medium', textAlign: 'center', marginBottom: 8 },
  helpText: { color: '#8b9dc3', fontSize: 14, fontFamily: 'Vazirmatn-Regular', textAlign: 'center' },
});
