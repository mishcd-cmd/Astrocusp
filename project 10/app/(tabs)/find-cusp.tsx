import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
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
import { MapPin, Clock, Calendar, ArrowRight, Gem, User as UserIcon } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import CosmicInput from '../../components/CosmicInput';
import BirthdateField from '../../components/BirthdateField';
import LocationInput from '../../components/LocationInput';
import CuspLogo from '../../components/CuspLogo';
import { calculateCusp, BirthInfo, CuspResult } from '../../utils/astrology';
import { getAstronomicalInsight } from '../../utils/astronomy';
import { getBirthstoneForCusp, getBirthstoneForSign } from '../../utils/birthstones';
import { saveCosmicProfileEdits, type EditableProfile } from '../../utils/userProfile';
import { clearUserDataPromise } from '../../utils/userData';
import { router } from 'expo-router';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
function toISODate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper to detect timezone from location
function detectTimezone(location: string): string {
  const loc = location.toLowerCase();
  
  // Australia
  if (loc.includes('sydney') || loc.includes('melbourne') || loc.includes('canberra')) return 'Australia/Sydney';
  if (loc.includes('brisbane') || loc.includes('gold coast')) return 'Australia/Brisbane';
  if (loc.includes('perth')) return 'Australia/Perth';
  if (loc.includes('adelaide')) return 'Australia/Adelaide';
  if (loc.includes('darwin')) return 'Australia/Darwin';
  if (loc.includes('hobart')) return 'Australia/Hobart';
  
  // Major cities
  if (loc.includes('new york')) return 'America/New_York';
  if (loc.includes('los angeles') || loc.includes('san francisco')) return 'America/Los_Angeles';
  if (loc.includes('chicago')) return 'America/Chicago';
  if (loc.includes('london')) return 'Europe/London';
  if (loc.includes('paris')) return 'Europe/Paris';
  if (loc.includes('berlin')) return 'Europe/Berlin';
  if (loc.includes('tokyo')) return 'Asia/Tokyo';
  if (loc.includes('beijing')) return 'Asia/Shanghai';
  if (loc.includes('mumbai')) return 'Asia/Kolkata';
  
  // Default fallbacks by hemisphere
  if (hemisphere === 'Southern') return 'Australia/Sydney';
  return 'Europe/London';
}

// Flexible date parser constants
const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function clampYear(y: number) {
  // 2-digit year handling: 00-29 => 2000-2029, 30-99 => 1930-1999
  if (y < 100) return y <= 29 ? 2000 + y : 1900 + y;
  return y;
}

function makeLocalDate(y: number, m: number, d: number) {
  // m is 1-based
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0); // noon local to dodge DST edges
  // validate (JS will roll invalid dates, e.g. 31/02 -> 03/03)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return new Date(NaN);
  }
  return dt;
}

function parseDateFlexible(input: string): Date {
  if (!input) return new Date(NaN);
  const raw = input.replace(/\u00A0/g, ' ').trim(); // remove NBSPs
  const s = raw.replace(/[.,]/g, '/').replace(/-/g, '/').replace(/\s+/g, ' ');

  // 1) DD/MM/YYYY or D/M/YYYY (also accepts two-digit year)
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = clampYear(parseInt(m[3], 10));
    return makeLocalDate(y, mo, d);
  }

  // 2) YYYY/MM/DD
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    return makeLocalDate(y, mo, d);
  }

  // 3) DD Mon YYYY or DD Month YYYY (case-insensitive)
  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2}|\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const monName = m[2].toLowerCase();
    const mo = MONTHS[monName];
    const y = clampYear(parseInt(m[3], 10));
    if (mo) return makeLocalDate(y, mo, d);
  }

  // 4) As a last resort, try native Date parsing
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? new Date(NaN) : fallback;
}

