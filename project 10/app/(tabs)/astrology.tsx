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
import { useHemisphere } from '../../providers/HemisphereProvider';
import HemisphereToggle from '../../components/HemisphereToggle';
import { getAstrologicalHouse } from '../../utils/zodiacData';
import { getEffectiveSign } from '../../utils/effectiveSign';

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

export default function AstrologyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sign?: string; hemisphere?: string }>();
  const { hemisphere: contextHemisphere, setHemisphereSafe } = useHemisphere();

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
    // 1) Highest priority: explicit route param (e.g. from "Explore your sign" nav)
    if (params.sign) {
      const decoded = decodeURIComponent(asString(params.sign));
      console.log('🎯 [astrology] Using route param sign:', decoded);
      return decoded;
    }
    
    // 2) Profile (no defaults here)
    if (user?.cuspResult) {
      return user.cuspResult.isOnCusp
        ? user.cuspResult.cuspName
        : user.cuspResult.primarySign;
    }
    
    // 3) Nothing yet — wait (undefined means "don't render content yet")
    return undefined;
  }, [user, params.sign]);

  const resolvedHemisphere = useMemo<'Northern' | 'Southern'>(() => {
    const p = asString(params.hemisphere);
    if (p) return decodeURIComponent(p) as 'Northern' | 'Southern';
    return contextHemisphere || (user?.hemisphere as 'Northern' | 'Southern') || 'Northern';
  }, [user, params.hemisphere, contextHemisphere]);

  // Effective sign for data fetching
  const effectiveSign = useMemo(() => {
    return resolvedSign || selectedSign || '';
  }, [resolvedSign, selectedSign]);

  // Effect to refetch when hemisphere changes
  useEffect(() => {
    if (!effectiveSign || !ready) return;
    
    let cancelled = false;
    (async () => {
      try {
        console.log('🔄 [astrology] Hemisphere changed, refetching:', { sign: effectiveSign, hemisphere: resolvedHemisphere });
        const data = await getAccessibleHoroscope(new Date(), effectiveSign, resolvedHemisphere);
        if (!cancelled) {
          setHoroscope(data || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('❌ [astrology] Hemisphere fetch error:', err);
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [effectiveSign, resolvedHemisphere, ready]);

  // Debug effect to track dependency changes
  useEffect(() => {
    console.log('🔍 [astrology] Dependencies changed:', {
      effectiveSign,
      hemisphere: resolvedHemisphere,
      hasUser: !!user,
    });
  }, [effectiveSign, resolvedHemisphere, user]);

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

        let profile;
        try {
          profile = await getUserData();
        } catch (authError: any) {
          // If getUserData fails due to token issues, redirect to login
          if (authError.message?.includes('Invalid Refresh Token') || 
              authError.message?.includes('Refresh Token Not Found') ||
              authError.message?.includes('refresh_token_not_found')) {
            console.log('🔄 [astrology] Auth token error, redirecting to login');
            router.replace('/auth/login');
            return;
          }
          throw authError;
        }
        
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
            console.log('🔍 [astrology] Subscription status:', sub);
            setHasAccess(!!sub?.active);
          }
        }

        // 3) Compute sign + hemisphere
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

        if (!cancelled) {
          setSelectedSign(signResolved);
          setSelectedHemisphere(hemiResolved);
        }

        // 4) Fail fast if absolutely no sign anywhere
        if (!signResolved) {
          if (!cancelled) {
            setError('No cosmic profile found. Please calculate your cosmic position.');
            setReady(true);
          }
          return;
        }

        // 5) Load horoscope for resolved sign
        console.log('🔍 [astrology] Fetching horoscope for:', { sign: signResolved, hemisphere: hemiResolved });
        // Force fresh fetch with debug logging
        const data = await getAccessibleHoroscope(new Date(), signResolved, hemiResolved);
        console.log('🔍 [astrology] Raw horoscope response:', {
          hasData: !!data,
          hasDaily: !!data?.daily,
          dailyPreview: data?.daily?.substring(0, 100) + '...',
          hasAffirmation: !!data?.affirmation,
          hasDeeper: !!data?.deeper,
          hasAccess: data?.hasAccess
        });
        if (!cancelled) {
          console.log('📊 [astrology] Horoscope data received:', {
            hasDaily: !!data?.daily,
            hasAffirmation: !!data?.affirmation,
            hasDeeper: !!data?.deeper,
            hasMysticOpening: !!data?.mysticOpening,
            hasCelestialInsight: !!data?.celestialInsight,
            hasMonthlyForecast: !!data?.monthlyForecast,
            hasAccess: data?.hasAccess
          });
          setHoroscope(data || null);
        }

        // 6) Astronomical context
        const lunar = getLunarNow(hemiResolved);
        const events = getHemisphereEvents(hemiResolved);
        const positions = await getCurrentPlanetaryPositionsEnhanced(hemiResolved);

        if (!cancelled) {
          setMoonPhase(lunar);
          setAstronomicalEvents(events);
          setPlanetaryPositions(positions);
        }

        // 7) Language preference
        const language = await getUserLanguage();
        if (!cancelled) setCurrentLanguage(language);

        console.log('✅ [astrology] Init complete');
      } catch (err: any) {
        console.error('❌ [astrology] Init error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load horoscope.');
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
          translations.daily = await translateText(asString(horoscope.daily), currentLanguage);
        }
        if (horoscope.affirmation) {
          translations.affirmation = await translateText(
            stripVersionSuffix(horoscope.affirmation),
            currentLanguage
          );
        }
        if (horoscope.deeper) {
          translations.deeper = await translateText(
            stripVersionSuffix(horoscope.deeper),
            currentLanguage
          );
        }
        if (horoscope.mysticOpening) {
          translations.mysticOpening = await translateText(
            asString(horoscope.mysticOpening),
            currentLanguage
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
      if (effectiveSign) {
        const data = await getAccessibleHoroscope(new Date(), effectiveSign, resolvedHemisphere);
        setHoroscope(data || null);
      }
      // light sub re-check (throttled)
      const now = Date.now();
      if (now - lastSubCheck.current > 120_000) {
        lastSubCheck.current = now;
        const sub = await getSubscriptionStatus();
        setHasAccess(!!sub?.active);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh horoscope.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignSelection = (sign: string, hemisphere: 'Northern' | 'Southern') => {
    if (inFlight.current) return;
    setSelectedSign(sign);
    setSelectedHemisphere(hemisphere);
    // Use the safe hemisphere setter from context
    setHemisphereSafe(hemisphere);
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
            
            {/* Special help for Peter's case */}
            {user?.email?.toLowerCase() === 'petermaricar@bigpond.com' && (
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.peterHelpBanner}
              >
                <Text style={styles.peterHelpTitle}>Hi Peter! 👋</Text>
                <Text style={styles.peterHelpText}>
                  We found your Stripe subscription but your cosmic profile needs to be completed. 
                  Please use the calculator below to set up your birth details.
                </Text>
                <Text style={styles.peterHelpNote}>
                  💡 Remember to use 24-hour time format (e.g., 14:30 for 2:30 PM)
                </Text>
              </LinearGradient>
            )}
            
            {/* Show recalc banner for users with corrupted profiles */}
            {user?.needsRecalc && (
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.recalcBanner}
              >
                <Text style={styles.recalcText}>
                  Your profile needs a quick recalculation for best accuracy. Please enter your real birth details.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log('🟢 Recalculate pressed for user:', user?.email);
                    
                    // PETER DEBUG: Enhanced recalc button logging
                    if (user?.email?.toLowerCase() === 'petermaricar@bigpond.com') {
                      console.log('🔍 [PETER DEBUG] Recalculate button clicked');
                      console.log('🔍 [PETER DEBUG] Current profile state:', {
                        email: user.email,
                        hemisphere: user.hemisphere,
                        needsRecalc: user.needsRecalc,
                        hasCuspResult: !!user.cuspResult,
                        primarySign: user.cuspResult?.primarySign
                      });
                    }
                    
                    router.push('/(tabs)/find-cusp?source=recalc');
                  }}
                  style={styles.recalcButton}
                  testID="recalcButton"
                >
                  <Text style={styles.recalcButtonText}>Recalculate Now</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
            
            <CosmicButton
              title="Calculate Your Cosmic Position"
              onPress={() => {
                console.log('🟢 Calculate button pressed');
                router.push('/(tabs)/find-cusp');
              }}
              style={styles.errorButton}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isCusp = asString(effectiveSign).toLowerCase().includes('cusp');

  console.log('🔍 [astrology] Render state:', {
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
      <MysticMish hemisphere={resolvedHemisphere} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" colors={['#d4af37']} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <HoroscopeHeader signLabel={resolvedSign || effectiveSign || 'Select your sign'} />

          <Text style={styles.hemisphereDisplay}>{resolvedHemisphere} Hemisphere</Text>

          {/* Hemisphere Toggle */}
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
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
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
                {hasAccess && (
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color="#1a1a2e" />
                  </View>
                )}
              </View>
              <View style={styles.lunarInfo}>
                <Text style={styles.lunarPhase}>{asString(moonPhase.phase)}</Text>
                <Text style={styles.lunarIllumination}>{asString(moonPhase.illumination)}% illuminated</Text>
                <Text style={styles.lunarNext}>
                  Next {asString(moonPhase.nextPhase)}: {asString(moonPhase.nextPhaseDate)}
                </Text>
                {hasAccess && (
                  <Text style={styles.lunarGuidance}>
                    {moonPhase.illumination > 75 
                      ? 'Perfect time for manifestation and releasing what no longer serves you.'
                      : moonPhase.illumination < 25
                      ? 'Ideal for new beginnings, setting intentions, and planting seeds for the future.'
                      : 'A time of growth and building momentum toward your goals.'
                    }
                  </Text>
                )}
              </View>
            </LinearGradient>
          )}

          {/* Planetary Positions */}
          {hasAccess && planetaryPositions.length > 0 && (
            <LinearGradient colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']} style={styles.planetsCard}>
              <View style={styles.cardHeader}>
                <Star size={20} color="#d4af37" />
                <Text style={styles.cardTitle}>Planetary Influences</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
              </View>
              <View style={styles.planetsGrid}>
                {planetaryPositions.slice(0, 5).map((planet, index) => (
                  <View key={planet.planet} style={styles.planetItem}>
                    <Text style={styles.planetName}>{planet.planet}</Text>
                    <Text style={styles.planetPosition}>
                      {planet.degree.toFixed(1)}° {planet.sign}
                      {planet.retrograde && <Text style={styles.retrograde}> ℞</Text>}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.planetsNote}>
                Current planetary positions affecting your cosmic energy today
              </Text>
            </LinearGradient>
          )}

          {/* Astrological Houses */}
          {hasAccess && (
            <LinearGradient colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']} style={styles.housesCard}>
              <View style={styles.cardHeader}>
                <Crown size={20} color="#8b9dc3" />
                <Text style={styles.cardTitle}>Houses in Focus Today</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#1a1a2e" />
                </View>
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
              <Text style={styles.housesNote}>
                These houses are particularly active in today's cosmic energy
              </Text>
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
                Get deeper insights, monthly forecasts, cusp-specific guidance, planetary positions, lunar cycle guidance, cosmic perspective, and astrological houses.
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

  peterHelpBanner: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  peterHelpTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#d4af37',
    marginBottom: 8,
    textAlign: 'center',
  },
  peterHelpText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  peterHelpNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    fontStyle: 'italic',
  },

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
  lunarGuidance: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#e8e8e8', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

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

  recalcBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  recalcText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 12,
  },
  recalcButton: {
    backgroundColor: '#d4af37',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  recalcButtonText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#1a1a2e',
  },
});