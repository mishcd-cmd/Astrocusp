// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
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

// ✅ Use your existing utils/supabase (avoid ../../lib/supabase)
import { supabase } from '@/utils/supabase';

// ✅ Keep your user cache helpers
import { healUserCache, getUserData } from '@/utils/userData';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

/* ------------------------------------------------------------------
   Minimal inline cache helpers (no import from ../../lib/cache)
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

function mapHemiParam(h?: string) {
  if (h === 'NH' || h === 'Northern') return 'NH';
  if (h === 'SH' || h === 'Southern') return 'SH';
  return 'SH';
}

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

export default function TabIndex() {
  const [currentStep, setCurrentStep] = useState<'form' | 'result'>('form');
  const [hemisphere, setHemisphere] = useState<'NH' | 'SH'>('SH');
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
    // Always redirect legacy index route to astrology
    if (pathname === '/(tabs)/' || pathname === '/(tabs)/index') {
      routerRef.replace('/(tabs)/astrology');
    }
  }, [routerRef, pathname, currentStep, birthDate, birthTime, birthLocation]);

  const validateInputs = (): string | null => {
    if (!birthDate.trim()) return 'Please enter your birth date';
    if (!birthTime.trim()) return 'Please enter your birth time';
    if (!birthLocation.trim()) return 'Please enter your birth location';

    // Basic date format validation
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!dateRegex.test(birthDate)) {
      return 'Please enter date in DD/MM/YYYY format';
    }

    // Basic time format validation
    const timeRegex = /^\d{1,2}:\d{2}(\s?(AM|PM))?$/i;
    if (!timeRegex.test(birthTime)) {
      return 'Please enter time in HH:MM or HH:MM AM/PM format';
    }

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

      const birthInfo: BirthInfo = {
        date: birthDate,
        time: birthTime,
        location: birthLocation,
        hemisphere,
      };

      const cuspResult = await calculateCusp(birthInfo);
      setResult(cuspResult);

      // Get astronomical insight
      try {
        const insight = await getAstronomicalInsight(birthInfo);
        setAstronomicalInsight(insight);
      } catch (e) {
        console.warn('[TabIndex] Failed to get astronomical insight:', e);
        setAstronomicalInsight('');
      }

      // Get birthstone information
      try {
        const primarySign = cuspResult.primarySign;
        if (primarySign) {
          const birthstoneInfo = getBirthstoneForSign(primarySign);
          setBirthstone(birthstoneInfo);
        }
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

      // Save to user profile
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_location: birthLocation,
          hemisphere: hemisphere,
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

      // Clear legacy caches and heal user cache
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
    if (result) {
      router.push({
        pathname: '/cusp-details',
        params: {
          primarySign: result.primarySign,
          secondarySign: result.secondarySign,
          cuspName: result.cuspName,
          description: result.description,
          hemisphere,
        },
      });
    }
  };

  const handleViewSignDetails = () => {
    if (result) {
      router.push({
        pathname: '/sign-details',
        params: {
          sign: result.primarySign,
          hemisphere,
        },
      });
    }
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
            style={[
              styles.hemisphereButton,
              hemisphere === 'SH' && styles.hemisphereButtonActive,
            ]}
            onPress={() => setHemisphere('SH')}
          >
            <Text
              style={[
                styles.hemisphereButtonText,
                hemisphere === 'SH' && styles.hemisphereButtonTextActive,
              ]}
            >
              Southern Hemisphere
            </Text>
            <Text style={styles.hemisphereSubtext}>Australia, New Zealand, South America, Southern Africa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.hemisphereButton,
              hemisphere === 'NH' && styles.hemisphereButtonActive,
            ]}
            onPress={() => setHemisphere('NH')}
          >
            <Text
              style={[
                styles.hemisphereButtonText,
                hemisphere === 'NH' && styles.hemisphereButtonTextActive,
              ]}
            >
              Northern Hemisphere
            </Text>
            <Text style={styles.hemisphereSubtext}>North America, Europe, Asia, Northern Africa</Text>
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
            placeholder="Birth Date (DD/MM/YYYY)"
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
            placeholder="Birth Time (HH:MM AM/PM)"
            value={birthTime}
            onChangeText={setBirthTime}
          />
        </View>
        <View style={styles.inputWithIcon}>
          <View style={styles.inputIcon}>
            <MapPin size={20} color="#8b9dc3" />
          </View>
          <CosmicInput
            placeholder="Birth Location (City, Country)"
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
          title={calculating ? "Calculating..." : "Calculate My Cusp"}
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

        {result?.cuspName && (
          <Text style={styles.cuspName}>{normalizeCuspLabel(result.cuspName)}</Text>
        )}

        {result?.description && (
          <Text style={styles.description}>{result.description}</Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hemisphere</Text>
            <Text style={styles.detailValue}>{hemisphere === 'NH' ? 'Northern' : 'Southern'}</Text>
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

      {astronomicalInsight && (
        <LinearGradient
          colors={['rgba(139, 157, 195, 0.12)', 'rgba(212, 175, 55, 0.06)']}
          style={styles.contextCard}
        >
          <Text style={styles.contextTitle}>Astronomical Context</Text>
          <Text style={styles.contextText}>{astronomicalInsight}</Text>
        </LinearGradient>
      )}

      <View style={styles.button}>
        <CosmicButton
          title="Save to Profile"
          onPress={handleSaveResult}
          variant="secondary"
        />
      </View>

      <View style={styles.button}>
        <CosmicButton
          title="Calculate Another"
          onPress={handleStartOver}
          variant="outline"
        />
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
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },

  sectionTitle: { fontSize: 18, fontFamily: 'Inter-Medium', color: '#e8e8e8', marginBottom: 8, textAlign: 'center' },
  hemisphereSection: { marginBottom: 32 },
  hemisphereNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
  },
  hemisphereButtonActive: { backgroundColor: 'rgba(212, 175, 55, 0.2)', borderColor: '#d4af37' },
  hemisphereButtonText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#8b9dc3', textAlign: 'center', marginBottom: 4 },
  hemisphereButtonTextActive: { color: '#d4af37' },
  hemisphereSubtext: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', opacity: 0.8 },

  inputSection: { marginBottom: 24 },
  inputWithIcon: { position: 'relative' },
  inputIcon: { position: 'absolute', top: 40, left: 16, zIndex: 1 },

  calculateButton: { marginTop: 24 },

  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 24,
  },
  signContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  primarySign: { fontSize: 32, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8' },
  cuspConnector: { fontSize: 24, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', marginHorizontal: 16 },
  secondarySign: { fontSize: 32, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8' },
  cuspName: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#d4af37', textAlign: 'center', marginBottom: 20 },
  description: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 24, marginBottom: 20 },

  detailsContainer: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.2)', gap: 8, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#8b9dc3' },
  detailValue: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#d4af37' },

  birthstoneContainer: { marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.2)' },
  birthstoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  birthstoneTitle: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#d4af37', marginLeft: 8 },
  birthstoneMeaning: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#8b9dc3', lineHeight: 20 },

  actionButtons: { gap: 12, marginTop: 8 },
  detailsButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  detailsButtonText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#d4af37', marginRight: 8 },
  signDetailsButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  signDetailsButtonText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#d4af37', marginRight: 8 },
  horoscopeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: 'rgba(139, 157, 195, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  horoscopeButtonText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#8b9dc3', marginRight: 8 },

  contextCard: {
    borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  contextTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay-Bold', color: '#8b9dc3', textAlign: 'center', marginBottom: 12 },
  contextText: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 20 },

  button: { marginTop: 16 },

  birthTimeNote: {
    backgroundColor: 'rgba(139, 157, 195, 0.1)', borderRadius: 8, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  birthTimeNoteText: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#e8e8e8', textAlign: 'center', lineHeight: 16 },
});