// app/(tabs)/astrology.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Star,
  Moon,
  Crown,
  Telescope,
  Gem,
  Sparkles,
} from 'lucide-react-native';

import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import MysticMish from '../../components/MysticMish';
import HoroscopeHeader from '../../components/HoroscopeHeader';

import { getUserData, type UserProfile } from '../../utils/userData';
import { getSubscriptionStatus } from '../../utils/billing';

// ✅ Use daily.ts for horoscope_cache
import { getAccessibleHoroscope as getDailyAccessible } from '../../utils/daily';

import {
  getHemisphereEvents,
  getCurrentPlanetaryPositionsEnhanced,
  getVisibleConstellationsEnhanced,
} from '../../utils/astronomy';
import { getLunarNow } from '../../utils/lunar';
import { getCuspGemstoneAndRitual } from '../../utils/cuspData';
import { translateText, getUserLanguage, type SupportedLanguage } from '../../utils/translation';
import { useHemisphere } from '../../providers/HemisphereProvider';
import HemisphereToggle from '../../components/HemisphereToggle';
import { getAstrologicalHouse } from '../../utils/zodiacData';

/* -------------------------
 * Safe string helpers
 * ------------------------- */
function asString(v: any): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function stripVersionSuffix(v?: string) {
  const s = asString(v).trim();
  return s.replace(/\s*V\d+\s*$/i, '').trim();
}

/* -------------------------
 * Date helpers
 * ------------------------- */
function getUTCMidnightForLocalDay(localNow = new Date()): Date {
  const y = localNow.getFullYear();
  const m = localNow.getMonth();
  const d = localNow.getDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
}

function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function buildDailyUser(base: any, signLabel: string, hemi: 'Northern' | 'Southern') {
  const isCusp = /\bcusp\b/i.test(signLabel);
  return {
    id: base?.id,
    email: base?.email,
    hemisphere: hemi,
    preferred_sign: signLabel,
    cuspResult: isCusp ? { cuspName: signLabel } : { primarySign: signLabel },
  };
}

