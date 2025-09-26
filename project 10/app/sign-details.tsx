import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Sparkles, Gem, Crown } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';
import CosmicButton from '../components/CosmicButton';
import BirthstoneInfo from '../components/BirthstoneInfo';
import { getEnhancedZodiacInfo, getBirthstoneInfo } from '../utils/zodiacData';

interface SignDetail {
  name: string;
  symbol: string;
  element: string;
  quality: string;
  rulingPlanet: string;
  dates: string;
  keywords: string[];
}

const SIGN_DESCRIPTIONS: Record<string, string> = {
  'Aries': 'Bold and pioneering, you are the cosmic trailblazer. Your fiery Mars energy drives you to initiate, lead, and fearlessly pursue new adventures. You embody pure cardinal fire—the spark that ignites action and inspires others to follow.',
  'Taurus': 'Grounded and sensual, you are the cosmic builder. Your Venus-ruled nature seeks beauty, stability, and lasting value. You embody fixed earth energy—the foundation that turns dreams into tangible reality through patience and determination.',
  'Gemini': 'Quick-witted and versatile, you are the cosmic communicator. Your Mercury-ruled mind dances between ideas, connecting people and concepts with effortless charm. You embody mutable air—the breeze that carries information and sparks curiosity.',
  'Cancer': 'Nurturing and intuitive, you are the cosmic caretaker. Your Moon-ruled heart feels deeply and protects fiercely. You embody cardinal water—the tide that creates emotional safety and nurtures growth in yourself and others.',
  'Leo': 'Radiant and generous, you are the cosmic performer. Your Sun-ruled spirit shines with natural magnetism and creative fire. You embody fixed fire—the steady flame that warms hearts and illuminates the stage of life.',
  'Virgo': 'Precise and helpful, you are the cosmic healer. Your Mercury-ruled mind seeks perfection through service and practical wisdom. You embody mutable earth—the garden that cultivates growth through careful attention and dedicated care.',
  'Libra': 'Harmonious and diplomatic, you are the cosmic peacemaker. Your Venus-ruled nature seeks beauty, balance, and fair partnerships. You embody cardinal air—the wind that brings people together and creates aesthetic harmony.',
  'Scorpio': 'Intense and transformative, you are the cosmic alchemist. Your Pluto-ruled depths explore mysteries and facilitate profound change. You embody fixed water—the deep well that transforms everything it touches through emotional truth.',
  'Sagittarius': 'Adventurous and philosophical, you are the cosmic explorer. Your Jupiter-ruled spirit seeks truth, wisdom, and boundless horizons. You embody mutable fire—the wandering flame that spreads knowledge and inspires expansion.',
  'Capricorn': 'Ambitious and disciplined, you are the cosmic architect. Your Saturn-ruled nature builds lasting structures through determination and wisdom. You embody cardinal earth—the mountain that reaches toward the sky through steady, purposeful climbing.',
  'Aquarius': 'Innovative and humanitarian, you are the cosmic revolutionary. Your Uranus-ruled mind envisions the future and champions progressive causes. You embody fixed air—the steady wind of change that transforms society through original thinking.',
  'Pisces': 'Compassionate and mystical, you are the cosmic dreamer. Your Neptune-ruled soul flows between worlds, channeling divine inspiration. You embody mutable water—the ocean that dissolves boundaries and connects all life through empathy and imagination.'
};

export default function SignDetailsScreen() {
  const { signName, hemisphere } = useLocalSearchParams<{ 
    signName: string; 
    hemisphere?: string; 
  }>();
  
  const signInfo = signName ? getEnhancedZodiacInfo(signName) : null;
  const birthstoneInfo = signName ? getBirthstoneInfo(signName) : null;
  const description = signName ? SIGN_DESCRIPTIONS[signName] : null;

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/astrology');
    }
  };

  const handleExploreMore = () => {
    console.log('=== BUTTON CLICKED: Navigating to horoscope with params from sign-details ===');
    
    if (signName) {
      router.push({
        pathname: '/(tabs)/astrology' as any,
        params: {
          sign: encodeURIComponent(signName),
          hemisphere: encodeURIComponent(hemisphere || 'Northern')
        }
      });
    } else {
      router.push('/(tabs)/astrology');
    }
  };

  if (!signInfo || !signName) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Sign details not found</Text>
            <CosmicButton title="Go Back" onPress={handleGoBack} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#8b9dc3" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Text style={styles.symbol}>{signInfo.symbol}</Text>
              <Text style={styles.signName}>{signInfo.name}</Text>
              <Text style={styles.dateRange}>{signInfo.dates}</Text>
            </View>

            <LinearGradient
              colors={['rgba(212, 175, 55, 0.3)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.titleCard}
            >
              <View style={styles.titleHeader}>
                <Star size={24} color="#d4af37" />
                <Text style={styles.title}>Pure {signInfo.name} Energy</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.descriptionCard}
            >
              <Text style={styles.description}>{description}</Text>
            </LinearGradient>

            <View style={styles.traitsSection}>
              <Text style={styles.sectionTitle}>Your Core Traits</Text>
              <View style={styles.traitsGrid}>
                {signInfo.keywords.map((trait, index) => (
                  <View key={trait} style={styles.traitItem}>
                    <Sparkles size={16} color="#d4af37" />
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Cosmic Details</Text>
              
              <View style={styles.detailsGrid}>
                <LinearGradient
                  colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.detailCard}
                >
                  <Text style={styles.detailLabel}>Element</Text>
                  <Text style={styles.detailValue}>{signInfo.element}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.detailCard}
                >
                  <Text style={styles.detailLabel}>Quality</Text>
                  <Text style={styles.detailValue}>{signInfo.quality}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.detailCard}
                >
                  <Text style={styles.detailLabel}>Ruling Planet</Text>
                  <Text style={styles.detailValue}>{signInfo.rulingPlanet}</Text>
                </LinearGradient>
                
                {birthstoneInfo && (
                  <LinearGradient
                    colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                    style={styles.detailCard}
                  >
                    <View style={styles.birthstoneHeader}>
                      <Gem size={16} color="#d4af37" />
                      <Text style={styles.detailLabel}>Traditional Birthstone</Text>
                    </View>
                    <Text style={styles.detailValue}>{birthstoneInfo.traditional}</Text>
                    <Text style={styles.birthstoneMeaning}>
                      Your traditional birthstone enhances your natural {signInfo.name} energy and characteristics.
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </View>
            
            {/* Birthstone Information */}
            {birthstoneInfo && (
              <BirthstoneInfo sign={signInfo.name} />
            )}

            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>Ready to Explore More?</Text>
              <Text style={styles.ctaSubtitle}>
                Discover your daily horoscope and current astronomical events
              </Text>
              <CosmicButton
                title="Explore Daily Insights"
                onPress={handleExploreMore}
                style={styles.ctaButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  symbol: {
    fontSize: 72,
    color: '#d4af37',
    marginBottom: 16,
    ...Platform.select({
      web: {
        textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(212, 175, 55, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
    }),
  },
  signName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    textAlign: 'center',
  },
  titleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 12,
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  description: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 28,
    textAlign: 'center',
  },
  traitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 20,
  },
  traitsGrid: {
    gap: 12,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  traitText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsGrid: {
    gap: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
  },
  birthstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  birthstoneMeaning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginTop: 8,
    lineHeight: 18,
  },
  ctaSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    minWidth: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginBottom: 24,
  },
});