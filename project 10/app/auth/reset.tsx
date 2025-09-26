import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Key, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import CosmicButton from '@/components/CosmicButton';
import CosmicBackground from '@/components/CosmicBackground';
import { supabase } from '@/utils/supabase';

type VerifyState =
  | { status: 'idle' }
  | { status: 'verifying' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

type ResetPhase = 'verifying' | 'ready' | 'updating' | 'success' | 'error';

export default function AuthResetPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: 'idle' });
  const [phase, setPhase] = useState<ResetPhase>('verifying');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    console.log('[RESET] PKCE handler starting…');

    const processResetLink = async () => {
      try {
        setVerifyState({ status: 'verifying' });

        const href = typeof window !== 'undefined' ? window.location.href : '';
        const url = href ? new URL(href) : null;
        const search = url?.searchParams;

        const type = (search?.get('type') || (params.type as string) || '').toLowerCase();
        const code = search?.get('code') || (params.code as string) || '';
        const token_hash = search?.get('token_hash') || (params.token_hash as string) || '';

        console.log('[RESET] URL:', href);
        console.log('[RESET] type:', type, 'code?', !!code, 'token_hash?', !!token_hash);

        if (type !== 'recovery') {
          setVerifyState({
            status: 'error',
            message: 'Invalid reset link. Please request a new one.',
          });
          setPhase('error');
          return;
        }

        // PKCE auth code → exchange for session
        if (code) {
          console.log('[RESET] Exchanging PKCE code for session…');
          const { error } = await supabase.auth.exchangeCodeForSession({ authCode: code });
          if (error) {
            console.error('[RESET] exchangeCodeForSession error:', error);
            setVerifyState({ status: 'error', message: error.message || 'Reset link invalid or expired.' });
            setPhase('error');
            return;
          }
          console.log('[RESET] PKCE session established');
          setVerifyState({ status: 'ok' });
          setPhase('ready');
          return;
        }

        // PKCE token-hash → verifyOtp (recovery)
        if (token_hash) {
          console.log('[RESET] Verifying token_hash via verifyOtp…');
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash,
          });
          if (error) {
            console.error('[RESET] verifyOtp(token_hash) error:', error);
            setVerifyState({ status: 'error', message: error.message || 'Reset link invalid or expired.' });
            setPhase('error');
            return;
          }
          console.log('[RESET] Token hash verified, session active');
          setVerifyState({ status: 'ok' });
          setPhase('ready');
          return;
        }

        // No parameters found
        console.warn('[RESET] Missing code/token_hash in URL');
        setVerifyState({
          status: 'error',
          message: 'This reset link is missing required parameters. Please request a new one.',
        });
        setPhase('error');
      } catch (e: any) {
        console.error('[RESET] Fatal error:', e);
        setVerifyState({
          status: 'error',
          message: e?.message || 'Something went wrong verifying your link.',
        });
        setPhase('error');
      }
    };

    // Run immediately; if you have hydration issues on web, you can wrap in a small timeout.
    processResetLink();
  }, [params]);

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setPhase('updating');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please click the reset link again.');
        setPhase('ready');
        return;
      }

      console.log('[RESET] Updating password…');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('[RESET] updateUser error:', error);
        setError(`Password update failed: ${error.message}`);
        setPhase('ready');
        return;
      }

      console.log('[RESET] Password updated successfully');
      await supabase.auth.signOut();
      setPhase('success');

      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    } catch (e: any) {
      console.error('[RESET] Password update fatal:', e);
      setError('Failed to update password. Please try again.');
      setPhase('ready');
    }
  };

  const handleRequestNewReset = () => {
    router.replace('/auth/login');
  };

  if (phase === 'verifying' || verifyState.status === 'verifying') {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Verifying reset link…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'error' || verifyState.status === 'error') {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <AlertTriangle size={60} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Reset Link Issue</Text>
            <Text style={styles.errorText}>
              {verifyState.status === 'error'
                ? verifyState.message
                : 'Reset link is invalid or expired. Please request a new password reset.'}
            </Text>
            <CosmicButton
              title="Request New Reset"
              onPress={handleRequestNewReset}
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <CheckCircle size={80} color="#38d39f" />
            <Text style={styles.successTitle}>Password Updated!</Text>
            <Text style={styles.successText}>
              Your password has been changed successfully. Redirecting to login...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // phase === 'ready'
  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Key size={60} color="#d4af37" />
            <Text style={styles.title}>Set New Password</Text>
          </View>

          <LinearGradient
            colors={['rgba(26, 26, 46, 0.6)', 'rgba(26, 26, 46, 0.8)']}
            style={styles.formCard}
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 8 characters)"
                placeholderTextColor="#8b9dc3"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#8b9dc3"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
                onSubmitEditing={handlePasswordUpdate}
              />
            </View>

            <CosmicButton
              title={phase === 'updating' ? 'Updating Password...' : 'Update Password'}
              onPress={handlePasswordUpdate}
              disabled={phase === 'updating' || newPassword.length < 8}
              style={styles.updateButton}
            />
          </LinearGradient>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontFamily: 'Vazirmatn-Bold', color: '#e8e8e8', marginTop: 16, textAlign: 'center' },
  formCard: { borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', marginBottom: 24 },
  errorContainer: { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)' },
  errorMessage: { color: '#ff6b6b', fontSize: 14, fontFamily: 'Vazirmatn-Medium', textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8', marginBottom: 8 },
  input: { backgroundColor: 'rgba(26, 26, 46, 0.4)', borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)', borderRadius: 12, padding: 16, color: '#e8e8e8', fontSize: 16, fontFamily: 'Vazirmatn-Regular' },
  updateButton: { marginTop: 8 },
  loadingText: { color: '#d4af37', marginTop: 16, fontSize: 18, fontFamily: 'Vazirmatn-Medium' },
  errorTitle: { fontSize: 24, fontFamily: 'Vazirmatn-Bold', color: '#ff6b6b', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16, fontFamily: 'Vazirmatn-Regular', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  successTitle: { fontSize: 28, fontFamily: 'Vazirmatn-Bold', color: '#38d39f', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  successText: { color: '#e8e8e8', fontSize: 16, fontFamily: 'Vazirmatn-Regular', textAlign: 'center', lineHeight: 24 },
  button: { minWidth: 200 },
});
