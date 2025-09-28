// app/(tabs)/find-cusp.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';

import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';
import CosmicInput from '@/components/CosmicInput';
import BirthdateField from '@/components/BirthdateField';
import LocationInput from '@/components/LocationInput';
import CuspLogo from '@/components/CuspLogo';

import { calculateCusp, type BirthInfo, type CuspResult } from '@/utils/astrology';
import { getAstronomicalInsight } from '@/utils/astronomy';
import { getBirthstoneForSign } from '@/utils/birthstones';
import { saveCosmicProfileEdits, type EditableProfile } from '@/utils/userProfile';
import { getUserData } from '@/utils/userData';

// ---------- Helpers ----------
function detectTimezone(location: string, hemisphere: 'Northern' | 'Southern'): string {
  const loc = (location || '').toLowerCase();

  // Australia
  if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('canberra'))
    return 'Australia/Sydney';
  if (loc.includes('brisbane') || loc.includes('gold coast')) return 'Australia/Brisbane';
  if (loc.includes('perth')) return 'Australia/Perth';
  if (loc.includes('adelaide')) return 'Australia/Adelaide';
  if (loc.includes('darwin')) return 'Australia/Darwin';
  if (loc.includes('hobart')) return 'Australia/Hobart';

  // Major world cities
  if (loc.includes('new york')) return 'America/New_York';
  if (loc.includes('los angeles') || loc.includes('san francisco')) return 'America/Los_Angeles';
  if (loc.includes('chicago')) return 'America/Chicago';
  if (loc.includes('toronto')) return 'America/Toronto';
  if (loc.includes('mexico city')) return 'America/Mexico_City';

  if (loc.includes('london')) return 'Europe/London';
  if (loc.includes('paris')) return 'Europe/Paris';
  if (loc.includes('berlin')) return 'Europe/Berlin';
  if (loc.includes('madrid')) return 'Europe/Madrid';
  if (loc.includes('rome')) return 'Europe/Rome';
  if (loc.includes('amsterdam')) return 'Europe/Amsterdam';

  if (loc.includes('johannesburg') || loc.includes('cape town')) return 'Africa/Johannesburg';
  if (loc.includes('nairobi')) return 'Africa/Nairobi';

  if (loc.includes('dubai')) return 'Asia/Dubai';
  if (loc.includes('mumbai')) return 'Asia/Kolkata';
  if (loc.includes('delhi')) return 'Asia/Kolkata';
  if (loc.includes('bangkok')) return 'Asia/Bangkok';
  if (loc.includes('singapore')) return 'Asia/Singapore';
  if (loc.includes('hong kong')) return 'Asia/Hong_Kong';
  if (loc.includes('beijing') || loc.includes('shanghai')) return 'Asia/Shanghai';
  if (loc.includes('tokyo')) return 'Asia/Tokyo';
  if (loc.includes('seoul')) return 'Asia/Seoul';

  if (loc.includes('auckland') || loc.includes('wellington')) return 'Pacific/Auckland';

  // Fallback by hemisphere
  return hemisphere === 'Southern' ? 'Australia/Sydney' : 'Europe/London';
}

function validateCity(location: string): { isValid: boolean; message?: string } {
  const trimmed = (location || '').trim();
  if (trimmed.length < 2) return { isValid: false, message: 'Please enter a valid city name.' };
  if (/^\d+$/.test(trimmed)) return { isValid: false, message: 'City name cannot be only numbers.' };
  if (/^[^a-zA-Z]+$/.test(trimmed)) return { isValid: false, message: 'City name must include letters.' };
  return { isValid: true };
}

function validateTimeFormat(time: string): { isValid: boolean; message?: string } {
  const trimmed = (time || '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return { isValid: false, message: 'Time must be in HH:MM (24-hour) format, e.g., 14:30.' };
  }
  const [h, m] = trimmed.split(':').map(n => parseInt(n, 10));
  if (h < 0 || h > 23) return { isValid: false, message: 'Hours must be 00–23.' };
  if (m < 0 || m > 59) return { isValid: false, message: 'Minutes must be 00–59.' };
  return { isValid: true };
}

