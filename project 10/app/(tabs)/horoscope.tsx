import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Star,
  Moon,
  Eye,
  Crown,
  Telescope,
  Gem,
  Settings,
  User,
  Sparkles,
} from 'lucide-react-native';

import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import MysticMish from '../../components/MysticMish';
import HoroscopeHeader from '../../components/HoroscopeHeader';

import { getUserData, type UserProfile } from '../../utils/userData';
import { getSubscriptionStatus } from '../../utils/billing';
import { getAccessibleHoroscope, type HoroscopeData } from '../../utils/horoscopeData';
import { getHemisphereEvents, getCurrentPlanetaryPositionsEnhanced } from '../../utils/astronomy';
import { getLunarNow } from '../../utils/lunar';
import { getCuspGemstoneAndRitual } from '../../utils/cuspData';
import { translateText, getUserLanguage, type SupportedLanguage } from '../../utils/translation';
import { getDefaultSignFromUserData } from '../../utils/signs';

/* -------------------------
 * Safe string helpers
 * ------------------------- */
function asString(v: any): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function stripVersionSuffix(v?: string) {
  const s = asString(v).trim();
  // remove trailing " V3" style tags if present
  return s.replace(/\s*V\d+\s*$/i, '').trim();
}

export default function HoroscopeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sign?: string; hemisphere?: string }>();

  // ----- internal guards -----
  const initOnce = useRef(false);         // prevents the init effect from running twice
  const inFlight = useRef(false);         // prevents overlapping async calls
  const lastSubCheck = useRef<number>(0); // throttle billing checks

  // ----- state -----
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedSign, setSelectedSign] = useState<string>('');
  const [selectedHemisphere, setSelectedHemisphere] = useState<'Northern' | 'Southern'>('Northern');
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [astronomicalEvents, setAstronomicalEvents] = useState<any[]>([]);
  const [planetaryPositions, setPlanetaryPositions] = useState<any[]>([]); // reserved (if you show them later)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [translatedContent, setTranslatedContent] = useState<any>({});

  // Resolve header values (fast)
  const resolvedSign = useMemo(() => {
    // 1. Route param takes highest priority
    if (params.sign) {
      const decoded = decodeURIComponent(asString(params.sign));
      console.log('🎯 [horoscope] Using route param sign:', decoded);
      return decoded;
    }
    
    // 2. User profile for ALL users (subscribed and non-subscribed)
    if (!user) return undefined;
    const profileSign = getDefaultSignFromUserData(user);
    console.log('🎯 [horoscope] Using profile sign:', profileSign);
    return profileSign;
  }, [user, params.sign]);

  const resolvedHemisphere = useMemo<'Northern' | 'Southern'>(() => {
    const p = asString(params.hemisphere);
    if (p) return decodeURIComponent(p) as 'Northern' | 'Southern';
    return (user?.hemisphere as 'Northern' | 'Southern') || 'Northern';
  }, [user, params.hemisphere]);

  // ----- one-time init effect -----
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    let cancelled = false;

    const fetchAll = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log('🚀 [horoscope] Starting one-time init...');

        // 1) Load user once
        const u = await getUserData();
        if (cancelled) return;

        // Only set state if changed (avoid re-render loops)
        setUser(prev => {
          const same =
            !!prev &&
            prev.email === u?.email &&
            prev.hemisphere === u?.hemisphere &&
            prev.cuspResult?.cuspName === u?.cuspResult?.cuspName &&
            prev.cuspResult?.primarySign === u?.cuspResult?.primarySign;
          return same ? prev : u;
        });

        // 2) Throttled subscription check (2 min)
        const now = Date.now();
        if (now - lastSubCheck.current > 120_000) {
          lastSubCheck.current = now;
          const sub = await getSubscriptionStatus();
          if (!cancelled) {
            console.log('🔍 [horoscope] Subscription status:', sub);
            setHasAccess(!!sub?.active);
          }
        }

        // 3) Compute sign + hemisphere
        const signParam = asString(params.sign) ? decodeURIComponent(asString(params.sign)) : '';
        const hemiParam = asString(params.hemisphere)
          ? (decodeURIComponent(asString(params.hemisphere)) as 'Northern' | 'Southern')
          : '';

        const sign =
          signParam ||
          u?.cuspResult?.cuspName ||
          u?.cuspResult?.primarySign ||
          asString(resolvedSign);

        const hemi = (hemiParam || (u?.hemisphere as 'Northern' | 'Southern') || 'Northern') as
          | 'Northern'
          | 'Southern';

        if (!cancelled) {
          setSelectedSign(sign || '');
          setSelectedHemisphere(hemi);
        }

        // 4) Fail fast if absolutely no sign anywhere
        if (!sign && !u?.cuspResult) {
          if (!cancelled) {
            setError('No cosmic profile found. Please calculate your cusp first.');
            setReady(true);
          }
          return;
        }

        // 5) Load horoscope for resolved sign
        if (sign) {
          console.log('🔍 [horoscope] Fetching horoscope for:', { sign, hemisphere: hemi });
          const data = await getAccessibleHoroscope(new Date(), sign, hemi);
          console.log('📊 [horoscope] Horoscope data received:', {
            hasDaily: !!data?.daily,
            hasAffirmation: !!data?.affirmation,
            hasDeeper: !!data?.deeper,
            hasMysticOpening: !!data?.mysticOpening,
            hasCelestialInsight: !!data?.celestialInsight,
            hasMonthlyForecast: !!data?.monthlyForecast,
            hasAccess: data?.hasAccess
          });
          if (!cancelled) setHoroscope(data || null);
        }

        // 6) Astronomical context
        const lunar = getLunarNow(hemi);
        const events = getHemisphereEvents(hemi);
        const positions = await getCurrentPlanetaryPositionsEnhanced(hemi);

        if (!cancelled) {
          setMoonPhase(lunar);
          setAstronomicalEvents(events);
          setPlanetaryPositions(positions);
        }

        // 7) Language preference
        const language = await getUserLanguage();
        if (!cancelled) setCurrentLanguage(language);

        console.log('✅ [horoscope] Init complete');
      } catch (e: any) {
        console.error('❌ [horoscope] Init error:', e);
        if (!cancelled) setError(e?.message || 'Failed to load horoscope.');
      } finally {
        if (!cancelled) {
          inFlight.current = false;
          setLoading(false);
          setReady(true);
        } else {
          inFlight.current = false;
        }
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Translation effect (separate from main init)
  useEffect(() => {
    const run = async () => {
      if (currentLanguage !== 'zh' || !horoscope) {
        setTranslatedContent({});
        return;
      }
      try {
        const translations: any = {};
        if (horoscope.daily) {
          translations.daily = await translateText(asString(horoscope.daily), currentLanguage, hasAccess);
        }
        if (horoscope.affirmation) {
          translations.affirmation = await translateText(
            stripVersionSuffix(horoscope.affirmation),
            currentLanguage,
            hasAccess
          );
        }
        if (horoscope.deeper) {
          translations.deeper = await translateText(
            stripVersionSuffix(horoscope.deeper),
            currentLanguage,
            hasAccess
          );
        }
        if (horoscope.mysticOpening) {
          translations.mysticOpening = await translateText(
            asString(horoscope.mysticOpening),
            currentLanguage,
            hasAccess
          );
        }
        setTranslatedContent(translations);
      } catch (error) {
        console.error('Translation error:', error);
        // fall back to originals
        setTranslatedContent({
          daily: asString(horoscope.daily),
          affirmation: stripVersionSuffix(horoscope.affirmation),
          deeper: stripVersionSuffix(horoscope.deeper),
          mysticOpening: asString(horoscope.mysticOpening),
        });
      }
    };
    run();
  }, [currentLanguage, horoscope, hasAccess]);

  const getDisplayText = (original?: string) => {
    const base = asString(original);
    if (currentLanguage !== 'zh') return base;

    // Check if we have a translation for this text
    if (horoscope?.daily && base === asString(horoscope.daily)) {
      return translatedContent.daily || base;
    }
    if (horoscope?.affirmation && base === stripVersionSuffix(horoscope.affirmation)) {
      return translatedContent.affirmation || base;
    }
    if (horoscope?.deeper && base === stripVersionSuffix(horoscope.deeper)) {
      return translatedContent.deeper || base;
    }
    if (horoscope?.mysticOpening && base === asString(horoscope.mysticOpening)) {
      return translatedContent.mysticOpening || base;
    }
    
    return base;
  };

  // Refresh
  const onRefresh = async () => {
    if (inFlight.current) return; // Prevent overlapping refreshes
    setRefreshing(true);
    try {
      if (selectedSign) {
        const data = await getAccessibleHoroscope(new Date(), selectedSign, selectedHemisphere);
        setHoroscope(data || null);
      }
      // light sub re-check (throttled)
      const now = Date.now();
      if (now - lastSubCheck.current > 120_000) {
        lastSubCheck.current = now;
        const sub = await getSubscriptionStatus();
        setHasAccess(!!sub?.active);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh horoscope.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignSelection = (sign: string, hemisphere: 'Northern' | 'Southern') => {
    if (inFlight.current) return;
    setSelectedSign(sign);
    setSelectedHemisphere(hemisphere);
    setTimeout(() => onRefresh(), 100);
  };

  const handleUpgrade = () => router.push('/subscription');
  const handleSettings = () => router.push('/(tabs)/settings');
  const handleAccount = () => router.push('/settings');

  // ----- RENDER -----
  if (!ready || loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Loading cosmic guidance…</Text>
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <CosmicButton
              title="Calculate Your Cusp"
              onPress={() => router.push('/(tabs)/find-cusp')}
              style={styles.errorButton}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isCusp = asString(selectedSign).toLowerCase().includes('cusp');

  console.log('🔍 [horoscope] Render state:', {
    resolvedSign,
    resolvedHemisphere,
    selectedSign,
    selectedHemisphere,
    hasUser: !!user,
    hasCuspResult: !!user?.cuspResult,
    userEmail: user?.email,
  });

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <MysticMish hemisphere={selectedHemisphere} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" colors={['#d4af37']} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <HoroscopeHeader signLabel={resolvedSign || selectedSign || 'Select your sign'} />
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
                <Settings size={24} color="#8b9dc3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleAccount}>
                <User size={24} color="#8b9dc3" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.hemisphereDisplay}>{selectedHemisphere} Hemisphere</Text>

          {/* Hemisphere Toggle */}
          <View style={styles.hemisphereToggle}>
            <TouchableOpacity
              style={[styles.hemisphereButton, selectedHemisphere === 'Northern' && styles.hemisphereButtonActive]}
              onPress={() => handleSignSelection(selectedSign, 'Northern')}
            >
              <Text style={[styles.hemisphereButtonText, selectedHemisphere === 'Northern' && styles.hemisphereButtonTextActive]}>
                Northern
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hemisphereButton, selectedHemisphere === 'Southern' && styles.hemisphereButtonActive]}
              onPress={() => handleSignSelection(selectedSign, 'Southern')}
            >
              <Text style={[styles.hemisphereButtonText, selectedHemisphere === 'Southern' && styles.hemisphereButtonTextActive]}>
                Southern
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily Horoscope */}
          {horoscope?.daily && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.horoscopeCard}>
              <View style={styles.cardHeader}>
                <Star size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Today's Guidance</Text>
              </View>
              <Text style={styles.horoscopeText}>{getDisplayText(horoscope.daily)}</Text>
            </LinearGradient>
          )}

          {/* Premium Content */}
          {hasAccess && asString(horoscope?.affirmation) !== '' && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Sparkles size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Daily Affirmation</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              <Text style={styles.affirmationText}>{getDisplayText(stripVersionSuffix(horoscope?.affirmation))}</Text>
            </LinearGradient>
          )}

          {/* Mystic Opening for Cusps */}
          {hasAccess && isCusp && asString(horoscope?.mysticOpening) !== '' && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.25)', 'rgba(212, 175, 55, 0.15)']} style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Eye size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Mystic Opening</Text>
                <View style={styles.cuspBadge}>
                  <Text style={styles.cuspBadgeText}>CUSP</Text>
                </View>
              </View>
              <Text style={styles.mysticText}>{getDisplayText(stripVersionSuffix(horoscope?.mysticOpening))}</Text>
            </LinearGradient>
          )}

          {/* Astral Plane (Deeper Insights) */}
          {hasAccess && asString(horoscope?.deeper) !== '' && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Crown size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Daily Astral Plane</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              <Text style={styles.deeperText}>{getDisplayText(stripVersionSuffix(horoscope?.deeper))}</Text>
            </LinearGradient>
          )}

          {/* Cusp Gemstone */}
          {hasAccess && isCusp && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.15)', 'rgba(139, 157, 195, 0.1)']} style={styles.gemstoneCard}>
              <View style={styles.cardHeader}>
                <Gem size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Your Cusp Birthstone</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              {(() => {
                const gemstoneData = getCuspGemstoneAndRitual(selectedSign);
                return gemstoneData ? (
                  <>
                    <Text style={styles.gemstoneName}>{gemstoneData.gemstone}</Text>
                    <Text style={styles.gemstoneMeaning}>{gemstoneData.meaning}</Text>
                  </>
                ) : (
                  <Text style={styles.gemstoneMeaning}>
                    Your cusp birthstone enhances the dual energies of your cosmic position.
                  </Text>
                );
              })()}
            </LinearGradient>
          )}

          {/* Lunar Phase */}
          {moonPhase && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.lunarCard}>
              <View style={styles.cardHeader}>
                <Moon size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Current Moon Phase</Text>
              </View>
              <View style={styles.lunarInfo}>
                <Text style={styles.lunarPhase}>{asString(moonPhase.phase)}</Text>
                <Text style={styles.lunarIllumination}>{asString(moonPhase.illumination)}% illuminated</Text>
                <Text style={styles.lunarNext}>
                  Next {asString(moonPhase.nextPhase)}: {asString(moonPhase.nextPhaseDate)}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Astronomical Events */}
          {astronomicalEvents.length > 0 && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']} style={styles.eventsCard}>
              <View style={styles.cardHeader}>
                <Telescope size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Cosmic Events</Text>
              </View>
              {astronomicalEvents.slice(0, 2).map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Text style={styles.eventName}>{asString(event.name)}</Text>
                  <Text style={styles.eventDescription}>{asString(event.description)}</Text>
                </View>
              ))}
            </LinearGradient>
          )}

          {/* Upgrade CTA */}
          {!hasAccess && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.upgradeCard}>
              <View style={styles.upgradeHeader}>
                <Crown size={24} color="#d4af37" />
                <Text style={styles.upgradeTitle}>Unlock Astral Plane</Text>
              </View>
              <Text style={styles.upgradeDescription}>
                Get deeper insights, monthly forecasts, cusp-specific guidance, and astronomical context.
              </Text>
              <CosmicButton title="Upgrade Now" onPress={handleUpgrade} style={styles.upgradeButton} />
            </LinearGradient>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#8b9dc3' },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 18, fontFamily: 'Inter-Medium', color: '#ff6b6b', textAlign: 'center', marginBottom: 24 },
  errorButton: { minWidth: 200 },

  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 20, paddingBottom: 24, position: 'relative' },
  headerButtons: { position: 'absolute', right: 0, top: 20, flexDirection: 'row', gap: 12 },
  headerButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(26, 26, 46, 0.4)' },

  hemisphereDisplay: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 20 },
  hemisphereToggle: { flexDirection: 'row', marginBottom: 24, gap: 12, paddingHorizontal: 20 },
  hemisphereButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
    alignItems: 'center',
  },
  hemisphereButtonActive: { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderColor: '#d4af37' },
  hemisphereButtonText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#8b9dc3' },
  hemisphereButtonTextActive: { color: '#d4af37' },

  horoscopeCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  premiumCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  gemstoneCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  lunarCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  eventsCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },

  upgradeCard: { borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', alignItems: 'center' },
  upgradeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  upgradeTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', marginLeft: 12 },
  upgradeDescription: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  upgradeButton: { minWidth: 160 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#e8e8e8', marginLeft: 8, flex: 1 },
  premiumBadge: { backgroundColor: '#d4af37', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },
  cuspBadge: { backgroundColor: '#8b9dc3', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cuspBadgeText: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: 1 },

  horoscopeText: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 28, textAlign: 'center' },
  affirmationText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center', fontStyle: 'italic' },
  mysticText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },
  deeperText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },

  gemstoneName: { fontSize: 18, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', textAlign: 'center', marginBottom: 8 },
  gemstoneMeaning: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 20, textAlign: 'center' },

  lunarInfo: { alignItems: 'center' },
  lunarPhase: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#8b9dc3', marginBottom: 4 },
  lunarIllumination: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#e8e8e8', marginBottom: 8 },
  lunarNext: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3' },

  eventItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(139, 157, 195, 0.2)' },
  eventName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#8b9dc3', marginBottom: 4 },
  eventDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 20 },
});
