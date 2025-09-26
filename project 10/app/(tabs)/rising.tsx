import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Calendar, Compass } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import CosmicInput from '../../components/CosmicInput';
import { calculateRisingSign, BirthInfo, RisingSignResult } from '../../utils/astrology';
import { getVisibleConstellations, getAstronomicalInsight } from '../../utils/astronomy';

export default function RisingSignCalculator() {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [result, setResult] = useState<RisingSignResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [visibleConstellations, setVisibleConstellations] = useState<string[]>([]);
  const [astronomicalInsight, setAstronomicalInsight] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const parseDateString = (dateString: string): Date => {
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      // Handle DD/MM/YYYY format
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day); // month is 0-indexed
    }
    // Fallback to standard Date parsing
    return new Date(dateString);
  };

  const handleCalculate = () => {
    if (!birthDate || !birthTime || !birthLocation) {
      Alert.alert('Missing Information', 'Please fill in all fields to calculate your rising sign.');
      return;
    }

    try {
      const date = parseDateString(birthDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      const birthInfo: BirthInfo = {
        date,
        time: birthTime,
        location: birthLocation,
        hemisphere: 'Northern', // Default for rising sign calculation
      };

      const risingResult = calculateRisingSign(birthInfo);
      
      // Get astronomical context
      const hemisphere = birthLocation.toLowerCase().includes('australia') || 
                        birthLocation.toLowerCase().includes('south africa') ||
                        birthLocation.toLowerCase().includes('argentina') ||
                        birthLocation.toLowerCase().includes('chile') ||
                        birthLocation.toLowerCase().includes('new zealand')
                        ? 'Southern' : 'Northern';
      
      const constellations = getVisibleConstellations(hemisphere);
      const insight = getAstronomicalInsight(hemisphere);
      
      if (isMounted.current) {
        setResult(risingResult);
        setVisibleConstellations(constellations);
        setAstronomicalInsight(insight);
        setShowResult(true);
      }
    } catch (error) {
      Alert.alert('Invalid Date', 'Please enter a valid birth date in DD/MM/YYYY format.');
    }
  };

  const resetCalculator = () => {
    if (!isMounted.current) return;
    setShowResult(false);
    setResult(null);
    setVisibleConstellations([]);
    setAstronomicalInsight('');
  };

  if (showResult && result) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.resultContainer}>
              <Text style={styles.title}>Your Rising Sign</Text>
              
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.resultCard}
              >
                <View style={styles.signDisplay}>
                  <Text style={styles.signName}>{result.sign}</Text>
                  <Text style={styles.signDegree}>{result.degree}°</Text>
                </View>
                
                <Text style={styles.resultTitle}>Rising Sign</Text>
                <Text style={styles.description}>{result.description}</Text>
                
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Ascendant:</Text>
                  <Text style={styles.detailValue}>{result.degree}° {result.sign}</Text>
                </View>
              </LinearGradient>

              {/* Astronomical Context */}
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.contextCard}
              >
                <View style={styles.contextHeader}>
                  <Compass size={20} color="#8b9dc3" />
                  <Text style={styles.contextTitle}>Eastern Horizon Context</Text>
                </View>
                <Text style={styles.contextText}>{astronomicalInsight}</Text>
              </LinearGradient>

              {/* Visible Constellations */}
              {visibleConstellations.length > 0 && (
                <View style={styles.constellationSection}>
                  <Text style={styles.sectionTitle}>Constellations Rising Tonight</Text>
                  <View style={styles.constellationGrid}>
                    {visibleConstellations.slice(0, 4).map((constellation, index) => (
                      <View key={constellation} style={styles.constellationItem}>
                        <Text style={styles.constellationName}>{constellation}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.constellationNote}>
                    These constellations are currently visible on the eastern horizon, 
                    similar to how your rising sign appeared at your birth.
                  </Text>
                </View>
              )}

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
              <Text style={styles.title}>RISING SIGN</Text>
              <Text style={styles.subtitle}>
                Enter your birth details to determine your rising sign and discover what constellations are currently rising on the eastern horizon
              </Text>

              <View style={styles.inputSection}>
                <View style={styles.inputWithIcon}>
                  <Calendar size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput
                    label="Date of Birth"
                    placeholder="DD/MM/YYYY"
                    value={birthDate}
                    onChangeText={setBirthDate}
                    dateInput={true}
                  />
                </View>

                <View style={styles.inputWithIcon}>
                  <Clock size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput
                    label="Birth Time"
                    placeholder="HH:MM (exact time preferred)"
                    value={birthTime}
                    onChangeText={setBirthTime}
                  />
                </View>

                <View style={styles.inputWithIcon}>
                  <MapPin size={20} color="#8b9dc3" style={styles.inputIcon} />
                  <CosmicInput
                    label="Birth Location"
                    placeholder="City, Country"
                    value={birthLocation}
                    onChangeText={setBirthLocation}
                  />
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>About Rising Signs</Text>
                <Text style={styles.infoText}>
                  Your rising sign (ascendant) is the zodiac sign that was rising on the eastern horizon 
                  at the exact moment of your birth. It influences your outward personality and how others perceive you.
                </Text>
              </View>

              <CosmicButton
                title="Calculate"
                onPress={handleCalculate}
                style={styles.calculateButton}
              />
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
    marginBottom: 32,
    lineHeight: 24,
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
  infoCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8b9dc3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
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
  signDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signName: {
    fontSize: 48,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
  },
  signDegree: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
  },
  contextCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8b9dc3',
    marginLeft: 8,
  },
  contextText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
  },
  constellationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 16,
  },
  constellationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  constellationItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 157, 195, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  constellationName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
  },
  constellationNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
});