export default function FindCuspCalculator() {
  const [name, setName] = useState('');
  const [birthDateISO, setBirthDateISO] = useState<string | null>(null);
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [hemisphere, setHemisphere] = useState<'Northern' | 'Southern'>('Northern');
  const [result, setResult] = useState<CuspResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [astronomicalContext, setAstronomicalContext] = useState('');
  const [calculating, setCalculating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const parseDateString = (dateString: string): Date => {
    console.log('🔍 [find-cusp] Parsing date string:', dateString);
    
    if (!dateString || dateString.trim() === '') {
      throw new Error('Empty date string');
    }
    
    const parts = dateString.split(/[-/]/);
    console.log('🔍 [find-cusp] Date parts:', parts);
    
    if (parts.length === 3) {
      // Handle DD/MM/YYYY format
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      console.log('🔍 [find-cusp] Parsed date components:', { day, month, year });
      
      // Validate the parsed values
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error('Invalid date components');
      }
      
      if (year < 1900 || year > 2100) {
        throw new Error('Year must be between 1900 and 2100');
      }
      
      if (month < 1 || month > 12) {
        throw new Error('Month must be between 1 and 12');
      }
      
      if (day < 1 || day > 31) {
        throw new Error('Day must be between 1 and 31');
      }
      
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Fallback to standard Date parsing
    const fallbackDate = new Date(dateString);
    if (isNaN(fallbackDate.getTime())) {
      throw new Error('Unable to parse date');
    }
    return fallbackDate;
  };

  const handleDateChange = (text: string) => {
    // Allow digits, slash, dash, space, letters (for month names), dots
    const cleaned = text.replace(/[^0-9A-Za-z\/\-\.\s]/g, '');
    setBirthDate(cleaned);
  };

  const handleCalculate = () => {
    debugFieldStates();
    
    // PETER DEBUG: Enhanced calculation logging
    const isPeter = name?.toLowerCase().includes('peter') || 
                   (typeof navigator !== 'undefined' && navigator.userAgent.includes('iPad'));
    
    if (isPeter) {
      console.log('🔍 [PETER DEBUG] Calculate button clicked with data:', {
        name,
        birthDateISO,
        birthTime,
        birthLocation,
        hemisphere,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
    }
    
    console.log('🚀 [find-cusp] Calculate button pressed with data:', {
      name: name?.trim(),
      birthDateISO,
      birthTime: birthTime?.trim(),
      birthLocation: birthLocation?.trim(),
      hemisphere
    });
    
    if (!name || !birthDateISO || !birthTime || !birthLocation) {
      if (isPeter) {
        console.log('🔍 [PETER DEBUG] Validation failed: Missing fields');
      }
      console.log('❌ [find-cusp] Validation failed - missing fields:', {
        hasName: !!name?.trim(),
        hasBirthDate: !!birthDateISO,
        hasTime: !!birthTime?.trim(),
        hasLocation: !!birthLocation?.trim()
      });
      Alert.alert('Missing Information', 'Please fill in all fields to calculate your cusp.');
      return;
    }

    // Validate time format before proceeding
    const timeValidation = validateTimeFormat(birthTime);
    if (!timeValidation.isValid) {
      if (isPeter) {
        console.log('🔍 [PETER DEBUG] Validation failed:', timeValidation.message);
      }
      console.log('❌ [find-cusp] Time validation failed:', timeValidation.message);
      Alert.alert('Invalid Time', timeValidation.message);
      return;
    }

    const cityValidation = validateCity(birthLocation);
    if (!cityValidation.isValid) {
      if (isPeter) {
        console.log('🔍 [PETER DEBUG] Validation failed:', cityValidation.message);
      }
      console.log('❌ [find-cusp] City validation failed:', cityValidation.message);
      Alert.alert('Invalid Location', cityValidation.message);
      return;
    }

    setCalculating(true);
    
    try {
      // Validate ISO date string format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)) {
        console.log('❌ [find-cusp] Invalid ISO date format:', birthDateISO);
        throw new Error('Invalid date format');
      }

      console.log('🔍 [find-cusp] Calculating cusp for:', {
        name,
        birthDateISO,
        birthTime,
        birthLocation,
        hemisphere
      });

      // Detect timezone from location
      const timezone = detectTimezone(birthLocation, hemisphere);

      const birthInfo: BirthInfo = {
        date: birthDateISO, // Keep as string
        time: birthTime,
        location: birthLocation,
        hemisphere,
        timezone,
      };

      const cuspResult = calculateCusp(birthInfo);
      const astronomicalInsight = getAstronomicalInsight(hemisphere);

      if (isPeter) {
        console.log('🔍 [PETER DEBUG] Cusp calculation result:', {
          isOnCusp: cuspResult.isOnCusp,
          primarySign: cuspResult.primarySign,
          secondarySign: cuspResult.secondarySign,
          cuspName: cuspResult.cuspName,
          sunDegree: cuspResult.sunDegree
        });
      }

      console.log('✅ [find-cusp] Calculation successful:', {
        isOnCusp: cuspResult.isOnCusp,
        primarySign: cuspResult.primarySign,
        cuspName: cuspResult.cuspName
      });
      if (isMounted.current) {
        setResult(cuspResult);
        setAstronomicalContext(astronomicalInsight);
        setShowResult(true);
      }
    } catch (error) {
      console.error('❌ [find-cusp] Calculation error:', error);
      Alert.alert(
        'Invalid Birth Date',
        'Please enter a valid birth date in DD/MM/YYYY format (e.g., 18/06/1997).'
      );
    } finally {
      setCalculating(false);
    }
  };

  const resetCalculator = () => {
    if (!isMounted.current) return;
    setShowResult(false);
    setResult(null);
    setAstronomicalContext('');
  };

  const handleViewCuspDetails = () => {
    if (result?.cuspName) {
      router.push({
        pathname: '/cusp-details' as any,
        params: { 
          cuspName: result.cuspName,
          hemisphere: hemisphere
        }
      });
    }
  };

  const handleViewSignDetails = (signName: string) => {
    router.push({
      pathname: '/sign-details' as any,
      params: { 
        signName: signName,
        hemisphere: hemisphere
      }
    });
  };

  const handleExploreHoroscope = () => {
    console.log('=== BUTTON CLICKED: Navigating to horoscope with params ===');
    
    // Navigate with full sign and hemisphere parameters
    // CRITICAL: For cusp users, ALWAYS use the full cuspName - NEVER fallback to primarySign
    if (result) {
      let fullSign: string;
      if (result.isOnCusp) {
        if (!result.cuspName) {
          console.error('❌ [find-cusp] CRITICAL: Cusp result missing cuspName!', result);
          Alert.alert('Error', 'Cusp calculation incomplete. Please try again.');
          return;
        }
        fullSign = result.cuspName;
      } else {
        fullSign = result.primarySign;
      }
      console.log('🔗 [nav] Navigating with params:', { sign: fullSign, hemisphere });
      
      router.push({
        pathname: '/(tabs)/astrology' as any,
        params: {
          sign: encodeURIComponent(fullSign),
          hemisphere: encodeURIComponent(hemisphere)
        }
      });
    } else {
      router.push('/(tabs)/astrology');
    }
  };

  const handleSaveAndExplore = async () => {
    if (!result) return;
    
    try {
      await saveUserProfile(result);
      // After successful save, navigate to horoscope
      handleExploreHoroscope();
    } catch (error) {
      console.error('❌ [find-cusp] Save failed:', error);
      // Don't navigate if save failed
    }
  };

  const validateCity = (location: string): { isValid: boolean; message: string } => {
    const trimmed = location.trim();
    
    // Check minimum length
    if (trimmed.length < 2) {
      return { isValid: false, message: 'Please enter a valid city name (at least 2 characters).' };
    }
    
    // Check for obvious invalid entries
    const invalidEntries = [
      'test', 'testing', 'abc', 'xyz', 'asdf', 'qwerty',
      'parisone', 'cityname', 'unknown', 'none', 'n/a'
    ];
    
    if (invalidEntries.includes(trimmed.toLowerCase())) {
      return { isValid: false, message: `"${trimmed}" is not a valid city. Please enter your actual birth city (e.g., "Sydney, Australia" or "New York, USA").` };
    }
    
    // Check for numbers only
    if (/^\d+$/.test(trimmed)) {
      return { isValid: false, message: 'Please enter a city name, not just numbers.' };
    }
    
    // Check for special characters only
    if (/^[^a-zA-Z]+$/.test(trimmed)) {
      return { isValid: false, message: 'Please enter a valid city name with letters.' };
    }
    
    // Suggest format if no comma (country separator)
    if (!trimmed.includes(',') && trimmed.length > 0) {
      // This is just a warning, not blocking
      console.log('City format suggestion: Consider adding country (e.g., "Sydney, Australia")');
    }
    
    return { isValid: true, message: '' };
  };

  const validateTimeFormat = (time: string): { isValid: boolean; message: string } => {
    if (!time || time.trim() === '') {
      return { isValid: false, message: 'Time is required' };
    }
    
    const trimmed = time.trim();
    
    // Check for basic HH:MM format
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
      return { isValid: false, message: 'Time must be in HH:MM format (e.g., 14:30 for 2:30 PM)' };
    }
    
    const [hoursStr, minutesStr] = trimmed.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Validate 24-hour format
    if (hours < 0 || hours > 23) {
      return { isValid: false, message: 'Hours must be between 00 and 23. For example: 14:30 for 2:30 PM, 09:15 for 9:15 AM' };
    }
    
    if (minutes < 0 || minutes > 59) {
      return { isValid: false, message: 'Minutes must be between 00 and 59' };
    }
    
    return { isValid: true, message: '' };
  };

  // Debug function to check all field states
  const debugFieldStates = () => {
    console.log('🔍 [find-cusp] Current field states:', {
      name: { value: name, hasValue: !!name?.trim(), length: name?.length },
      birthDateISO: { value: birthDateISO, hasValue: !!birthDateISO, format: birthDateISO ? 'valid' : 'missing' },
      birthTime: { value: birthTime, hasValue: !!birthTime?.trim(), length: birthTime?.length },
      birthLocation: { value: birthLocation, hasValue: !!birthLocation?.trim(), length: birthLocation?.length },
      hemisphere: { value: hemisphere },
      allFieldsFilled: !!(name?.trim() && birthDateISO && birthTime?.trim() && birthLocation?.trim())
    });
  };

  const saveUserProfile = async (cuspResult: CuspResult) => {
    try {
      console.log('🔍 [saveUserProfile] Starting profile save process...');

      // Prepare edits for the safe save function
      const edits: EditableProfile = {
        name: name,
        hemisphere: hemisphere,
        birthDateISO: birthDateISO,
        birthTime: birthTime,
        birthLocation: birthLocation,
        cuspResult: cuspResult,
      };
      
      // Use the new safe save function
      await saveCosmicProfileEdits(edits);
      
      // Force fresh data fetch to update the app immediately
      const { getUserData } = await import('@/utils/userData');
      const freshProfile = await getUserData(true);
      console.log('✅ [find-cusp] Fresh profile loaded after save:', {
        email: freshProfile?.email,
        hemisphere: freshProfile?.hemisphere,
        primarySign: freshProfile?.cuspResult?.primarySign
      });
      
      Alert.alert(
        'Profile Saved!',
        'Your cosmic profile has been saved successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ [saveUserProfile] Error:', error);
      Alert.alert('Save Error', `Failed to save profile: ${error?.message || 'Unknown error'}`);
    }
  };

  if (showResult && result) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.resultContainer}>
              {/* Logo at top of results */}
              <View style={styles.resultLogoContainer}>
                <CuspLogo size={80} />
              </View>
              
              <Text style={styles.title}>Your Cosmic Profile</Text>
              
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.resultCard}
              >
                <Text style={styles.resultTitle}>
                  {result.isOnCusp ? 'You Are On A Cusp!' : 'Pure Sign Energy'}
                </Text>
                
                <View style={styles.signContainer}>
                  <Text style={styles.primarySign}>{result.primarySign}</Text>
                  {result.secondarySign && (
                    <>
                      <Text style={styles.cuspConnector}>×</Text>
                      <Text style={styles.secondarySign}>{result.secondarySign}</Text>
                    </>
                  )}
                </View>
                
                {result.cuspName && (
                  <Text style={styles.cuspName}>{result.cuspName}</Text>
                )}
                
                <Text style={styles.description}>{result.description}</Text>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sun Position:</Text>
                    <Text style={styles.detailValue}>{result.sunDegree}° {result.primarySign}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Birthstone:</Text>
                    <Text style={styles.detailValue}>
                      {result.cuspName ? 'Pyrope Garnet' : getBirthstoneForSign(result.primarySign)?.traditional || 'Clear Quartz'}
                    </Text>
                  </View>
                </View>

                {/* Birthstone Info */}
                {result.cuspName && (
                  <View style={styles.birthstoneContainer}>
                    <View style={styles.birthstoneHeader}>
                      <Text style={styles.birthstoneTitle}>Your Cusp Birthstone</Text>
                    </View>
                    <Text style={styles.birthstoneMeaning}>
                      Combines Aries' fire and Taurus' grounding with energetic passion and stabilizing strength. Enhances courage while anchoring ambition.
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {/* Cusp Details Button */}
                  {result.isOnCusp && result.cuspName && (
                    <TouchableOpacity 
                      style={styles.detailsButton} 
                      onPress={handleViewCuspDetails}
                    >
                      <Text style={styles.detailsButtonText}>Explore Your Cusp</Text>
                    </TouchableOpacity>
                  )}
                  {/* Horoscope Button */}
                  {/* Pure Sign Details Button */}
                  {!result.isOnCusp && result.primarySign && (
                    <TouchableOpacity 
                      style={styles.signDetailsButton} 
                      onPress={() => handleViewSignDetails(result.primarySign)}
                    >
                      <Text style={styles.signDetailsButtonText}>Explore Your Sign</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.horoscopeButton} 
                    onPress={handleSaveAndExplore}
                  >
                    <Text style={styles.horoscopeButtonText}>Save & View Daily Horoscope</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Astronomical Context */}
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.contextCard}
              >
                <Text style={styles.contextTitle}>Cosmic Context</Text>
                <Text style={styles.contextText}>{astronomicalContext}</Text>
              </LinearGradient>

              <CosmicButton
                title="Calculate Again"
                onPress={resetCalculator}
                variant="outline"
                style={styles.button}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

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

              <View style={styles.hemisphereSection}>
                <Text style={styles.sectionTitle}>Select your hemisphere</Text>
                <Text style={styles.hemisphereNote}>
                  Your hemisphere affects seasonal timing and visible astronomical events
                </Text>
                <View style={styles.hemisphereButtons}>
                  <TouchableOpacity
                    style={[
                      styles.hemisphereButton,
                      hemisphere === 'Northern' && styles.hemisphereButtonActive,
                    ]}
                    onPress={() => setHemisphere('Northern')}
                  >
                    <Text
                      style={[
                        styles.hemisphereButtonText,
                        hemisphere === 'Northern' && styles.hemisphereButtonTextActive,
                      ]}
                    >
                      Northern Hemisphere
                    </Text>
                    <Text style={styles.hemisphereSubtext}>
                      Winter solstice in December
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.hemisphereButton,
                      hemisphere === 'Southern' && styles.hemisphereButtonActive,
                    ]}
                    onPress={() => setHemisphere('Southern')}
                  >
                    <Text
                      style={[
                        styles.hemisphereButtonText,
                        hemisphere === 'Southern' && styles.hemisphereButtonTextActive,
                      ]}
                    >
                      Southern Hemisphere
                    </Text>
                    <Text style={styles.hemisphereSubtext}>
                      Summer solstice in December
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <View style={styles.inputWithIcon}>
                  <UserIcon size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput
                    label="Your Name"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputWithIcon}>
                  <BirthdateField
                    initialISO={birthDateISO}
                    onValidISO={setBirthDateISO}
                  />
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
                    placeholder="Type your birth city (e.g., Manila, Sydney)..."
                  />

                  <View style={styles.locationNote}>
                    <Text style={styles.locationNoteText}>
                      💡 If your town doesn't appear in suggestions, just type it manually (e.g., "Small Town, Country")
                    </Text>
                  </View>
                </View>
              </View>

              <CosmicButton
                title={calculating ? "Calculating..." : (!name?.trim() || !birthDateISO || !birthTime?.trim() || !birthLocation?.trim()) ? "Fill in all fields to calculate" : "REVEAL MY CUSP!"}
                onPress={handleCalculate}
                disabled={calculating || !name?.trim() || !birthDateISO || !birthTime?.trim() || !birthLocation?.trim()}
                loading={calculating}
                style={styles.calculateButton}
              />
              
              {/* Quick Navigation for Existing Users */}
              <View style={styles.quickNavSection}>
                <Text style={styles.quickNavTitle}>Already know your sign?</Text>
                <TouchableOpacity 
                  style={styles.quickNavButton}
                  onPress={() => router.push('/(tabs)/astrology')}
                >
                  <Text style={styles.quickNavText}>Go to Daily Horoscope</Text>
                </TouchableOpacity>
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
    paddingBottom: 120,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    ...(Platform.OS === 'web' ? {
      filter: 'drop-shadow(0px 0px 15px rgba(212, 175, 55, 0.3))',
    } : {
      shadowColor: '#d4af37',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
    }),
  },
  resultLogoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    ...(Platform.OS === 'web' ? {
      filter: 'drop-shadow(0px 0px 15px rgba(212, 175, 55, 0.3))',
    } : {
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
  hemisphereSection: {
    marginBottom: 32,
  },
  hemisphereNote: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  hemisphereButtons: {
    gap: 12,
  },
  hemisphereButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
  },
  hemisphereButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },
  hemisphereButtonText: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 4,
  },
  hemisphereButtonTextActive: {
    color: '#d4af37',
  },
  hemisphereSubtext: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    opacity: 0.8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 1,
  },
  calculateButton: {
    marginTop: 24,
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 24,
  },
  signContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primarySign: {
    fontSize: 32,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
  },
  cuspConnector: {
    fontSize: 24,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    marginHorizontal: 16,
  },
  secondarySign: {
    fontSize: 32,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
  },
  cuspName: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Medium',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 20,
  },
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
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    gap: 8,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
  },
  birthstoneContainer: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  birthstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  birthstoneTitle: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#d4af37',
  },
  birthstoneMeaning: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  detailsButtonText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
    marginRight: 8,
  },
  signDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  signDetailsButtonText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
    marginRight: 8,
  },
  horoscopeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  horoscopeButtonText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#8b9dc3',
    marginRight: 8,
  },
  contextCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  contextTitle: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Bold',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 12,
  },
  contextText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
  },
  birthTimeNote: {
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  birthTimeNoteText: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 16,
  },
  quickNavSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  quickNavTitle: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  quickNavText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
  },
  locationNote: {
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  locationNoteText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 16,
  },
});