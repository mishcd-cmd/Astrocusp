import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Save, X, Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';
import BirthdateField from '../../components/BirthdateField';
import { getCosmicProfile, saveCosmicProfile, type CosmicProfile } from '@/utils/userProfile';
import { calculateCusp, BirthInfo } from '@/utils/astrology';
import { supabase } from '@/utils/supabase';
import { saveCosmicProfileEdits, type EditableProfile } from '@/utils/userProfile';
import { clearUserDataPromise } from '@/utils/userData';

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
function toISODate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper to detect timezone from location
function detectTimezone(location: string, hemisphere: 'Northern' | 'Southern'): string {
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

export default function EditProfileScreen() {
  const [form, setForm] = useState<CosmicProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hemisphere, setHemisphere] = useState<'Northern' | 'Southern'>('Northern');

  useEffect(() => {
    (async () => {
      try {
        const existing = await getCosmicProfile();
        setForm(existing || {});
        setHemisphere(existing?.zodiacResult?.hemisphere || 'Northern');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (patch: Partial<CosmicProfile>) => setForm(prev => ({ ...prev, ...patch }));

  const parseDateString = (dateString: string): Date => {
    // Handle YYYY-MM-DD format (from database)
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      return new Date(dateString);
    }
    
    // Handle DD/MM/YYYY format
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateString);
  };

  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format as DD/MM/YYYY for display
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const handleDateChange = (text: string) => {
    // Allow free text editing for dates
    update({ birthDate: text });
  };

  const recalculateZodiac = () => {
    if (!form.birthDate || !form.birthTime || !form.birthCity) {
      Alert.alert('Missing Information', 'Please fill in all birth details to calculate your cosmic position.');
      return;
    }

    try {
      console.log('🔍 [edit-profile] Recalculating zodiac with:', {
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        birthCity: form.birthCity,
        hemisphere
      });
      
      // Validate date string format
      let dateISO = form.birthDate;
      if (form.birthDate.includes('/')) {
        dateISO = toISODate(form.birthDate);
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
        throw new Error('Invalid date');
      }
      
      // Detect timezone from location
      const timezone = detectTimezone(form.birthCity || '', hemisphere);
      
      const birthInfo: BirthInfo = {
        date: dateISO, // Keep as string
        time: form.birthTime,
        location: form.birthCity,
        hemisphere,
        timezone,
      };

      const cuspResult = calculateCusp(birthInfo);
      
      console.log('✅ [edit-profile] Cusp calculation result:', {
        isOnCusp: cuspResult.isOnCusp,
        primarySign: cuspResult.primarySign,
        secondarySign: cuspResult.secondarySign,
        cuspName: cuspResult.cuspName,
        sunDegree: cuspResult.sunDegree
      });
      
      update({ 
        zodiacResult: {
          ...cuspResult,
          hemisphere
        }
      });
      
      const displayName = cuspResult.isOnCusp 
        ? `${cuspResult.cuspName} (${cuspResult.primarySign} × ${cuspResult.secondarySign})`
        : cuspResult.primarySign;
        
      Alert.alert(
        'Cosmic Position Updated!', 
        `Your position has been recalculated:\n\n${displayName}\n\nSun at ${cuspResult.sunDegree}° ${cuspResult.primarySign}`
      );
    } catch (error) {
      console.error('❌ [edit-profile] Recalculation error:', error);
      Alert.alert('Invalid Date', 'Please enter a valid birth date.');
    }
  };

  const save = async () => {
    // Validate city before saving
    if (form.birthCity) {
      const cityValidation = validateCity(form.birthCity);
      if (!cityValidation.isValid) {
        Alert.alert('Invalid Location', cityValidation.message);
        return;
      }
    }
    
    setSaving(true);
    try {
      console.log('💾 [edit-profile] Starting safe profile save...');
      
      // Normalize date format to YYYY-MM-DD
      let birthDateISO = form.birthDate;
      if (form.birthDate && form.birthDate.includes('/')) {
        birthDateISO = toISODate(form.birthDate);
      }
      
      // Prepare edits for the safe save function
      const edits: EditableProfile = {
        name: form.birthCity ? form.birthCity.split(',')[0] : undefined, // Use city as name if available
        hemisphere: form.zodiacResult?.hemisphere || hemisphere,
        birthDateISO: birthDateISO,
        birthTime: form.birthTime,
        birthLocation: form.birthCity,
        cuspResult: form.zodiacResult,
      };
      
      console.log('🔍 [edit-profile] Saving with edits:', {
        hemisphere: edits.hemisphere,
        birthDateISO: edits.birthDateISO,
        birthTime: edits.birthTime,
        birthLocation: edits.birthLocation,
        hasCuspResult: !!edits.cuspResult
      });
      
      // Use the new safe save function
      const saved = await saveCosmicProfileEdits(edits);
      
      console.log('✅ [edit-profile] Profile saved successfully:', {
        email: saved?.email,
        hemisphere: saved?.hemisphere,
        birth_date: saved?.birth_date
      });
      
      // Force fresh data fetch to update the app immediately
      const { getUserData } = await import('@/utils/userData');
      const freshProfile = await getUserData(true);
      console.log('✅ [edit-profile] Fresh profile loaded after save:', {
        email: freshProfile?.email,
        hemisphere: freshProfile?.hemisphere,
        primarySign: freshProfile?.cuspResult?.primarySign
      });
      
      Alert.alert(
        'Profile Updated!', 
        'Your cosmic profile has been saved successfully. Your horoscope will now reflect your updated information.',
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                router.replace('/(tabs)/astrology');
              } catch (navError) {
                console.error('[edit-profile] Navigation error after save:', navError);
                // Fallback to settings if astrology navigation fails
                router.replace('/(tabs)/settings');
              }
            }
          }
        ]
      );
    } catch (e) {
      console.error('❌ [edit-profile] PRODUCTION: save error', e);
      Alert.alert('Save Error', `Could not save your profile: ${e?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const validateCity = (location: string): { isValid: boolean; message: string } => {
    const trimmed = location.trim();
    
    if (trimmed.length < 2) {
      return { isValid: false, message: 'Please enter a valid city name (at least 2 characters).' };
    }
    
    const invalidEntries = [
      'test', 'testing', 'abc', 'xyz', 'asdf', 'qwerty',
      'parisone', 'cityname', 'unknown', 'none', 'n/a'
    ];
    
    if (invalidEntries.includes(trimmed.toLowerCase())) {
      return { isValid: false, message: `"${trimmed}" is not a valid city. Please enter your actual birth city (e.g., "Sydney, Australia" or "New York, USA").` };
    }
    
    if (/^\d+$/.test(trimmed)) {
      return { isValid: false, message: 'Please enter a city name, not just numbers.' };
    }
    
    if (/^[^a-zA-Z]+$/.test(trimmed)) {
      return { isValid: false, message: 'Please enter a valid city name with letters.' };
    }
    
    return { isValid: true, message: '' };
  };

  const handleGoBack = () => {
    try {
      console.log('[edit-profile] Back button clicked');
      
      // Always use replace to ensure reliable navigation
      router.replace('/settings/account');
    } catch (error: any) {
      console.error('[edit-profile] Back button error:', error);
      // Fallback navigation
      try {
        router.replace('/(tabs)/settings');
      } catch (fallbackError) {
        console.error('[edit-profile] Fallback navigation failed:', fallbackError);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your cosmic profile...</Text>
          </View>
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
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
          >
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#8b9dc3" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title}>Edit Cosmic Profile</Text>
              <Text style={styles.subtitle}>
                Update your birth details and recalculate your cosmic position
              </Text>

              {/* Hemisphere Selection */}
              <View style={styles.hemisphereSection}>
                <Text style={styles.sectionTitle}>Hemisphere</Text>
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
                      Northern
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
                      Southern
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Birth Details Form */}
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
                style={styles.formCard}
              >
                <Text style={styles.formTitle}>Birth Details</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputWithIcon}>
                    <Calendar size={20} color="#8b9dc3" style={styles.inputIcon} />
                    <BirthdateField
                      initialISO={form.birthDate || null}
                      onValidISO={(iso) => update({ birthDate: iso || undefined })}
                    />
                  </View>

                  <View style={styles.inputWithIcon}>
                    <Clock size={20} color="#8b9dc3" style={styles.inputIcon} />
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Birth Time</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="HH:MM (24-hour format)"
                        placeholderTextColor="#8b9dc3"
                        value={form.birthTime || ''}
                        onChangeText={(t) => update({ birthTime: t })}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.birthTimeNote}>
                    <Text style={styles.birthTimeNoteText}>
                      💡 Use 24-hour format: 09:00 for 9 AM, 14:30 for 2:30 PM, 21:45 for 9:45 PM
                    </Text>
                  </View>

                  <View style={styles.inputWithIcon}>
                    <MapPin size={20} color="#8b9dc3" style={styles.inputIcon} />
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Birth Location</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Type your birth city (e.g., Manila, Sydney)..."
                        placeholderTextColor="#8b9dc3"
                        value={form.birthCity || ''}
                        onChangeText={(location) => update({ birthCity: location })}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.locationNote}>
                      <Text style={styles.locationNoteText}>
                        💡 Start typing and select from suggestions, or type manually (e.g., "Manila, Philippines")
                      </Text>
                    </View>
                  </View>
                </View>

                <CosmicButton
                  title="Recalculate Cosmic Position"
                  onPress={recalculateZodiac}
                  variant="outline"
                  style={styles.recalculateButton}
                />
              </LinearGradient>

              {/* Current Zodiac Result */}
              {form.zodiacResult && (
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                  style={styles.resultCard}
                >
                  <View style={styles.resultHeader}>
                    <Star size={20} color="#d4af37" />
                    <Text style={styles.resultTitle}>Current Cosmic Position</Text>
                  </View>
                  
                  <Text style={styles.resultText}>
                    {form.zodiacResult.cuspName || form.zodiacResult.primarySign}
                  </Text>
                  
                  {form.zodiacResult.isOnCusp && (
                    <Text style={styles.resultSubtext}>
                      Cusp between {form.zodiacResult.primarySign} and {form.zodiacResult.secondarySign}
                    </Text>
                  )}
                  
                  {form.zodiacResult.sunDegree && (
                    <Text style={styles.resultDetail}>
                      Sun at {form.zodiacResult.sunDegree}° {form.zodiacResult.primarySign}
                    </Text>
                  )}
                </LinearGradient>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <CosmicButton
                  title={saving ? 'Saving...' : 'Save Profile'}
                  onPress={save}
                  disabled={saving}
                  style={styles.saveButton}
                />

                <CosmicButton
                  title="Cancel"
                  onPress={handleGoBack}
                  variant="outline"
                  style={styles.cancelButton}
                />
              </View>
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
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  backText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  hemisphereSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginBottom: 12,
    textAlign: 'center',
  },
  hemisphereButtons: {
    flexDirection: 'row',
    gap: 12,
  },
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
  hemisphereButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
  },
  hemisphereButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
  },
  hemisphereButtonTextActive: {
    color: '#d4af37',
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  formTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 20,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 1,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    paddingLeft: 44,
  },
  input: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 44,
    color: '#e8e8e8',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
  recalculateButton: {
    marginTop: 8,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 8,
  },
  resultText: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resultDetail: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 16,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 16,
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 16,
  },
});