// ---------- Screen ----------
export default function FindCuspCalculator() {
  const [name, setName] = useState('');
  const [birthDateISO, setBirthDateISO] = useState<string | null>(null); // from <BirthdateField />
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [hemisphere, setHemisphere] = useState<'Northern' | 'Southern'>('Northern');

  const [result, setResult] = useState<CuspResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [astronomicalContext, setAstronomicalContext] = useState('');
  const [calculating, setCalculating] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleViewCuspDetails = () => {
    if (result?.cuspName) {
      router.push({
        pathname: '/cusp-details' as any,
        params: { cuspName: result.cuspName, hemisphere },
      });
    }
  };

  const handleViewSignDetails = (signName: string) => {
    router.push({
      pathname: '/sign-details' as any,
      params: { signName, hemisphere },
    });
  };

  const handleExploreHoroscope = () => {
    if (result) {
      const fullSign = result.isOnCusp ? result.cuspName ?? result.primarySign : result.primarySign;
      router.push({
        pathname: '/(tabs)/astrology' as any,
        params: {
          sign: encodeURIComponent(fullSign),
          hemisphere: encodeURIComponent(hemisphere),
        },
      });
    } else {
      router.push('/(tabs)/astrology');
    }
  };

  const saveUserProfile = async (cuspResult: CuspResult) => {
    const edits: EditableProfile = {
      name,
      hemisphere,
      birthDateISO,
      birthTime,
      birthLocation,
      cuspResult,
    };
    await saveCosmicProfileEdits(edits);
    // force a fresh profile read (safe no-op if not signed in)
    await getUserData(true).catch(() => {});
  };

  const handleSaveAndExplore = async () => {
    if (!result) return;
    try {
      await saveUserProfile(result);
    } catch (e: any) {
      console.warn('[find-cusp] Save failed (non-fatal for explore):', e?.message || e);
      // still allow navigation to explore
    }
    handleExploreHoroscope();
  };

  const handleCalculate = () => {
    // Basic validation
    if (!name?.trim() || !birthDateISO || !birthTime?.trim() || !birthLocation?.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields to calculate your cusp.');
      return;
    }
    const t = validateTimeFormat(birthTime);
    if (!t.isValid) {
      Alert.alert('Invalid Time', t.message);
      return;
    }
    const c = validateCity(birthLocation);
    if (!c.isValid) {
      Alert.alert('Invalid Location', c.message);
      return;
    }

    setCalculating(true);
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)) {
        throw new Error('Date must be YYYY-MM-DD');
      }

      const timezone = detectTimezone(birthLocation, hemisphere);
      const birthInfo: BirthInfo = {
        date: birthDateISO, // ISO string (YYYY-MM-DD)
        time: birthTime, // "HH:mm"
        location: birthLocation,
        hemisphere,
        timezone,
      };

      const cuspResult = calculateCusp(birthInfo);
      const insight = getAstronomicalInsight(hemisphere);

      if (mounted.current) {
        setResult(cuspResult);
        setAstronomicalContext(insight);
        setShowResult(true);
      }
    } catch (e: any) {
      console.error('[find-cusp] Calculation error:', e);
      Alert.alert('Invalid Birth Details', 'Please check your date and time and try again.');
    } finally {
      setCalculating(false);
    }
  };

  const resetCalculator = () => {
    if (!mounted.current) return;
    setShowResult(false);
    setResult(null);
    setAstronomicalContext('');
  };

  // ---------- Result View ----------
  if (showResult && result) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.resultContainer}>
              <View style={styles.resultLogoContainer}>
                <CuspLogo size={80} />
              </View>
              <Text style={styles.title}>Your Cosmic Profile</Text>

              <LinearGradient colors={['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.1)']} style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  {result.isOnCusp ? 'You Are On A Cusp!' : 'Pure Sign Energy'}
                </Text>

                <View style={styles.signContainer}>
                  <Text style={styles.primarySign}>{result.primarySign}</Text>
                  {result.secondarySign ? (
                    <>
                      <Text style={styles.cuspConnector}>×</Text>
                      <Text style={styles.secondarySign}>{result.secondarySign}</Text>
                    </>
                  ) : null}
                </View>

                {result.cuspName ? <Text style={styles.cuspName}>{result.cuspName}</Text> : null}

                <Text style={styles.description}>{result.description}</Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sun Position:</Text>
                    <Text style={styles.detailValue}>
                      {result.sunDegree}° {result.primarySign}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Birthstone:</Text>
                    <Text style={styles.detailValue}>
                      {result.cuspName
                        ? 'Pyrope Garnet'
                        : getBirthstoneForSign(result.primarySign)?.traditional || 'Clear Quartz'}
                    </Text>
                  </View>
                </View>

                {result.cuspName ? (
                  <View style={styles.birthstoneContainer}>
                    <View style={styles.birthstoneHeader}>
                      <Text style={styles.birthstoneTitle}>Your Cusp Birthstone</Text>
                    </View>
                    <Text style={styles.birthstoneMeaning}>
                      Combines Aries’ fire and Taurus’ grounding with energetic passion and stabilizing strength.
                      Enhances courage while anchoring ambition.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionButtons}>
                  {result.isOnCusp && result.cuspName ? (
                    <TouchableOpacity style={styles.detailsButton} onPress={handleViewCuspDetails}>
                      <Text style={styles.detailsButtonText}>Explore Your Cusp</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.signDetailsButton}
                      onPress={() => handleViewSignDetails(result.primarySign)}
                    >
                      <Text style={styles.signDetailsButtonText}>Explore Your Sign</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.horoscopeButton} onPress={handleSaveAndExplore}>
                    <Text style={styles.horoscopeButtonText}>Save & View Daily Horoscope</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <LinearGradient colors={['rgba(139,157,195,0.2)', 'rgba(139,157,195,0.1)']} style={styles.contextCard}>
                <Text style={styles.contextTitle}>Cosmic Context</Text>
                <Text style={styles.contextText}>{astronomicalContext}</Text>
              </LinearGradient>

              <CosmicButton title="Calculate Again" onPress={resetCalculator} variant="outline" style={styles.button} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ---------- Form View ----------
  return (
    <View style={styles.container}>
      <CosmicBackground />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <Text style={styles.title}>ASTRO CUSP</Text>
              <Text style={styles.subtitle}>
                Enter your birth details to discover your cosmic position and current astronomical context
              </Text>

              {/* Hemisphere */}
              <View style={styles.hemisphereSection}>
                <Text style={styles.sectionTitle}>Select your hemisphere</Text>
                <Text style={styles.hemisphereNote}>
                  Your hemisphere affects seasonal timing and visible astronomical events
                </Text>

                <View style={styles.hemisphereButtons}>
                  <TouchableOpacity
                    style={[styles.hemisphereButton, hemisphere === 'Northern' && styles.hemisphereButtonActive]}
                    onPress={() => setHemisphere('Northern')}
                  >
                    <Text
                      style={[styles.hemisphereButtonText, hemisphere === 'Northern' && styles.hemisphereButtonTextActive]}
                    >
                      Northern Hemisphere
                    </Text>
                    <Text style={styles.hemisphereSubtext}>Winter solstice in December</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.hemisphereButton, hemisphere === 'Southern' && styles.hemisphereButtonActive]}
                    onPress={() => setHemisphere('Southern')}
                  >
                    <Text
                      style={[styles.hemisphereButtonText, hemisphere === 'Southern' && styles.hemisphereButtonTextActive]}
                    >
                      Southern Hemisphere
                    </Text>
                    <Text style={styles.hemisphereSubtext}>Summer solstice in December</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inputs */}
              <View style={styles.inputSection}>
                <View style={styles.inputWithIcon}>
                  <UserIcon size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput label="Your Name" placeholder="Enter your name" value={name} onChangeText={setName} />
                </View>

                <View style={styles.inputWithIcon}>
                  {/* BirthdateField returns a valid ISO string via onValidISO */}
                  <BirthdateField initialISO={birthDateISO} onValidISO={setBirthDateISO} />
                </View>

                <View style={styles.inputWithIcon}>
                  <Clock size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput
                    label="Birth Time"
                    placeholder="HH:MM (e.g., 14:30 for 2:30 PM)"
                    value={birthTime}
                    onChangeText={setBirthTime}
                  />
                </View>

                <View style={styles.birthTimeNote}>
                  <Text style={styles.birthTimeNoteText}>
                    💡 Use 24-hour format: 09:00 for 9 AM, 14:30 for 2:30 PM, 21:45 for 9:45 PM
                  </Text>
                </View>

                <LocationInput
                  label="Birth Location"
                  value={birthLocation}
                  onLocationChange={setBirthLocation}
                  placeholder="Type your birth city (e.g., Manila, Sydney)…"
                />

                <View style={styles.locationNote}>
                  <Text style={styles.locationNoteText}>
                    💡 If your town doesn’t appear in suggestions, just type it manually (e.g., “Small Town, Country”)
                  </Text>
                </View>
              </View>

              <CosmicButton
                title={
                  calculating
                    ? 'Calculating...'
                    : !name?.trim() || !birthDateISO || !birthTime?.trim() || !birthLocation?.trim()
                    ? 'Fill in all fields to calculate'
                    : 'REVEAL MY CUSP!'
                }
                onPress={handleCalculate}
                disabled={
                  calculating || !name?.trim() || !birthDateISO || !birthTime?.trim() || !birthLocation?.trim()
                }
                loading={calculating}
                style={styles.calculateButton}
              />

              {/* Quick Navigation */}
              <View style={styles.quickNavSection}>
                <Text style={styles.quickNavTitle}>Already know your sign?</Text>
                <TouchableOpacity style={styles.quickNavButton} onPress={() => router.push('/(tabs)/astrology')}>
                  <Text style={styles.quickNavText}>Go to Daily Horoscope</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 120 },

  formContainer: { flex: 1, justifyContent: 'center', paddingTop: 60 },
  resultContainer: { flex: 1, justifyContent: 'center', paddingTop: 60 },

  resultLogoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { filter: 'drop-shadow(0px 0px 15px rgba(212,175,55,0.3))' as any }
      : {
          shadowColor: '#d4af37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        }),
  },

  title: {
    fontSize: 44,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    marginBottom: 8,
    textAlign: 'center',
  },
  hemisphereSection: { marginBottom: 32 },
  hemisphereNote: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  hemisphereButtons: { gap: 12 },
  hemisphereButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(26,26,46,0.2)',
  },
  hemisphereButtonActive: { backgroundColor: 'rgba(212,175,55,0.2)', borderColor: '#d4af37' },
  hemisphereButtonText: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 4,
  },
  hemisphereButtonTextActive: { color: '#d4af37' },
  hemisphereSubtext: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    opacity: 0.8,
  },

  inputSection: { marginBottom: 24 },
  inputWithIcon: { position: 'relative' },
  inputIcon: { position: 'absolute', top: 40, left: 16, zIndex: 1 },

  calculateButton: { marginTop: 24 },

  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 24,
  },
  signContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  primarySign: { fontSize: 32, fontFamily: 'Vazirmatn-Bold', color: '#e8e8e8' },
  cuspConnector: { fontSize: 24, fontFamily: 'Vazirmatn-Bold', color: '#d4af37', marginHorizontal: 16 },
  secondarySign: { fontSize: 32, fontFamily: 'Vazirmatn-Bold', color: '#e8e8e8' },
  cuspName: { fontSize: 16, fontFamily: 'Vazirmatn-Medium', color: '#d4af37', textAlign: 'center', marginBottom: 20 },
  description: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },

  detailsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.2)',
    gap: 8,
    marginBottom: 20,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, fontFamily: 'Vazirmatn-Medium', color: '#8b9dc3' },
  detailValue: { fontSize: 14, fontFamily: 'Vazirmatn-SemiBold', color: '#d4af37' },

  birthstoneContainer: { marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.2)' },
  birthstoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  birthstoneTitle: { fontSize: 14, fontFamily: 'Vazirmatn-Medium', color: '#d4af37' },
  birthstoneMeaning: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', lineHeight: 20 },

  actionButtons: { gap: 12, marginTop: 8 },
  detailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  detailsButtonText: { fontSize: 14, fontFamily: 'Vazirmatn-SemiBold', color: '#d4af37' },

  signDetailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  signDetailsButtonText: { fontSize: 14, fontFamily: 'Vazirmatn-SemiBold', color: '#d4af37' },

  horoscopeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(139,157,195,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  horoscopeButtonText: { fontSize: 14, fontFamily: 'Vazirmatn-SemiBold', color: '#8b9dc3' },

  contextCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  contextTitle: { fontSize: 18, fontFamily: 'Vazirmatn-Bold', color: '#8b9dc3', textAlign: 'center', marginBottom: 12 },
  contextText: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 20 },

  button: { marginTop: 16 },

  birthTimeNote: {
    backgroundColor: 'rgba(139,157,195,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.2)',
  },
  birthTimeNoteText: { fontSize: 12, fontFamily: 'Vazirmatn-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 16 },

  quickNavSection: { marginTop: 32, alignItems: 'center' },
  quickNavTitle: { fontSize: 14, fontFamily: 'Vazirmatn-Regular', color: '#8b9dc3', textAlign: 'center', marginBottom: 12 },
  quickNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(26,26,46,0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  quickNavText: { fontSize: 14, fontFamily: 'Vazirmatn-Medium', color: '#8b9dc3' },
});
