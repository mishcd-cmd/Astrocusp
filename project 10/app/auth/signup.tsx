import React, { useRef, useState } from 'react';
import { 
  Platform, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import BirthdateField from '../../components/BirthdateField';
import { signUp, waitForSession } from '@/utils/auth';
import { absoluteRedirect } from '@/utils/urls';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [birthDateISO, setBirthDateISO] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const parseDateString = (dateString: string): Date => {
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      // Handle DD/MM/YYYY format
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    // Fallback to standard Date parsing
    return new Date(dateString);
  };

  const handleSignup = async () => {
    if (submittingRef.current || isLoading) {
      console.log('🚫 [signup] Preventing duplicate submission');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !name.trim() || !pwd) {
      setError('Please enter your name, email and password');
      return;
    }
    if (pwd.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (pwd !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    console.log('🚀 [signup] Starting signup process for:', cleanEmail);
    submittingRef.current = true;
    setIsLoading(true);
    
    try {
      // Use the birthDateISO state variable properly
      const birthDateForSignup = birthDateISO || undefined;
      
      console.log('Attempting signup with:', cleanEmail);
      const { user, error } = await signUp(cleanEmail, pwd, name.trim(), birthDateForSignup);
      if (error) {
        console.error('Signup failed:', error);
        // Handle existing user scenarios
        if (error.message.includes('User already registered') || error.message.includes('user_already_exists')) {
          Alert.alert(
            'Account Already Exists',
            `An account with this email already exists. This could mean:\n\n• You previously created an account\n• The account needs email verification\n• The account was created but not completed\n\nWould you like to try signing in instead?`,
            [
              { text: 'Try Sign In', onPress: () => router.push('/auth/login') },
              { text: 'Reset Password', onPress: () => handlePasswordReset(cleanEmail) },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        } else {
          setError(error.message);
        }
      } else {
        console.log('✅ Signup successful:', user?.email);
        
        // Force session refresh and wait for persistence
        console.log('⏳ [signup] Ensuring session persistence...');
        
        // Get the fresh session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('🔍 [signup] Fresh session after signup:', {
          hasSession: !!sessionData.session,
          hasAccessToken: !!sessionData.session?.access_token,
          hasRefreshToken: !!sessionData.session?.refresh_token,
          email: sessionData.session?.user?.email
        });
        
        // Wait for localStorage to be updated
        let sessionStored = false;
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const stored = localStorage.getItem('astro-cusp-auth-session');
          if (stored) {
            console.log(`✅ [signup] Session stored in localStorage after ${(i + 1) * 500}ms`);
            sessionStored = true;
            break;
          }
        }
        
        if (!sessionStored) {
          console.warn('⚠️ [signup] Session not stored in localStorage after 5 seconds');
        }
        
        console.log('✅ [signup] Signup successful, redirecting to astrology');
        router.replace('/(tabs)/astrology');
      }
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (emailAddress: string) => {
    try {
      console.log('[signup] Sending reset email to:', emailAddress);
      
      // Use Supabase's built-in reset function instead of custom one
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailAddress, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://www.astrocusp.com.au'}/auth/reset`,
      });
      
      if (resetError) {
        console.error('[signup] Reset failed:', resetError);
        
        Alert.alert(
          'Reset Email Failed',
          `Unable to send reset email: ${resetError.message}`
        );
      } else {
        console.log('[signup] Reset email sent successfully to:', emailAddress);
        Alert.alert(
          'Check Your Email',
          `We've sent a password reset link to ${emailAddress}. Please check your email and follow the instructions.`,
          [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
        );
      }
    } catch (error: any) {
      console.error('[signup] Reset email exception:', error);
      Alert.alert(
        'Reset Email Error',
        `An unexpected error occurred: ${error.message}`
      );
    }
  };

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={[styles.logo, styles.logoWithBackground]}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.title}>Astro Cusp</Text>
              <Text style={styles.subtitle}>Join the Cosmic Journey</Text>
              <Text style={styles.description}>Create your account to unlock personalized horoscopes</Text>
              
              <View style={styles.form}>
                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    nativeID="signup-email"
                    accessibilityLabel="Email"
                    autoComplete="email"
                    inputMode="email"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter your email"
                    placeholderTextColor="#8b9dc3"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    nativeID="signup-name"
                    accessibilityLabel="Name"
                    autoComplete="name"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#8b9dc3"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <BirthdateField
                    initialISO={birthDateISO}
                    onValidISO={setBirthDateISO}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    nativeID="signup-password"
                    accessibilityLabel="Password"
                    autoComplete="new-password"
                    style={styles.input}
                    value={pwd}
                    onChangeText={setPwd}
                    secureTextEntry
                    placeholder="Enter your password (min 8 characters)"
                    placeholderTextColor="#8b9dc3"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    nativeID="signup-confirm-password"
                    accessibilityLabel="Confirm Password"
                    autoComplete="new-password"
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry
                    placeholder="Confirm your password"
                    placeholderTextColor="#8b9dc3"
                    onSubmitEditing={handleSignup}
                  />
                </View>
                
                <CosmicButton
                  title={isLoading ? 'Creating Account...' : 'Create Account'}
                  onPress={handleSignup}
                  disabled={isLoading}
                  style={styles.signupButton}
                />
                
                <Pressable
                  style={styles.loginLink}
                  onPress={() => router.push('/auth/login')}
                >
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginTextBold}>Sign in</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  logoWithBackground: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  signupButton: {
    marginTop: 20,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
  },
  loginTextBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ff6b6b',
    textAlign: 'center',
  },
});