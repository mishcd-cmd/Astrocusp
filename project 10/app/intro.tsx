import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Star as Stars, Zap, Eye, Compass, ArrowRight } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';
import CosmicButton from '../components/CosmicButton';
import CuspLogo from '../components/CuspLogo';

export default function IntroScreen() {
  const handleGetStarted = () => {
    router.push('/(tabs)');
  };

  const handleSkipToCalculator = () => {
    router.push('/(tabs)/find-cusp');
  };

  const handleSkipToHoroscope = () => {
    router.push('/(tabs)/astrology');
  };

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <CuspLogo size={100} />
              </View>
              <Text style={styles.title}>Welcome to Astro Cusp</Text>
              <Text style={styles.subtitle}>
                Discover the unique power of being born between zodiac signs
              </Text>
              <Text style={styles.pureSignsNote}>
                (Pure signs are absolutely welcome too! ✨)
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {/* Feature 1 */}
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.featureCard}
              >
                <View style={styles.featureHeader}>
                  <Zap size={24} color="#d4af37" />
                  <Text style={styles.featureTitle}>Dual Energies</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Cusp individuals carry traits from both zodiac signs, making them more complex, 
                  adaptable, and multidimensional. You can flex between personality modes and 
                  remain a bit mysterious — even to yourself.
                </Text>
              </LinearGradient>
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.featureCard}
              >
                <View style={styles.featureHeader}>
                  <Compass size={24} color="#8b9dc3" />
                  <Text style={styles.featureTitle}>Transitional Beings</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Born during a celestial transition, you have a foot in two worlds. You're natural 
                  bridges between people and ideas, at ease with change, and drawn to explore your 
                  identity more deeply.
                </Text>
              </LinearGradient>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.featureCard}
              >
                <View style={styles.featureHeader}>
                  <Eye size={24} color="#d4af37" />
                  <Text style={styles.featureTitle}>Identity Explorers</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Many cuspers don't feel like a "typical" sign and experience being "in-between." 
                  This struggle leads to greater self-awareness, a unique inner compass, and 
                  creative tension that drives growth.
                </Text>
              </LinearGradient>
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
                style={styles.featureCard}
              >
                <View style={styles.featureHeader}>
                  <Stars size={24} color="#8b9dc3" />
                  <Text style={styles.featureTitle}>Broader Spectrum</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Exposed to two modes of behavior and ruling planets, cuspers often develop 
                  greater emotional intelligence, resonate with more people, and naturally blend 
                  perspectives like art + science or logic + emotion.
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.mythologySection}>
              <Text style={styles.mythologyTitle}>The Power of Liminal Beings</Text>
              <Text style={styles.mythologyText}>
                In storytelling and myth, liminal beings — those who exist between worlds — 
                often hold special insight or power. Think shamans, twilight creatures, or 
                mythological twins. As a cusper, you embody this ancient archetype.
              </Text>
            </View>

            {/* Quick Navigation Options */}
            <View style={styles.quickNavSection}>
              <Text style={styles.quickNavTitle}>Choose Your Path</Text>
              <TouchableOpacity style={styles.quickNavButton} onPress={handleSkipToCalculator}>
                <View style={styles.quickNavContent}>
                  <View style={styles.quickNavLeft}>
                    <Compass size={20} color="#d4af37" />
                    <View style={styles.quickNavText}>
                      <Text style={styles.quickNavButtonTitle}>Calculate Your Cusp</Text>
                      <Text style={styles.quickNavButtonSubtitle}>Calculate your cosmic position</Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#8b9dc3" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickNavButton} onPress={handleSkipToHoroscope}>
                <View style={styles.quickNavContent}>
                  <View style={styles.quickNavLeft}>
                    <Stars size={20} color="#8b9dc3" />
                    <View style={styles.quickNavText}>
                      <Text style={styles.quickNavButtonTitle}>Daily Horoscope</Text>
                      <Text style={styles.quickNavButtonSubtitle}>Explore cosmic guidance</Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#8b9dc3" />
                </View>
              </TouchableOpacity>
            </View>

            <CosmicButton
              title="Explore The Full Experience"
              onPress={handleGetStarted}
              style={styles.getStartedButton}
            />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: {
    fontSize: 42,
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
    lineHeight: 26,
    marginBottom: 8,
  },
  pureSignsNote: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#d4af37',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  featuresContainer: {
    gap: 20,
    marginBottom: 32,
  },
  featureCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  featureDescription: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    opacity: 0.9,
  },
  mythologySection: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  mythologyTitle: {
    fontSize: 22,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 16,
  },
  mythologyText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  quickNavSection: {
    marginBottom: 32,
  },
  quickNavTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickNavButton: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  quickNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickNavText: {
    marginLeft: 12,
    flex: 1,
  },
  quickNavButtonTitle: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#e8e8e8',
    marginBottom: 2,
  },
  quickNavButtonSubtitle: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
  },
  getStartedButton: {
    marginTop: 20,
  },
});