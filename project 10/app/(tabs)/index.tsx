// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
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
import { MapPin, Clock, Calendar, ArrowRight, Gem } from 'lucide-react-native';
import { router, useRouter, usePathname } from 'expo-router';

import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';
import CosmicInput from '@/components/CosmicInput';
import CuspLogo from '@/components/CuspLogo';

import { calculateCusp, BirthInfo, CuspResult } from '@/utils/astrology';
import { getAstronomicalInsight } from '@/utils/astronomy';
import { getBirthstoneForSign } from '@/utils/birthstones';
import { supabase } from '@/utils/supabase';
import { healUserCache } from '@/utils/userData';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

/* ------------------------------------------------------------------
   Minimal inline cache helpers
-------------------------------------------------------------------*/
let RNAsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RNAsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  RNAsyncStorage = null;
}
const webStore =
  typeof window !== 'undefined' && (window as any).localStorage
    ? (window as any).localStorage
    : null;

const storage = {
  async getAllKeys(): Promise<string[]> {
    if (RNAsyncStorage) return RNAsyncStorage.getAllKeys();
    if (webStore) return Object.keys(webStore);
    return [];
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (RNAsyncStorage) return RNAsyncStorage.multiRemove(keys);
    if (webStore) keys.forEach((k) => webStore.removeItem(k));
  },
};

async function purgeLegacyCachesOnSignIn(): Promise<void> {
  try {
    const keys = await storage.getAllKeys();
    const toRemove = keys.filter(
      (k) =>
        k === 'userData' ||
        k.startsWith('monthly_SH_') ||
        k.startsWith('monthly_NH_')
    );
    if (toRemove.length) await storage.multiRemove(toRemove);
  } catch (e) {
    console.warn('[cache] purgeLegacyCachesOnSignIn error', e);
  }
}

async function purgeUserCacheByEmail(email: string): Promise<void> {
  try {
    const lower = (email || '').toLowerCase();
    const keys = await storage.getAllKeys();
    const toRemove = keys.filter(
      (k) => k.startsWith(`userData:${lower}`) || k.startsWith(`monthly:${lower}:`)
    );
    if (toRemove.length) await storage.multiRemove(toRemove);
  } catch (e) {
    console.warn('[cache] purgeUserCacheByEmail error', e);
  }
}
/* ------------------------------------------------------------------*/

function normalizeCuspLabel(label?: string | null): string | undefined {
  if (!label) return undefined;
  let s = label.trim().replace(/[—–]/g, '–').replace(/\s+/g, ' ').trim();
  if (!/Cusp$/i.test(s)) s = `${s} Cusp`;
  s = s
    .split('–')
    .map((part) =>
      part
        .trim()
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
        .join(' ')
    )
    .join('–');
  return s;
}

// Local UI choice ('NH' | 'SH')
type HemiShort = 'NH' | 'SH';
// Domain type expected by utils ('Northern' | 'Southern')
type HemiLong = 'Northern' | 'Southern';

const toLongHemisphere = (h: HemiShort): HemiLong => (h === 'NH' ? 'Northern' : 'Southern');

