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
  Eye,
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
import { getAccessibleHoroscope, type HoroscopeData } from '../../utils/horoscopeData';
import {
  getHemisphereEvents,
  getCurrentPlanetaryPositionsEnhanced,
  getVisibleConstellationsEnhanced,
  getSpaceHighlights,
  type SpaceHighlights,
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
 * Date helpers (fix stale daily content)
 * ------------------------- */
// Returns a Date set to **UTC midnight** for the user's **local** calendar day.
// This makes Supabase lookups deterministic per local day, regardless of timezone.
function getUTCMidnightForLocalDay(localNow = new Date()): Date {
  const y = localNow.getFullYear();
  const m = localNow.getMonth();
  const d = localNow.getDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
}

// Milliseconds until next local midnight
function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export default function AstrologyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sign?: string; hemisphere?: string }>();
  const { hemisphere: contextHemisphere } = useHemisphere();

  // ----- internal guards -----
  const initOnce = useRef(false);
  const inFlight = useRef(false);
  const lastSubCheck = useRef<number>(0);

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
  const [planetaryPositions, setPlanetaryPositions] = useState<any[]>([]);
  const [visibleConstellations, setVisibleConstellations] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [translatedContent, setTranslatedContent] = useState<any>({});
  const [space, setSpace] = useState<SpaceHighlights | null>(null);

  // Tick that flips at local midnight to force refresh
  const [dayTick, setDayTick] = useState(0);

  // Resolve header values (fast)
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

  // The **service date** we send to Supabase (UTC midnight for today's local date)
  const serviceDateUTC = useMemo(() => {
    const d = getUTCMidnightForLocalDay();
    console.log('📅 [astrology] serviceDateUTC →', d.toISOString());
    return d;
  }, [dayTick]);

  // Hemisphere-safe filter: hide Southern-only landmarks on Northern
  const filteredEvents = useMemo(() => {
    const southernOnly = /(southern\s*cross|magellanic\s*clouds|carina\s*nebula)/i;
    if (resolvedHemisphere === 'Northern') {
      return (astronomicalEvents || []).filter(e =>
        !southernOnly.test(`${e?.name || ''} ${e?.description || ''}`)
      );
    }
    return astronomicalEvents || [];
  }, [astronomicalEvents, resolvedHemisphere]);

  // Refetch when hemisphere changes
  useEffect(() => {
    if (!effectiveSign || !ready) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getAccessibleHoroscope(serviceDateUTC, effectiveSign, resolvedHemisphere);
        if (!cancelled) setHoroscope(data || null);
        // refresh constellations on hemisphere change
        try {
          const consts = await getVisibleConstellationsEnhanced(resolvedHemisphere);
          if (!cancelled) setVisibleConstellations(consts || []);
        } catch {
          if (!cancelled) setVisibleConstellations([]);
        }
      } catch (err) {
        if (!cancelled) console.error('❌ [astrology] Hemisphere fetch error:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSign, resolvedHemisphere, ready, serviceDateUTC]);

  // Auto flip dayTick at **local midnight** so content rolls to the new day
  useEffect(() => {
    const ms = msUntilNextLocalMidnight();
    const t = setTimeout(() => setDayTick(tick => tick + 1), ms + 1000);
    return () => clearTimeout(t);
  }, [dayTick]);

  // Also refetch when the screen regains focus (e.g. app slept overnight)
  useFocusEffect(
    useCallback(() => {
      if (ready) {
        onRefresh(true);
      }
    }, [ready, effectiveSign, resolvedHemisphere, serviceDateUTC])
  );

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

        // Throttled subscription check (2 min)
        const now = Date.now();
        if (now - lastSubCheck.current > 120_000) {
          lastSubCheck.current = now;
          const sub = await getSubscriptionStatus();
          if (!cancelled) setHasAccess(!!sub?.active);
        }

        // Compute sign + hemisphere
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

        // Load horoscope (using UTC-midnight service date)
        const data = await getAccessibleHoroscope(serviceDateUTC, signResolved, hemiResolved);
        setHoroscope(data || null);

        // Astronomical context
        const lunar = getLunarNow(hemiResolved);
        const events = getHemisphereEvents(hemiResolved);
        const positions = await getCurrentPlanetaryPositionsEnhanced(hemiResolved);
        setMoonPhase(lunar);
        setAstronomicalEvents(events);
        setPlanetaryPositions(positions);

        // Constellations (by hemisphere)
        try {
          const consts = await getVisibleConstellationsEnhanced(hemiResolved);
          setVisibleConstellations(consts || []);
        } catch {
          setVisibleConstellations([]);
        }

        // Space highlights (NASA / ASA) — safe if keys are missing
        try {
          const sh = await getSpaceHighlights();
          setSpace(sh);
        } catch (e) {
          console.warn('[astrology] space highlights error:', e);
        }

        // Language preference
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDateUTC]); // include serviceDateUTC: if app launches after midnight, we fetch the right day

  // Translation effect
  useEffect(() => {
    const run = async () => {
      if (currentLanguage !== 'zh' || !horoscope) {
        setTranslatedContent({});
        return;
      }
      try {
        const translations: any = {};
        if (horoscope.daily) translations.daily = await translateText(asString(horoscope.daily), currentLanguage);
        if (horoscope.affirmation)
          translations.affirmation = await translateText(stripVersionSuffix(horoscope.affirmation), currentLanguage);
        if (horoscope.deeper)
          translations.deeper = await translateText(stripVersionSuffix(horoscope.deeper), currentLanguage);
        if (horoscope.mysticOpening)
          translations.mysticOpening = await translateText(asString(horoscope.mysticOpening), currentLanguage);
        setTranslatedContent(translations);
      } catch (error) {
        console.error('Translation error:', error);
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
    if (horoscope?.daily && base === asString(horoscope.daily)) return translatedContent.daily || base;
    if (horoscope?.affirmation && base === stripVersionSuffix(horoscope.affirmation))
      return translatedContent.affirmation || base;
    if (horoscope?.deeper && base === stripVersionSuffix(horoscope.deeper)) return translatedContent.deeper || base;
    if (horoscope?.mysticOpening && base === asString(horoscope.mysticOpening))
      return translatedContent.mysticOpening || base;
    return base;
  };

  // Refresh
  const onRefresh = async (silent = false) => {
    if (inFlight.current) return;
    if (!silent) setRefreshing(true);
    try {
      if (effectiveSign) {
        const data = await getAccessibleHoroscope(serviceDateUTC, effectiveSign, resolvedHemisphere);
        setHoroscope(data || null);
      }
      const now = Date.now();
      if (now - lastSubCheck.current > 120_000) {
        lastSubCheck.current = now;
        const sub = await getSubscriptionStatus();
        setHasAccess(!!sub?.active);
      }
      // refresh constellations + space
      try {
        const consts = await getVisibleConstellationsEnhanced(resolvedHemisphere);
        setVisibleConstellations(consts || []);
      } catch {}
      try {
        const sh = await getSpaceHighlights();
        setSpace(sh);
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh horoscope.');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleUpgrade = () => router.push('/subscription');

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
          {/* Header */}
          <HoroscopeHeader signLabel={resolvedSign || effectiveSign || 'Select your sign'} />
          <Text style={styles.hemisphereDisplay}>{resolvedHemisphere} Hemisphere</Text>
          <HemisphereToggle />

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

          {/* Cosmic Perspective */}
          {hasAccess && horoscope?.celestialInsight && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.cosmicCard}>
              <View style={styles.cardHeader}>
                <Telescope size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Cosmic Perspective</Text>
              </View>
              <Text style={styles.cosmicText}>{getDisplayText(horoscope.celestialInsight)}</Text>
            </LinearGradient>
          )}

          {/* Lunar Phase */}
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

          {/* Planetary Positions */}
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

          {/* Astrological Houses */}
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

          {/* Astronomical Events (hemisphere-safe) */}
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

          {/* Visible Constellations */}
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

          {/* Space Highlights (NASA / ASA) */}
          {space && (space.nasa || space.asa) && (
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
              style={styles.spaceCard}
            >
              <View style={styles.cardHeader}>
                <Telescope size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Space Highlights</Text>
              </View>

              {space.nasa && (
                <View style={styles.spaceItem}>
                  <Text style={styles.spaceSource}>NASA</Text>
                  {space.nasa.title ? <Text style={styles.spaceTitle}>{space.nasa.title}</Text> : null}
                  {space.nasa.date ? <Text style={styles.spaceMeta}>{space.nasa.date}</Text> : null}
                  {space.nasa.description ? <Text style={styles.spaceDesc}>{space.nasa.description}</Text> : null}
                  {space.nasa.url ? (
                    <Text
                      style={styles.spaceLink}
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          window.open(space.nasa!.url!, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      View on NASA →
                    </Text>
                  ) : null}
                </View>
              )}

              {space.asa && (
                <View style={styles.spaceItem}>
                  <Text style={styles.spaceSource}>ASA</Text>
                  {space.asa.title ? <Text style={styles.spaceTitle}>{space.asa.title}</Text> : null}
                  {space.asa.date ? <Text style={styles.spaceMeta}>{space.asa.date}</Text> : null}
                  {space.asa.description ? <Text style={styles.spaceDesc}>{space.asa.description}</Text> : null}
                  {space.asa.url ? (
                    <Text
                      style={styles.spaceLink}
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          window.open(space.asa!.url!, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      View on ASA →
                    </Text>
                  ) : null}
                </View>
              )}
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
  cuspBadge: { backgroundColor: '#8b9dc3', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cuspBadgeText: { fontSize: 10, fontFamily: 'Vazirmatn-SemiBold', color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: 1 },

  horoscopeText: { fontSize: 18, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 28, textAlign: 'center' },
  affirmationText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center', fontStyle: 'italic' },
  mysticText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },
  deeperText: { fontSize: 16, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },

  gemstoneName: { fontSize: 18, fontFamily: 'Vazirmatn-Bold', color: '#d4af37', textAlign: 'center', marginBottom: 8 },
  gemstoneMeaning: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', lineHeight: 20, textAlign: 'center' },

  cosmicCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  cosmicText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center' },

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

  // Constellations styles
  constellationsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  constellationsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  constellationPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  constellationText: {
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
  },
  constellationsNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Space Highlights styles
  spaceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  spaceItem: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  spaceSource: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  spaceTitle: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#e8e8e8',
    marginBottom: 4,
  },
  spaceMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginBottom: 8,
  },
  spaceDesc: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
  },
  spaceLink: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
    textAlign: 'right',
  },
});