export default function AstrologyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sign?: string; hemisphere?: string }>();
  const { hemisphere: contextHemisphere } = useHemisphere();

  const initOnce = useRef(false);
  const inFlight = useRef(false);
  const lastSubCheck = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  // Daily content from horoscope_cache
  const [daily, setDaily] = useState<{
    date?: string;
    sign?: string;
    hemisphere?: string;
    daily?: string;
    affirmation?: string;
    deeper?: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [selectedSign, setSelectedSign] = useState<string>('');
  const [selectedHemisphere, setSelectedHemisphere] = useState<'Northern' | 'Southern'>('Northern');
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [astronomicalEvents, setAstronomicalEvents] = useState<any[]>([]);
  const [planetaryPositions, setPlanetaryPositions] = useState<any[]>([]);
  const [visibleConstellations, setVisibleConstellations] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [translatedContent, setTranslatedContent] = useState<any>({});

  const [dayTick, setDayTick] = useState(0);

  const resolvedSign = useMemo(() => {
    if (params.sign) {
      const decoded = decodeURIComponent(asString(params.sign));
      console.log('🎯 [astrology] Using route param sign:', decoded);
      return decoded;
    }
    if (user?.cuspResult) {
      return user.cuspResult.isOnCusp ? user.cuspResult.cuspName : user.cuspResult.primarySign;
    }
    return undefined;
  }, [user, params.sign]);

  const resolvedHemisphere = useMemo<'Northern' | 'Southern'>(() => {
    const p = asString(params.hemisphere);
    if (p) return decodeURIComponent(p) as 'Northern' | 'Southern';
    return contextHemisphere || (user?.hemisphere as 'Northern' | 'Southern') || 'Northern';
  }, [user, params.hemisphere, contextHemisphere]);

  const effectiveSign = useMemo(() => {
    return resolvedSign || selectedSign || '';
  }, [resolvedSign, selectedSign]);

  const serviceDateUTC = useMemo(() => {
    const d = getUTCMidnightForLocalDay();
    console.log('📅 [astrology] serviceDateUTC →', d.toISOString());
    return d;
  }, [dayTick]);

  const filteredEvents = useMemo(() => {
    const southernOnly = /(southern\s*cross|magellanic\s*clouds|carina\s*nebula)/i;
    if (resolvedHemisphere === 'Northern') {
      return (astronomicalEvents || []).filter(e =>
        !southernOnly.test(`${e?.name || ''} ${e?.description || ''}`)
      );
    }
    return astronomicalEvents || [];
  }, [astronomicalEvents, resolvedHemisphere]);

  useEffect(() => {
    if (!effectiveSign || !ready) return;
    let cancelled = false;
    (async () => {
      try {
        const dailyUser = buildDailyUser(user, effectiveSign, resolvedHemisphere);
        const d = await getDailyAccessible(dailyUser, {
          useCache: true,
          debug: true,
        });
        
        console.log('🔍 [astrology] Daily data received:', d);
        console.log('🔍 [astrology] daily.daily value:', d?.daily);
        console.log('🔍 [astrology] daily.affirmation value:', d?.affirmation);
        console.log('🔍 [astrology] daily.deeper value:', d?.deeper);
        
        if (!cancelled) setDaily(d || null);

        try {
          const consts = await getVisibleConstellationsEnhanced(resolvedHemisphere);
          if (!cancelled) setVisibleConstellations(consts || []);
        } catch {
          if (!cancelled) setVisibleConstellations([]);
        }
      } catch (err) {
        if (!cancelled) console.error('❌ [astrology] Hemisphere/sign fetch error:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSign, resolvedHemisphere, ready, serviceDateUTC, user]);

  useEffect(() => {
    const ms = msUntilNextLocalMidnight();
    const t = setTimeout(() => setDayTick(tick => tick + 1), ms + 1000);
    return () => clearTimeout(t);
  }, [dayTick]);

  useFocusEffect(
    useCallback(() => {
      if (ready) {
        onRefresh(true);
      }
    }, [ready, effectiveSign, resolvedHemisphere, serviceDateUTC])
  );

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
        console.log('🚀 [astrology] Starting one-time init...');

        try {
          await getUserData();
        } catch (authError: any) {
          if (
            authError.message?.includes('Invalid Refresh Token') ||
            authError.message?.includes('Refresh Token Not Found') ||
            authError.message?.includes('refresh_token_not_found')
          ) {
            console.log('🔄 [astrology] Auth token error, redirecting to login');
            router.replace('/auth/login');
            return;
          }
          throw authError;
        }

        const u = await getUserData();
        if (cancelled) return;

        setUser(prev => {
          const same =
            !!prev &&
            prev.email === u?.email &&
            prev.hemisphere === u?.hemisphere &&
            prev.cuspResult?.cuspName === u?.cuspResult?.cuspName &&
            prev.cuspResult?.primarySign === u?.cuspResult?.primarySign;
          return same ? prev : u;
        });

        const now = Date.now();
        if (now - lastSubCheck.current > 120_000) {
          lastSubCheck.current = now;
          const sub = await getSubscriptionStatus();
          if (!cancelled) setHasAccess(!!sub?.active);
        }

        const signParam = asString(params.sign) ? decodeURIComponent(asString(params.sign)) : '';
        const hemiParam = asString(params.hemisphere)
          ? (decodeURIComponent(asString(params.hemisphere)) as 'Northern' | 'Southern')
          : '';

        const signResolved =
          signParam ||
          (u?.cuspResult?.isOnCusp ? u?.cuspResult?.cuspName : u?.cuspResult?.primarySign) ||
          '';

        const hemiResolved = (hemiParam || contextHemisphere || (u?.hemisphere as 'Northern' | 'Southern') || 'Northern') as
          | 'Northern'
          | 'Southern';

        setSelectedSign(signResolved);
        setSelectedHemisphere(hemiResolved);

        if (!signResolved) {
          setError('No cosmic profile found. Please calculate your cosmic position.');
          setReady(true);
          return;
        }

        try {
          const dailyUser = buildDailyUser(u, signResolved, hemiResolved);
          const d = await getDailyAccessible(dailyUser, { useCache: true, debug: true });
          
          console.log('🔍 [astrology INIT] Daily data received:', d);
          console.log('🔍 [astrology INIT] daily.daily value:', d?.daily);
          console.log('🔍 [astrology INIT] daily.affirmation value:', d?.affirmation);
          console.log('🔍 [astrology INIT] daily.deeper value:', d?.deeper);
          
          setDaily(d || null);
        } catch (e) {
          console.warn('[astrology] daily fetch error:', e);
          setDaily(null);
        }

        const lunar = getLunarNow(hemiResolved);
        const events = getHemisphereEvents(hemiResolved);
        const positions = await getCurrentPlanetaryPositionsEnhanced(hemiResolved);
        setMoonPhase(lunar);
        setAstronomicalEvents(events);
        setPlanetaryPositions(positions);

        try {
          const consts = await getVisibleConstellationsEnhanced(hemiResolved);
          setVisibleConstellations(consts || []);
        } catch {
          setVisibleConstellations([]);
        }

        const language = await getUserLanguage();
        setCurrentLanguage(language);

        console.log('✅ [astrology] Init complete');
      } catch (err: any) {
        console.error('❌ [astrology] Init error:', err);
        setError(err?.message || 'Failed to load horoscope.');
      } finally {
        inFlight.current = false;
        setLoading(false);
        setReady(true);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [serviceDateUTC]);

  useEffect(() => {
    const run = async () => {
      if (currentLanguage !== 'zh' || !daily) {
        setTranslatedContent({});
        return;
      }
      try {
        const translations: any = {};
        if (daily.daily) translations.daily = await translateText(asString(daily.daily), currentLanguage);
        if (daily.affirmation)
          translations.affirmation = await translateText(stripVersionSuffix(daily.affirmation), currentLanguage);
        if (daily.deeper)
          translations.deeper = await translateText(stripVersionSuffix(daily.deeper), currentLanguage);
        setTranslatedContent(translations);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedContent({
          daily: asString(daily.daily),
          affirmation: stripVersionSuffix(daily.affirmation),
          deeper: stripVersionSuffix(daily.deeper),
        });
      }
    };
    run();
  }, [currentLanguage, daily, hasAccess]);

  const getDisplayText = (original?: string) => {
    const base = asString(original);
    if (currentLanguage !== 'zh') return base;
    if (daily?.daily && base === asString(daily.daily)) return (translatedContent.daily ?? base);
    if (daily?.affirmation && base === stripVersionSuffix(daily.affirmation))
      return (translatedContent.affirmation ?? base);
    if (daily?.deeper && base === stripVersionSuffix(daily.deeper)) return (translatedContent.deeper ?? base);
    return base;
  };

  const onRefresh = async (silent = false) => {
    if (inFlight.current) return;
    if (!silent) setRefreshing(true);
    try {
      if (effectiveSign) {
        const dailyUser = buildDailyUser(user, effectiveSign, resolvedHemisphere);
        const d = await getDailyAccessible(dailyUser, { useCache: true, debug: true });
        
        console.log('🔍 [astrology REFRESH] Daily data received:', d);
        console.log('🔍 [astrology REFRESH] daily.daily value:', d?.daily);
        
        setDaily(d || null);
      }
      const now = Date.now();
      if (now - lastSubCheck.current > 120_000) {
        lastSubCheck.current = now;
        const sub = await getSubscriptionStatus();
        setHasAccess(!!sub?.active);
      }
      try {
        const consts = await getVisibleConstellationsEnhanced(resolvedHemisphere);
        setVisibleConstellations(consts || []);
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh horoscope.');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleUpgrade = () => router.push('/subscription');

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
              title="Calculate Your Cosmic Position"
              onPress={() => router.push('/(tabs)/find-cusp')}
              style={styles.errorButton}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isCusp = asString(effectiveSign).toLowerCase().includes('cusp');

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <MysticMish hemisphere={resolvedHemisphere} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} tintColor="#d4af37" colors={['#d4af37']} />}
          showsVerticalScrollIndicator={false}
        >
          <HoroscopeHeader signLabel={resolvedSign || effectiveSign || 'Select your sign'} />
          <Text style={styles.hemisphereDisplay}>{resolvedHemisphere} Hemisphere</Text>
          <HemisphereToggle />

          {daily?.daily && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.horoscopeCard}>
              <View style={styles.cardHeader}>
                <Star size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Today's Guidance</Text>
              </View>
              <Text style={styles.horoscopeText}>{getDisplayText(daily.daily)}</Text>
            </LinearGradient>
          )}

          {hasAccess && asString(daily?.affirmation) !== '' && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Sparkles size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Daily Affirmation</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              <Text style={styles.affirmationText}>{getDisplayText(stripVersionSuffix(daily?.affirmation))}</Text>
            </LinearGradient>
          )}

          {hasAccess && asString(daily?.deeper) !== '' && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Crown size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Daily Astral Plane</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              <Text style={styles.deeperText}>{getDisplayText(stripVersionSuffix(daily?.deeper))}</Text>
            </LinearGradient>
          )}

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
                const gemstoneData = getCuspGemstoneAndRitual(effectiveSign);
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

          {moonPhase && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.lunarCard}>
              <View style={styles.cardHeader}>
                <Moon size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Lunar Cycle</Text>
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

          {hasAccess && planetaryPositions.length > 0 && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']} style={styles.planetsCard}>
              <View style={styles.cardHeader}>
                <Star size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Planetary Influences</Text>
              </View>
              <View style={styles.planetsGrid}>
                {planetaryPositions.slice(0, 5).map((planet) => (
                  <View key={planet.planet} style={styles.planetItem}>
                    <Text style={styles.planetName}>{planet.planet}</Text>
                    <Text style={styles.planetPosition}>
                      {planet.degree.toFixed(1)}° {planet.sign}
                      {planet.retrograde && <Text style={styles.retrograde}> ℞</Text>}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.planetsNote}>Current planetary positions affecting your cosmic energy today</Text>
            </LinearGradient>
          )}

          {hasAccess && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.housesCard}>
              <View style={styles.cardHeader}>
                <Crown size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Houses in Focus Today</Text>
              </View>
              <View style={styles.housesGrid}>
                {[1, 7, 10].map((houseNumber) => {
                  const house = getAstrologicalHouse(houseNumber);
                  if (!house) return null;
                  return (
                    <View key={houseNumber} style={styles.houseItem}>
                      <Text style={styles.houseNumber}>{houseNumber}</Text>
                      <View style={styles.houseContent}>
                        <Text style={styles.houseName}>{house.name}</Text>
                        <Text style={styles.houseDescription}>{house.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.housesNote}>These houses are particularly active in today's cosmic energy</Text>
            </LinearGradient>
          )}

          {filteredEvents.length > 0 && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']} style={styles.eventsCard}>
              <View style={styles.cardHeader}>
                <Telescope size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Cosmic Events</Text>
              </View>
              {filteredEvents.slice(0, 2).map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Text style={styles.eventName}>{asString(event.name)}</Text>
                  <Text style={styles.eventDescription}>{asString(event.description)}</Text>
                </View>
              ))}
            </LinearGradient>
          )}

          {visibleConstellations.length > 0 && (
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.18)', 'rgba(139, 157, 195, 0.06)']}
              style={styles.constellationsCard}
            >
              <View style={styles.cardHeader}>
                <Telescope size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Visible Constellations</Text>
              </View>
              <View style={styles.constellationsWrap}>
                {visibleConstellations.map((name) => (
                  <View key={name} style={styles.constellationPill}>
                    <Text style={styles.constellationText}>{name}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.constellationsNote}>
                Based on the current season in the {resolvedHemisphere} Hemisphere
              </Text>
            </LinearGradient>
          )}

          {!hasAccess && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']} style={styles.upgradeCard}>
              <View style={styles.upgradeHeader}>
                <Crown size={24} color="#d4af37" />
                <Text style={styles.upgradeTitle}>Unlock Astral Plane</Text>
              </View>
              <Text style={styles.upgradeDescription}>
                Get deeper insights, monthly forecasts, cusp-specific guidance, planetary positions, lunar cycle guidance,
                cosmic perspective, and astrological houses.
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
  loadingText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3' },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 18, fontFamily: 'Vazirmatn-Medium', color: '#ff6b6b', textAlign: 'center', marginBottom: 24 },
  errorButton: { minWidth: 200 },

  hemisphereDisplay: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 20 },

  horoscopeCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  premiumCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  gemstoneCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  lunarCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  eventsCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },

  upgradeCard: { borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', alignItems: 'center' },
  upgradeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  upgradeTitle: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', color: '#d4af37', marginLeft: 12 },
  upgradeDescription: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  upgradeButton: { minWidth: 160 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Vazirmatn-SemiBold', color: '#e8e8e8', marginLeft: 8, flex: 1 },
  premiumBadge: { backgroundColor: '#d4af37', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' },

  horoscopeText: { fontSize: 18, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 28, textAlign: 'center' },
  affirmationText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center', fontStyle: 'italic' },
  deeperText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },

  gemstoneName: { fontSize: 18, fontFamily: 'Vazirmatn-Bold', color: '#d4af37', textAlign: 'center', marginBottom: 8 },
  gemstoneMeaning: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 20, textAlign: 'center' },

  lunarInfo: { alignItems: 'center' },
  lunarPhase: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', color: '#8b9dc3', marginBottom: 4 },
  lunarIllumination: { fontSize: 16, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8', marginBottom: 8 },
  lunarNext: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3' },

  eventItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(139, 157, 195, 0.2)' },
  eventName: { fontSize: 16, fontFamily: 'Vazirmatn-SemiBold', color: '#8b9dc3', marginBottom: 4 },
  eventDescription: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 20 },

  planetsCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  planetsGrid: { gap: 12 },
  planetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(26, 26, 46, 0.4)', borderRadius: 8 },
  planetName: { fontSize: 14, fontFamily: 'Vazirmatn-SemiBold', color: '#8b9dc3' },
  planetPosition: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8' },
  retrograde: { color: '#ff6b6b', fontSize: 12 },
  planetsNote: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },

  housesCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  housesGrid: { gap: 16 },
  houseItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(26, 26, 46, 0.4)', borderRadius: 12 },
  houseNumber: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', color: '#d4af37', marginRight: 16, minWidth: 24 },
  houseContent: { flex: 1 },
  houseName: { fontSize: 16, fontFamily: 'Vazirmatn-SemiBold', color: '#e8e8e8', marginBottom: 4 },
  houseDescription: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', lineHeight: 18 },
  housesNote: { fontSize: 12, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },

  constellationsCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  constellationsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  constellationPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(26, 26, 46, 0.5)', borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  constellationText: { color: '#e8e8e8', fontFamily: 'Vazirmatn-Medium', fontSize: 14 },
  constellationsNote: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});