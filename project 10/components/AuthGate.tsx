import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { clearLocalAuthData } from '@/utils/auth';
import CosmicBackground from './CosmicBackground';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const routedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔍 [AuthGate] Checking existing session...');
        
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('🔍 [AuthGate] Session check result:', {
          hasSession: !!session,
          email: session?.user?.email
        });
        
        // Don't redirect here - let the main app routing handle it
        setReady(true);
      } catch (error) {
        console.error('❌ [AuthGate] Error checking session:', error);
        clearLocalAuthData();
        if (mounted) {
          setReady(true);
          if (!routedRef.current) {
            routedRef.current = true;
            router.replace('/auth/login');
          }
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 [AuthGate] Auth state change:', event, !!session?.user);
      
      // Only handle explicit sign out - let app handle other routing
      if (event === 'SIGNED_OUT' && !routedRef.current) {
        console.log('ℹ️ [AuthGate] User signed out, redirecting to login');
        routedRef.current = true;
        router.replace('/auth/login');
      }
      
      // Handle password recovery
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 [AuthGate] Password recovery detected');
        if (!routedRef.current) {
          routedRef.current = true;
          router.replace('/password-reset');
        }
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});