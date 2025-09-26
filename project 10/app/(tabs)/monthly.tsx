// app/(tabs)/monthly-forecast.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

import HoroscopeHeader from '@/components/HoroscopeHeader';
// Zodiac symbols mapping
const ZODIAC_ICON: Record<string, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎',
  Leo: '♌︎', Virgo: '♍︎', Libra: '♎︎', Scorpio: '♏︎',
  Sagittarius: '♐︎', Capricorn: '♑︎', Aquarius: '♒︎', Pisces: '♓︎',
};

import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';
import { getUserData, type UserProfile } from '@/utils/userData';
import { getLatestForecast } from '@/utils/forecasts';
import { getSubscriptionStatus } from '@/utils/billing';

type Meta = { 
  date?: string; 
  hemisphere?: string; 
  sign?: string;
} | null;

export default function MonthlyForecastScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastText, setForecastText] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  // Resolve what to show in the header immediately (even before we fetch)
  const resolvedSign = useMemo(() => {
    if (!user) return undefined;
    return user.cuspResult?.cuspName || user.cuspResult?.primarySign;
  }, [user]);

  const resolvedHemisphere = useMemo(() => {
    if (!user) return undefined;
    return user.hemisphere; // 'Northern' | 'Southern'
  }, [user]);

  const loadAll = useCallback(async () => {
    setError(null);
    setForecastText(null);
    setMeta(null);

    try {
      console.log('🔍 [monthly] Starting loadAll...');
      
      // 1) Load user (for sign + hemisphere)
      const u = await getUserData();
      
      console.log('🔍 [monthly] User data loaded:', {
        hasUser: !!u,
        email: u?.email,
        hasCuspResult: !!u?.cuspResult,
        isOnCusp: u?.cuspResult?.isOnCusp,
        cuspName: u?.cuspResult?.cuspName,
        primarySign: u?.cuspResult?.primarySign,
        hemisphere: u?.hemisphere
      });
      
      if (!u) {
        console.error('❌ [monthly] No user data found');
        setError('No user profile found. Please recalculate your cosmic position.');
        return;
      }

      setUser(u);

      // Check subscription status
      console.log('🔍 [monthly] Checking subscription status...');
      const subscriptionStatus = await getSubscriptionStatus();
      console.log('🔍 [monthly] Subscription status result:', subscriptionStatus);
      setHasAccess(subscriptionStatus.active);

      if (!subscriptionStatus.active) {
        console.log('ℹ️ [monthly] User does not have active subscription');
        setError(null);
        setForecastText(null);
        setMeta({
          sign: u.cuspResult?.cuspName || u.cuspResult?.primarySign || 'Your Sign',
          hemisphere: u.hemisphere,
          date: '2025-09-01'
        });
        return;
      }

      console.log('✅ [monthly] User has active subscription, proceeding with forecast fetch');
      const cuspName = u?.cuspResult?.cuspName || undefined;         // e.g. "Aries–Taurus Cusp"
      const primary = u?.cuspResult?.primarySign || undefined;       // e.g. "Aries"
      const secondary = u?.cuspResult?.secondarySign || undefined;   // e.g. "Taurus"
      const hemisphere = u?.hemisphere || undefined;                 // "Northern" | "Southern"

      if (!hemisphere) {
        setError('Missing hemisphere in your profile. Please update your location settings.');
        return;
      }

      // Order of attempts: cusp name (exact) → primary → secondary
      const attempts = Array.from(
        new Set([cuspName, primary, secondary].filter(Boolean))
      ) as string[];

      if (attempts.length === 0) {
        console.error('❌ [monthly] No valid signs found in user profile:', {
          cuspName,
          primary,
          secondary
        });
        setError('Missing astrological sign in your profile. Please complete your profile setup.');
        return;
      }

      let found: { text: string; m: Meta } | null = null;

      for (const signAttempt of attempts) {
        try {
          console.log('🔍 [monthly] Attempting forecast fetch for:', signAttempt, hemisphere);
          
          // Use the working forecast service
          const res = await getLatestForecast(signAttempt, hemisphere);
          
          console.log('🔍 [monthly] Forecast result:', {
            ok: res.ok,
            hasRow: !!res.row,
            reason: res.reason
          });

          if (res.ok && res.row?.monthly_forecast) {
            found = {
              text: res.row.monthly_forecast,
              m: {
                date: res.row.date,
                hemisphere: res.row.hemisphere,
                sign: res.row.sign || signAttempt,
              },
            };
            console.log('✅ [monthly] Found forecast for:', signAttempt);
            break;
          }
        } catch (attemptError) {
          console.warn(`[monthly-forecast] Failed attempt for ${signAttempt}:`, attemptError);
          // Continue to next attempt
        }
      }

      if (found) {
        setForecastText(found.text);
        setMeta(found.m);
        console.log('✅ [monthly] Successfully loaded forecast');
      } else {
        console.warn('⚠️ [monthly] No forecast found after all attempts:', {
          attempts,
          hemisphere
        });
        setError(`No forecast found for your sign${attempts.length > 1 ? 's' : ''} (${attempts.join(', ')}) in the ${hemisphere} hemisphere. Check back soon for updates.`);
      }
    } catch (e: any) {
      console.error('[monthly-forecast] load error:', e);
      setError(e?.message || 'Something went wrong fetching the monthly forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } catch (e) {
      console.error('[monthly-forecast] refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/horoscope');
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    loadAll();
  }, [loadAll]);

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  // Get zodiac symbol for display
  const getZodiacSymbol = (signLabel: string): string => {
    // Check if it's a cusp sign
    const isCusp = signLabel?.includes('–') || signLabel?.includes('-');
    
    if (isCusp) {
      // For cusp signs, show both symbols
      const parts = signLabel?.split(/\s*[–-]\s*/);
      const firstSign = parts?.[0]?.trim();
      const secondSign = parts?.[1]?.replace(/\s*Cusp.*$/i, '').trim();
      
      const firstIcon = ZODIAC_ICON[firstSign] ?? '✨';
      const secondIcon = ZODIAC_ICON[secondSign] ?? '✨';
      
      return `${firstIcon}${secondIcon}`;
    } else {
      // For pure signs, show single symbol
      const baseSign = signLabel?.split(/\s/)?.[0]?.trim() || '';
      return ZODIAC_ICON[baseSign] ?? '✨';
    }
  };

  // ----- RENDER -----
  if (loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.muted}>Loading your monthly forecast…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#d4af37"
              colors={['#d4af37']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backRow} onPress={goBack}>
            <ArrowLeft size={22} color="#8b9dc3" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>✨</Text>
            <Text style={styles.headerTitle}>Monthly Forecast</Text>
            <Text style={styles.headerSubtitle}>{meta?.sign || resolvedSign || 'Your Sign'}</Text>
          </View>

          <LinearGradient
            colors={['rgba(212, 175, 55, 0.18)', 'rgba(139, 157, 195, 0.10)']}
            style={styles.card}
          >
            <View style={styles.header}>
              <Text style={styles.headerLabel}>Sign</Text>
              <Text style={styles.headerValue}>
                {/* Prefer what matched in the DB (meta.sign), then the user's resolved sign */}
                {meta?.sign || resolvedSign || 'Loading...'}
              </Text>
            </View>

            <View style={styles.headerRow}>
              <View style={styles.headerItem}>
                <Text style={styles.headerSmallLabel}>Hemisphere</Text>
                <Text style={styles.headerSmallValue}>
                  {meta?.hemisphere || resolvedHemisphere || 'Loading...'}
                </Text>
              </View>
              <View style={styles.headerItem}>
                <Text style={styles.headerSmallLabel}>Month</Text>
                <Text style={styles.headerSmallValue}>
                  {meta?.date
                    ? new Date(meta.date).toLocaleDateString('en-AU', { 
                        year: 'numeric', 
                        month: 'long' 
                      })
                    : 'Loading...'}
                </Text>
              </View>
            </View>

            {!hasAccess && user ? (
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.upgradeContainer}
              >
                <View style={styles.upgradeHeader}>
                  <Text style={styles.upgradeIcon}>👑</Text>
                  <Text style={styles.upgradeTitle}>Unlock Monthly Forecasts</Text>
                </View>
                <Text style={styles.upgradeDescription}>
                  Get detailed monthly cosmic forecasts tailored to your {meta?.sign || 'sign'} energy and {meta?.hemisphere || 'hemisphere'} location.
                </Text>
                <View style={styles.upgradeFeatures}>
                  <Text style={styles.upgradeFeature}>✨ Comprehensive monthly guidance</Text>
                  <Text style={styles.upgradeFeature}>🌙 Lunar cycle timing</Text>
                  <Text style={styles.upgradeFeature}>🌍 Hemisphere-specific insights</Text>
                  <Text style={styles.upgradeFeature}>🔮 Cusp-specific forecasts</Text>
                </View>
                <CosmicButton
                  title="Upgrade to Astral Plane"
                  onPress={handleUpgrade}
                  style={styles.upgradeButton}
                />
              </LinearGradient>
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : forecastText ? (
              <View style={styles.forecastContainer}>
                <Text style={styles.forecastText}>{forecastText}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.muted}>No forecast available.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  safeArea: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 32,
    flexGrow: 1,
  },
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
  },

  backRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    gap: 8,
  },
  backText: { 
    color: '#8b9dc3', 
    fontSize: 16, 
    fontFamily: 'Inter-Medium',
  },

  title: {
    fontSize: 28,
    color: '#e8e8e8',
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },

  symbolContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  zodiacSymbol: {
    fontSize: 48,
    color: '#d4af37',
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
    } : {
      textShadowColor: 'rgba(212, 175, 55, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    }),
  },

  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  header: { 
    alignItems: 'center', 
    marginBottom: 12,
  },
  headerLabel: { 
    color: '#8b9dc3', 
    fontSize: 12, 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerValue: { 
    color: '#d4af37', 
    fontSize: 22, 
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },

  headerRow: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 16,
  },
  headerItem: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.35)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.25)',
    alignItems: 'center',
  },
  headerSmallLabel: { 
    color: '#8b9dc3', 
    fontSize: 11, 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerSmallValue: { 
    color: '#e8e8e8', 
    fontSize: 14, 
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },

  forecastContainer: {
    marginTop: 8,
  },
  forecastText: { 
    color: '#e8e8e8', 
    fontSize: 16, 
    lineHeight: 26, 
    fontFamily: 'Inter-Regular',
    textAlign: 'left',
  },

  muted: { 
    color: '#8b9dc3', 
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  errorBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    alignItems: 'center',
  },
  errorText: { 
    color: '#ff6b6b', 
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  retryButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#d4af37',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  upgradeContainer: {
    marginTop: 8,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  upgradeFeatures: {
    gap: 8,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  upgradeFeature: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    minWidth: 200,
  },
  headerCenter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 6,
    color: '#d4af37',
  },
  headerTitle: {
    fontSize: 26,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#8b9dc3',
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
  },
});