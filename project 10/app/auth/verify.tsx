import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle, Mail } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import { supabase } from '@/utils/supabase';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for email verification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change during verification:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('Email verified and user signed in');
        setVerified(true);
        setVerifying(false);
        
        // Redirect to cusp calculator after successful verification
        setTimeout(() => {
          router.replace('/(tabs)/find-cusp');
        }, 2000);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed during verification');
        setVerified(true);
        setVerifying(false);
      }
    });

    // Check if user is already verified
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User already verified');
          setVerified(true);
          setVerifying(false);
          router.replace('/(tabs)/find-cusp');
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        setError('Failed to check verification status');
        setVerifying(false);
      }
    };

    checkVerification();

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  const handleResendEmail = async () => {
    try {
      // This would require the user's email - for now just redirect to signup
      router.replace('/auth/signup');
    } catch (error) {
      console.error('Error resending email:', error);
    }
  };

  if (verified) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.successIcon}>
              <CheckCircle size={80} color="#8bc34a" />
            </View>

            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.subtitle}>
              Welcome to Astro Cusp! Your account has been verified successfully.
            </Text>

            <LinearGradient
              colors={['rgba(139, 195, 74, 0.2)', 'rgba(139, 195, 74, 0.1)']}
              style={styles.successCard}
            >
              <Text style={styles.successText}>
                You're all set! Redirecting you to calculate your cosmic position...
              </Text>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.errorIcon}>
              <Mail size={60} color="#ff6b6b" />
            </View>

            <Text style={styles.title}>Verification Error</Text>
            <Text style={styles.errorText}>{error}</Text>

            <CosmicButton
              title="Back to Login"
              onPress={handleGoToLogin}
              style={styles.button}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Mail size={60} color="#d4af37" />
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent you a verification link. Please check your email and click the link to verify your account.
          </Text>

          {verifying && (
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.verifyingCard}
            >
              <ActivityIndicator size="large" color="#d4af37" />
              <Text style={styles.verifyingText}>
                Waiting for email verification...
              </Text>
              <Text style={styles.verifyingSubtext}>
                Click the link in your email to continue
              </Text>
            </LinearGradient>
          )}

          <View style={styles.actionButtons}>
            <CosmicButton
              title="Resend Email"
              onPress={handleResendEmail}
              variant="outline"
              style={styles.button}
            />
            
            <CosmicButton
              title="Back to Login"
              onPress={handleGoToLogin}
              variant="secondary"
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  successIcon: {
    marginBottom: 32,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  errorIcon: {
    marginBottom: 32,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  verifyingCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
  },
  verifyingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
    marginTop: 16,
    textAlign: 'center',
  },
  verifyingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginTop: 8,
    textAlign: 'center',
  },
  successCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    width: '100%',
    maxWidth: 400,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ff6b6b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButtons: {
    gap: 16,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    minWidth: 200,
  },
});