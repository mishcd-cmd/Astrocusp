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
  TouchableOpacity,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import { signIn, resetPassword } from '@/utils/auth';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill email if passed from reset flow
  React.useEffect(() => {
    if (params.email && typeof params.email === 'string') {
      setEmail(params.email);
    }
  }, [params.email]);
  const handleLogin = async () => {
    if (submittingRef.current || isLoading) {
      console.log('🚫 [login] Preventing duplicate submission');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pwd) {
      setError('Please enter an email and password');
      return;
    }

    setError(null);
    console.log('🚀 [login] Starting login process for:', cleanEmail);
    submittingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', cleanEmail);
      const { user, error } = await signIn(cleanEmail, pwd);
      if (error) {
        console.error('Login failed:', error);
        
        // Handle specific account issues
        if (error.message?.includes('Invalid login credentials')) {
          Alert.alert(
            'Login Failed',
            'The email or password appears to be incorrect.\n\nWould you like to reset your password?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Reset Password', 
                onPress: () => handlePasswordReset(cleanEmail)
              }
            ]
          );
        } else {
          setError(error.message);
        }
      } else {
        console.log('✅ Login successful:', user?.email);
        router.replace('/(tabs)/astrology');
      }
    } catch (error: any) {
      console.error('❌ [login] Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (emailAddress: string) => {
    try {
      console.log('[login] Sending reset email to:', emailAddress);
      
      setResetLoading(true);
      
      const { error: resetError } = await resetPassword(emailAddress);
      
      if (resetError) {
        console.error('[login] Reset failed:', resetError);
        Alert.alert(
          'Reset Email Failed',
          `Unable to send reset email: ${resetError.message}`
        );
      } else {
        console.log('[login] Reset email sent successfully to:', emailAddress);
        Alert.alert(
          'Check Your Email',
          `We've sent a password reset link to ${emailAddress}.\n\nPlease check your email (including spam folder) and click the link to reset your password.\n\nThe reset link will take you back to this app where you can set your new password.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[login] Reset email exception:', error);
      Alert.alert(
        'Reset Email Error',
        `An unexpected error occurred: ${error.message}`
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    await handlePasswordReset(cleanEmail);
  };

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Text style={styles.appName}>ASTRO CUSP</Text>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to access your cosmic journey</Text>

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
                    nativeID="login-email"
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
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    nativeID="login-password"
                    accessibilityLabel="Password"
                    autoComplete="current-password"
                    style={styles.input}
                    value={pwd}
                    onChangeText={setPwd}
                    secureTextEntry
                    placeholder="Enter your password"
                    placeholderTextColor="#8b9dc3"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                
                <CosmicButton
                  title={isLoading ? 'Signing In...' : 'Sign In'}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={styles.loginButton}
                />
                
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                >
                  <Text style={styles.forgotPasswordText}>
                    {resetLoading ? 'Sending reset email...' : 'Forgot Password?'}
                  </Text>
                </TouchableOpacity>
                
                <Pressable
                  style={styles.signupLink}
                  onPress={() => router.push('/auth/signup')}
                >
                  <Text style={styles.signupText}>
                    Don't have an account? <Text style={styles.signupTextBold}>Create Account</Text>
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
  appName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    letterSpacing: 3,
    marginBottom: 16,
    textAlign: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 40,
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  loginButton: {
    marginTop: 20,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    textDecorationLine: 'underline',
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
  },
  signupTextBold: {
    fontFamily: 'Vazirmatn-SemiBold',
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
    fontFamily: 'Vazirmatn-Medium',
    color: '#ff6b6b',
    textAlign: 'center',
  },
});