// app/settings.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, User as UserIcon, Mail, MapPin, Calendar as CalendarIcon, Clock, LogOut, Trash2, Key, Save, X, Crown, CreditCard as Edit3 } from 'lucide-react-native';

import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';

import { supabase } from '@/utils/supabase';
import { getCurrentUser, signOut } from '@/utils/auth';
import { getUserData, clearUserData, type UserProfile } from '@/utils/userData';
import { getCurrentPlanName } from '@/utils/stripe';
import { ensureFreshUser } from '@/utils/authGuard';

export default function SettingsScreen() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('Free Plan');
  const [authError, setAuthError] = useState<string | null>(null);

  // password editing state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const load = async () => {
      try {
        console.log('🔍 [settings] Starting data load...');
        
        // First ensure we have a fresh user session
        await ensureFreshUser();
        
        // Check authentication
        const authUser = await getCurrentUser();
        if (!authUser) {
          console.log('❌ [settings] No authenticated user found');
          setAuthError('Please sign in to view your settings');
          return;
        }
        
        console.log('✅ [settings] Authenticated user:', authUser.email);
        
        const [data, _authUser, planName] = await Promise.all([
          getUserData(),
          Promise.resolve(authUser), // Use the already fetched user
          getCurrentPlanName(),
        ]);
        
        if (!isMounted.current) return;
        
        console.log('🔍 [settings] Data loaded:', {
          hasUserData: !!data,
          email: data?.email,
          planName
        });
        
        setUserData(data);
        setCurrentPlan(planName);
      } catch (e) {
        console.error('❌ [settings] Error loading user data:', e);
        if (isMounted.current) {
          setAuthError('Failed to load user data. Please try refreshing or signing in again.');
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  const handleRetryLoad = async () => {
    setIsLoading(true);
    setAuthError(null);
    setError(null);
    
    try {
      // Clear any stale cache and retry
      await clearUserData();
      await ensureFreshUser();
      
      const authUser = await getCurrentUser();
      if (!authUser) {
        setAuthError('Authentication failed. Please sign in again.');
        return;
      }
      
      const [data, planName] = await Promise.all([
        getUserData(true), // Force fresh fetch
        getCurrentPlanName(),
      ]);
      
      setUserData(data);
      setCurrentPlan(planName);
      
      if (!data) {
        setAuthError('No profile found. Please complete your cosmic profile setup.');
      }
    } catch (e) {
      console.error('❌ [settings] Retry failed:', e);
      setAuthError('Failed to load data. Please try signing out and back in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/auth/login');
  };

  const handleGoToCalculator = () => {
    router.push('/(tabs)/find-cusp');
  };

  const handleLogout = () => {
    setIsLoading(true);
    (async () => {
      try {
        await Promise.all([signOut(), clearUserData()]);
        
        router.replace('/auth/login');
      } catch (e) {
        console.error('Logout error:', e);
        // Still redirect even if there's an error
        router.replace('/auth/login');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setError(
              'Account deletion will be available in a future update. Please contact support if needed.'
            ),
        },
      ]
    );
  };

  const handleChangePassword = () => {
    setIsEditingPassword(true);
    setPasswordError(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCancelPasswordChange = () => {
    setIsEditingPassword(false);
    setPasswordError(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter both password fields');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) {
        setPasswordError(updateErr.message);
      } else {
        Alert.alert('Success', 'Your password has been updated successfully');
        setIsEditingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (e: any) {
      setPasswordError(e?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/find-cusp');
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // --------- Loading / Empty states ----------
  if (isLoading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Loading your cosmic profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Handle authentication errors
  if (authError) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centeredMessage}>
            <Text style={styles.errorHeading}>Settings Unavailable</Text>
            <Text style={styles.errorDescription}>{authError}</Text>
            
            <View style={styles.errorActions}>
              <CosmicButton 
                title="Try Again" 
                onPress={handleRetryLoad}
                style={styles.errorButton}
              />
              <CosmicButton 
                title="Sign In" 
                onPress={handleGoToLogin}
                variant="outline"
                style={styles.errorButton}
              />
              <CosmicButton 
                title="Complete Profile" 
                onPress={handleGoToCalculator}
                variant="secondary"
                style={styles.errorButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centeredMessage}>
            <Text style={styles.errorHeading}>Profile Setup Required</Text>
            <Text style={styles.errorDescription}>
              Your cosmic profile needs to be completed to access settings.
            </Text>
            
            <View style={styles.errorActions}>
              <CosmicButton 
                title="Complete Profile" 
                onPress={handleGoToCalculator}
                style={styles.errorButton}
              />
              <CosmicButton 
                title="Try Again" 
                onPress={handleRetryLoad}
                variant="outline"
                style={styles.errorButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --------- Main render ----------
  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#8b9dc3" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Cosmic Profile</Text>

            {/* Current Plan */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Crown size={24} color="#d4af37" />
                <Text style={styles.cardTitle}>Current Plan</Text>
              </View>
              <Text style={styles.planName}>{currentPlan}</Text>
            </LinearGradient>

            {/* Error message (if any) */}
            {error && (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>{error}</Text>
              </View>
            )}

            {/* Profile Information */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <UserIcon size={24} color="#d4af37" />
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>

              <View style={styles.infoRow}>
                <Mail size={16} color="#8b9dc3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <UserIcon size={16} color="#8b9dc3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{userData.name}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Birth Information */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <CalendarIcon size={24} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Birth Details</Text>
              </View>

              <View style={styles.infoRow}>
                <CalendarIcon size={16} color="#8b9dc3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Birth Date</Text>
                  <Text style={styles.infoValue}>{formatDate(userData.birthDate)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Clock size={16} color="#8b9dc3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Birth Time</Text>
                  <Text style={styles.infoValue}>{userData.birthTime}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={16} color="#8b9dc3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Birth Location</Text>
                  <Text style={styles.infoValue}>{userData.birthLocation}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.hemisphereIcon}>
                  <Text style={styles.hemisphereEmoji}>🌍</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hemisphere</Text>
                  <Text style={styles.infoValue}>{userData.hemisphere}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Cosmic Profile */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.25)', 'rgba(139, 157, 195, 0.15)']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cosmicSymbol}>✨</Text>
                <Text style={styles.cardTitle}>Your Cosmic Position</Text>
              </View>

              <View style={styles.cosmicInfo}>
                <Text style={styles.cosmicLabel}>
                  {userData.cuspResult.isOnCusp ? 'Cusp Sign' : 'Zodiac Sign'}
                </Text>
                <Text style={styles.cosmicValue}>
                  {userData.cuspResult.cuspName || userData.cuspResult.primarySign}
                </Text>
                {!!userData.cuspResult.secondarySign && (
                  <Text style={styles.cosmicSecondary}>
                    Blending {userData.cuspResult.primarySign} & {userData.cuspResult.secondarySign}
                  </Text>
                )}
              </View>

              <View style={styles.sunPosition}>
                <Text style={styles.sunLabel}>Sun Position</Text>
                <Text style={styles.sunValue}>
                  {userData.cuspResult.sunDegree}° {userData.cuspResult.primarySign}
                </Text>
              </View>
            </LinearGradient>

            {/* Password Change */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Key size={24} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Security</Text>
              </View>

              {!isEditingPassword ? (
                <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
                  <Edit3 size={16} color="#8b9dc3" />
                  <Text style={styles.changePasswordText}>Change Password</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordChangeForm}>
                  {!!passwordError && (
                    <View style={styles.bannerError}>
                      <Text style={styles.bannerErrorText}>{passwordError}</Text>
                    </View>
                  )}

                  <View style={styles.passwordInputContainer}>
                    <Text style={styles.passwordLabel}>New Password</Text>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      placeholder="Enter new password (min 8 characters)"
                      placeholderTextColor="#8b9dc3"
                    />
                  </View>

                  <View style={styles.passwordInputContainer}>
                    <Text style={styles.passwordLabel}>Confirm Password</Text>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      placeholder="Confirm new password"
                      placeholderTextColor="#8b9dc3"
                    />
                  </View>

                  <View style={styles.passwordActions}>
                    <TouchableOpacity
                      style={styles.passwordActionButton}
                      onPress={handleCancelPasswordChange}
                      disabled={passwordLoading}
                    >
                      <X size={16} color="#8b9dc3" />
                      <Text style={styles.passwordActionText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.passwordActionButton, styles.savePasswordButton]}
                      onPress={handleSavePassword}
                      disabled={passwordLoading}
                    >
                      <Save size={16} color="#d4af37" />
                      <Text style={[styles.passwordActionText, styles.savePasswordText]}>
                        {passwordLoading ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </LinearGradient>

            {/* Account Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsTitle}>Account Actions</Text>

              <TouchableOpacity style={styles.actionRowButton} onPress={handleEditProfile}>
                <Edit3 size={20} color="#8b9dc3" />
                <Text style={styles.actionText}>Update Birth Details</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={[styles.actionRowButton, styles.dangerButton]}
                onPress={handleDeleteAccount}
              >
                <Trash2 size={20} color="#ff6b6b" />
                <Text style={[styles.actionText, styles.dangerText]}>Delete Account</Text>
              </TouchableOpacity>
            </View>

            {/* Account Info */}
            <View style={styles.accountInfo}>
              <Text style={styles.accountInfoText}>Member since {formatDate(userData.createdAt)}</Text>
              {!!userData.lastLoginAt && (
                <Text style={styles.accountInfoText}>Last login: {formatDate(userData.lastLoginAt)}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  content: { flex: 1, paddingTop: 20 },

  // header / nav
  backButton: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
  backText: { fontSize: 18, fontFamily: 'Inter-Medium', color: '#8b9dc3', marginLeft: 8 },

  title: {
    fontSize: 40,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 2,
  },

  // cards
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#e8e8e8', marginLeft: 12 },

  // plan
  planName: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
  },

  // info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoContent: { marginLeft: 12, flex: 1 },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8' },

  // hemisphere
  hemisphereIcon: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  hemisphereEmoji: { fontSize: 16 },

  // cosmic section
  cosmicSymbol: { fontSize: 24, marginRight: 8 },
  cosmicInfo: { alignItems: 'center', marginBottom: 20 },
  cosmicLabel: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cosmicValue: {
    fontSize: 24,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 4,
  },
  cosmicSecondary: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', textAlign: 'center', fontStyle: 'italic' },
  sunPosition: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.2)' },
  sunLabel: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sunValue: { fontSize: 16, fontFamily: 'Vazirmatn-SemiBold', color: '#d4af37' },

  // password edit
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(139, 157, 195, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  changePasswordText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#8b9dc3', marginLeft: 8 },

  passwordChangeForm: { gap: 16 },
  passwordInputContainer: { gap: 8 },
  passwordLabel: { fontSize: 16, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8' },
  passwordInput: {
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  passwordActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  passwordActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  savePasswordButton: { borderColor: 'rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  passwordActionText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#8b9dc3', marginLeft: 6 },
  savePasswordText: { color: '#d4af37' },

  // actions
  actionsSection: { marginBottom: 32 },
  actionsTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', marginBottom: 16 },
  actionRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  actionText: { fontSize: 18, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8', marginLeft: 12 },
  dangerButton: { borderColor: 'rgba(255, 107, 107, 0.3)', backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  dangerText: { color: '#ff6b6b' },

  // banners / misc
  bannerError: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  bannerErrorText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#ff6b6b', textAlign: 'center' },

  accountInfo: { alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(139, 157, 195, 0.2)' },
  accountInfoText: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', marginBottom: 4, opacity: 0.8 },

  // loading / empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#8b9dc3', marginTop: 12 },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorHeading: { fontSize: 20, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8', marginBottom: 24 },
  errorDescription: { 
    fontSize: 16, 
    fontFamily: 'Vazirmatn-Regular', 
    color: '#8b9dc3', 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 22,
  },
  errorActions: { 
    gap: 16, 
    width: '100%', 
    maxWidth: 300,
  },
  errorButton: { 
    minWidth: 200,
  },
});