export default function TabIndex() {
  const [currentStep, setCurrentStep] = useState<'form' | 'result'>('form');
  const [hemisphere, setHemisphere] = useState<HemiShort>('SH');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CuspResult | null>(null);
  const [astronomicalInsight, setAstronomicalInsight] = useState<string>('');
  const [birthstone, setBirthstone] = useState<{ name: string; meaning: string } | null>(null);

  const routerRef = useRouter();
  const pathname = usePathname();

  // Handle legacy routing - redirect to main astrology tab if accessed directly
  useEffect(() => {
    if (pathname === '/(tabs)/' || pathname === '/(tabs)/index') {
      routerRef.replace('/(tabs)/astrology');
    }
  }, [routerRef, pathname]);

  const validateInputs = (): string | null => {
    if (!birthDate.trim()) return 'Please enter your birth date';
    if (!birthTime.trim()) return 'Please enter your birth time';
    if (!birthLocation.trim()) return 'Please enter your birth location';

    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!dateRegex.test(birthDate)) return 'Please enter date in DD/MM/YYYY format';

    const timeRegex = /^\d{1,2}:\d{2}(\s?(AM|PM))?$/i;
    if (!timeRegex.test(birthTime)) return 'Please enter time in HH:MM or HH:MM AM/PM format';

    return null;
  };

  const handleCalculate = async () => {
    try {
      const validationError = validateInputs();
      if (validationError) {
        Alert.alert('Input Error', validationError);
        return;
      }

      setCalculating(true);

      // Map to domain hemisphere for utils
      const hemiLong: HemiLong = toLongHemisphere(hemisphere);

      const birthInfo: BirthInfo = {
        date: birthDate,
        time: birthTime,
        location: birthLocation,
        hemisphere: hemiLong,
      };

      const cuspResult = await calculateCusp(birthInfo);
      setResult(cuspResult);

      // astronomy util expects a hemisphere string (HemiLong)
      try {
        const insight = await getAstronomicalInsight(hemiLong);
        setAstronomicalInsight(insight || '');
      } catch (e) {
        console.warn('[TabIndex] Failed to get astronomical insight:', e);
        setAstronomicalInsight('');
      }

      // Get birthstone info safely
      try {
        const primarySign = cuspResult.primarySign;
        const bs = primarySign ? getBirthstoneForSign(primarySign) : undefined;
        setBirthstone(bs ? { name: bs.traditional ?? bs.sign ?? 'Birthstone', meaning: bs.meaning ?? '' } : null);
      } catch (e) {
        console.warn('[TabIndex] Failed to get birthstone:', e);
        setBirthstone(null);
      }

      setCurrentStep('result');
    } catch (error: any) {
      console.error('[TabIndex] Calculate error:', error);
      Alert.alert(
        'Calculation Error',
        error?.message || 'Unable to calculate your cusp. Please check your inputs and try again.'
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveResult = async () => {
    if (!result) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to save your results');
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_location: birthLocation,
          hemisphere: toLongHemisphere(hemisphere),
          primary_sign: result.primarySign,
          secondary_sign: result.secondarySign,
          cusp_name: normalizeCuspLabel(result.cuspName),
          cusp_description: result.description,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[TabIndex] Save error:', error);
        Alert.alert('Save Error', 'Unable to save your results. Please try again.');
        return;
      }

      await purgeLegacyCachesOnSignIn();
      await purgeUserCacheByEmail(user.email || '');
      await healUserCache();

      Alert.alert(
        'Results Saved!',
        'Your cusp calculation has been saved to your profile.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/astrology') }]
      );
    } catch (error: any) {
      console.error('[TabIndex] Save result error:', error);
      Alert.alert('Save Error', error?.message || 'Unable to save your results');
    }
  };

  const handleViewDetails = () => {
    if (!result) return;
    router.push({
      pathname: '/cusp-details',
      params: {
        primarySign: result.primarySign,
        secondarySign: result.secondarySign,
        cuspName: result.cuspName,
        description: result.description,
        hemisphere: toLongHemisphere(hemisphere),
      },
    });
  };

  const handleViewSignDetails = () => {
    if (!result) return;
    router.push({
      pathname: '/sign-details',
      params: {
        sign: result.primarySign,
        hemisphere: toLongHemisphere(hemisphere),
      },
    });
  };

  const handleViewHoroscope = () => {
    router.push('/(tabs)/astrology');
  };

  const handleStartOver = () => {
    setCurrentStep('form');
    setResult(null);
    setAstronomicalInsight('');
    setBirthstone(null);
    setBirthDate('');
    setBirthTime('');
    setBirthLocation('');
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.logoContainer}>
        <CuspLogo size={80} />
      </View>

      <Text style={styles.title}>Discover Your Cusp</Text>
      <Text style={styles.subtitle}>
        Find your unique astrological position between the traditional zodiac signs
      </Text>

      <View style={styles.hemisphereSection}>
        <Text style={styles.sectionTitle}>Select Your Hemisphere</Text>
        <Text style={styles.hemisphereNote}>
          Your location affects the seasonal energy and planetary influences in your chart
        </Text>
        <View style={styles.hemisphereButtons}>
          <TouchableOpacity
            style={[styles.hemisphereButton, hemisphere === 'SH' && styles.hemisphereButtonActive]}
            onPress={() => setHemisphere('SH')}
          >
            <Text style={[styles.hemisphereButtonText, hemisphere === 'SH' && styles.hemisphereButtonTextActive]}>
              Southern Hemisphere
            </Text>
            <Text style={styles.hemisphereSubtext}>
              Australia, New Zealand, South America, Southern Africa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hemisphereButton, hemisphere === 'NH' && styles.hemisphereButtonActive]}
            onPress={() => setHemisphere('NH')}
          >
            <Text style={[styles.hemisphereButtonText, hemisphere === 'NH' && styles.hemisphereButtonTextActive]}>
              Northern Hemisphere
            </Text>
            <Text style={styles.hemisphereSubtext}>
              North America, Europe, Asia, Northern Africa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Birth Information</Text>
        <View style={styles.inputWithIcon}>
          <View style={styles.inputIcon}>
            <Calendar size={20} color="#8b9dc3" />
          </View>
          <CosmicInput
            label="Birth Date"
            placeholder="DD/MM/YYYY"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputWithIcon}>
          <View style={styles.inputIcon}>
            <Clock size={20} color="#8b9dc3" />
          </View>
          <CosmicInput
            label="Birth Time"
            placeholder="HH:MM or HH:MM AM/PM"
            value={birthTime}
            onChangeText={setBirthTime}
          />
        </View>
        <View style={styles.inputWithIcon}>
          <View style={styles.inputIcon}>
            <MapPin size={20} color="#8b9dc3" />
          </View>
          <CosmicInput
            label="Birth Location"
            placeholder="City, Country"
            value={birthLocation}
            onChangeText={setBirthLocation}
          />
        </View>
        <View style={styles.birthTimeNote}>
          <Text style={styles.birthTimeNoteText}>
            💡 Tip: Your exact birth time is crucial for accurate cusp calculation. 
            Check your birth certificate for the most precise time.
          </Text>
        </View>
      </View>

      <View style={styles.calculateButton}>
        <CosmicButton
          title={calculating ? 'Calculating...' : 'Calculate My Cusp'}
          onPress={handleCalculate}
          disabled={calculating}
          loading={calculating}
        />
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={styles.resultContainer}>
      <View style={styles.resultLogoContainer}>
        <CuspLogo size={60} />
      </View>

      <LinearGradient
        colors={['rgba(212, 175, 55, 0.15)', 'rgba(139, 157, 195, 0.08)']}
        style={styles.resultCard}
      >
        <Text style={styles.resultTitle}>Your Cusp Result</Text>

        <View style={styles.signContainer}>
          <Text style={styles.primarySign}>{result?.primarySign}</Text>
          <Text style={styles.cuspConnector}>–</Text>
          <Text style={styles.secondarySign}>{result?.secondarySign}</Text>
        </View>

        {!!result?.cuspName && (
          <Text style={styles.cuspName}>{normalizeCuspLabel(result.cuspName)}</Text>
        )}

        {!!result?.description && (
          <Text style={styles.description}>{result.description}</Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hemisphere</Text>
            <Text style={styles.detailValue}>{toLongHemisphere(hemisphere)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Birth Date</Text>
            <Text style={styles.detailValue}>{birthDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Birth Time</Text>
            <Text style={styles.detailValue}>{birthTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{birthLocation}</Text>
          </View>
        </View>

        {birthstone && (
          <View style={styles.birthstoneContainer}>
            <View style={styles.birthstoneHeader}>
              <Gem size={16} color="#d4af37" />
              <Text style={styles.birthstoneTitle}>{birthstone.name}</Text>
            </View>
            <Text style={styles.birthstoneMeaning}>{birthstone.meaning}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails}>
            <Text style={styles.detailsButtonText}>View Cusp Details</Text>
            <ArrowRight size={16} color="#d4af37" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signDetailsButton} onPress={handleViewSignDetails}>
            <Text style={styles.signDetailsButtonText}>View Sign Details</Text>
            <ArrowRight size={16} color="#d4af37" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.horoscopeButton} onPress={handleViewHoroscope}>
            <Text style={styles.horoscopeButtonText}>View Today's Horoscope</Text>
            <ArrowRight size={16} color="#8b9dc3" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!!astronomicalInsight && (
        <LinearGradient
          colors={['rgba(139, 157, 195, 0.12)', 'rgba(212, 175, 55, 0.06)']}
          style={styles.contextCard}
        >
          <Text style={styles.contextTitle}>Astronomical Context</Text>
          <Text style={styles.contextText}>{astronomicalInsight}</Text>
        </LinearGradient>
      )}

      <View style={styles.button}>
        <CosmicButton title="Save to Profile" onPress={handleSaveResult} variant="secondary" />
      </View>

      <View style={styles.button}>
        <CosmicButton title="Calculate Another" onPress={handleStartOver} variant="outline" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentStep === 'form' ? renderForm() : renderResult()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 120 },

  formContainer: { flex: 1, justifyContent: 'center', paddingTop: 60 },
  resultContainer: { flex: 1, justifyContent: 'center', paddingTop: 60 },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: {
        // @ts-ignore web-only filter
        filter: 'drop-shadow(0px 0px 15px rgba(212, 175, 55, 0.3))',
      },
      default: {
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
    }),
  },
  resultLogoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        // @ts-ignore web-only filter
        filter: 'drop-shadow(0px 0px 15px rgba(212, 175, 55, 0.3))',
      },
      default: {
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
    }),
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aab4d4',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  hemisphereSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  hemisphereNote: {
    fontSize: 13,
    color: '#aab4d4',
    marginBottom: 12,
  },
  hemisphereButtons: {
    gap: 12,
  },
  hemisphereButton: {
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139,157,195,0.06)',
  },
  hemisphereButtonActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.45)',
  },
  hemisphereButtonText: {
    color: '#e5e7eb',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  hemisphereButtonTextActive: {
    color: '#f3f4f6',
  },
  hemisphereSubtext: {
    color: '#aab4d4',
    fontSize: 12,
    lineHeight: 16,
  },

  inputSection: {
    marginTop: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,157,195,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.25)',
  },
  birthTimeNote: {
    marginTop: 8,
    backgroundColor: 'rgba(139,157,195,0.08)',
    borderColor: 'rgba(139,157,195,0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  birthTimeNoteText: {
    color: '#c7d2fe',
    fontSize: 12,
    lineHeight: 18,
  },

  calculateButton: { marginTop: 16 },

  resultCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(12,16,28,0.4)',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  signContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  primarySign: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f3f4f6',
  },
  cuspConnector: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d4af37',
  },
  secondarySign: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  cuspName: {
    fontSize: 14,
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },

  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,157,195,0.25)',
    paddingTop: 12,
    marginTop: 8,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#aab4d4',
    fontSize: 13,
  },
  detailValue: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },

  birthstoneContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  birthstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  birthstoneTitle: {
    color: '#f1e9c6',
    fontWeight: '800',
  },
  birthstoneMeaning: {
    color: '#e5e7eb',
    fontSize: 13,
    lineHeight: 18,
  },

  actionButtons: {
    marginTop: 12,
    gap: 10,
  },
  detailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#f1e9c6',
    fontWeight: '700',
  },
  signDetailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signDetailsButtonText: {
    color: '#f1e9c6',
    fontWeight: '700',
  },
  horoscopeButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
    backgroundColor: 'rgba(139,157,195,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horoscopeButtonText: {
    color: '#aab4d4',
    fontWeight: '700',
  },

  contextCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.25)',
    backgroundColor: 'rgba(12,16,28,0.35)',
    marginTop: 12,
    marginBottom: 8,
  },
  contextTitle: {
    color: '#e5e7eb',
    fontWeight: '800',
    marginBottom: 6,
  },
  contextText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    marginTop: 8,
  },
});
