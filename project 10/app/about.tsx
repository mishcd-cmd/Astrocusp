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
import { ArrowLeft, Star, Crown, Calendar, Sparkles, Eye, Telescope, Moon, Gem } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';
import CuspLogo from '../components/CuspLogo';

export default function AboutScreen() {
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
        } else {
      router.replace('/(tabs)/astrology');
    }
  };

  const features = [
    {
      icon: <Star size={24} color="#d4af37" />,
      title: 'Daily Horoscope',
      description: 'Your free daily cosmic guidance based on your zodiac sign or cusp position. This is your core reading that provides insight into the day\'s energy and how it affects you.',
      type: 'Free'
    },
    {
      icon: <Sparkles size={24} color="#d4af37" />,
      title: 'Daily Affirmation',
      description: 'A personalised affirmation to help you align with your sign\'s energy. These positive statements are designed to reinforce your natural strengths and cosmic purpose.',
      type: 'Premium'
    },
    {
      icon: <Eye size={24} color="#8b9dc3" />,
      title: 'Mystic Opening',
      description: 'Exclusive to cusp signs - a deeper spiritual insight that honours your unique position between two zodiac energies. This explores the liminal magic of being born on the threshold.',
      type: 'Premium'
    },
    {
      icon: <Crown size={24} color="#d4af37" />,
      title: 'Daily Astral Plane',
      description: 'Premium deeper insights with planetary influences, cosmic timing, and advanced astrological guidance. This is where we dive into the celestial mechanics affecting your day.',
      type: 'Premium'
    },
    {
      icon: <Calendar size={24} color="#d4af37" />,
      title: 'Monthly Forecast',
      description: 'Comprehensive monthly predictions tailored to your hemisphere and sign. Includes major themes, challenges, opportunities, and cosmic events for the month ahead.',
      type: 'Premium'
    },
    {
      icon: <Telescope size={24} color="#8b9dc3" />,
      title: 'Cosmic Perspective',
      description: 'Real-time astronomical context including current celestial events, their astrological significance, and how they influence your sign\'s energy patterns.',
      type: 'Premium'
    },
    {
      icon: <Moon size={24} color="#d4af37" />,
      title: 'Lunar Cycle',
      description: 'Current moon phase information and its influence on your emotional and spiritual cycles. Includes timing for the next lunar phase and its meaning.',
      type: 'Premium'
    },
    {
      icon: <Gem size={24} color="#d4af37" />,
      title: 'Birthstone Guidance',
      description: 'Information about your traditional and alternative birthstones, including their metaphysical properties and how to work with them for manifestation and healing.',
      type: 'Premium'
    }
  ];

  const cuspSigns = [
    'Pisces–Aries: The Cusp of Rebirth',
    'Aries–Taurus: The Cusp of Power', 
    'Taurus–Gemini: The Cusp of Energy',
    'Gemini–Cancer: The Cusp of Magic',
    'Cancer–Leo: The Cusp of Oscillation',
    'Leo–Virgo: The Cusp of Exposure',
    'Virgo–Libra: The Cusp of Beauty',
    'Libra–Scorpio: The Cusp of Drama & Criticism',
    'Scorpio–Sagittarius: The Cusp of Revolution',
    'Sagittarius–Capricorn: The Cusp of Prophecy',
    'Capricorn–Aquarius: The Cusp of Mystery & Imagination',
    'Aquarius–Pisces: The Cusp of Sensitivity'
  ];

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
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <CuspLogo size={100} />
              </View>
              <Text style={styles.title}>About Astro Cusp</Text>
              <Text style={styles.subtitle}>
                Your guide to understanding cusp astrology and navigating the cosmic energies that shape your unique path
              </Text>
            </View>

            {/* What is The Cusp */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>What is The Cusp?</Text>
              <Text style={styles.sectionText}>
                Astro Cusp is designed for those born between zodiac signs—the cosmic bridges who embody dual energies. 
                If you've ever felt like you don't quite fit into one astrological box, you're likely a cusp soul. 
                We celebrate the beautiful complexity of being born on the threshold between signs.
              </Text>
              <Text style={styles.sectionText}>
                Pure signs are absolutely welcome too! Our app provides deep, personalised insights for all zodiac positions, 
                honouring both the clarity of pure sign energy and the multidimensional nature of cusp individuals.
              </Text>
            </LinearGradient>

            {/* How to Use The App */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Use Astro Cusp</Text>
              
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.stepCard}
              >
                <Text style={styles.stepNumber}>1</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Calculate Your Position</Text>
                  <Text style={styles.stepText}>
                    Use our cusp calculator to determine if you're on a cusp or have pure sign energy. 
                    Enter your birth date, time, and location for the most accurate reading.
                  </Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.stepCard}
              >
                <Text style={styles.stepNumber}>2</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Choose Your Hemisphere</Text>
                  <Text style={styles.stepText}>
                    Select Northern or Southern Hemisphere for accurate seasonal timing and astronomical events. 
                    This ensures your horoscope reflects your actual cosmic environment.
                  </Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                style={styles.stepCard}
              >
                <Text style={styles.stepNumber}>3</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Explore Your Daily Guidance</Text>
                  <Text style={styles.stepText}>
                    Read your daily horoscope, affirmation, and cosmic insights. 
                    Check the current moon phase and astronomical events affecting your sign.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Why Hemisphere Matters */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Why Hemisphere Matters</Text>
              <Text style={styles.sectionText}>
                Your hemisphere affects seasonal timing and visible astronomical events. Northern Hemisphere 
                experiences winter solstice in December, while Southern Hemisphere has summer solstice at the same time.
              </Text>
              <Text style={styles.sectionText}>
                This creates different cosmic energies and influences how astrological events manifest in your life. 
                Our app provides hemisphere-specific guidance to ensure your readings align with your actual cosmic environment.
              </Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>Traveling or on holiday?</Text> You can toggle between hemispheres 
                if you're wondering why the vibe feels different - your stars aren\'t aligned to your current location! 
                Simply switch hemispheres in the app to get readings that match where you are right now.
              </Text>
            </LinearGradient>

            {/* Features Explanation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features Explained</Text>
              
              {features.map((feature, index) => (
                <LinearGradient
                  key={feature.title}
                  colors={feature.type === 'Premium' 
                    ? ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']
                    : feature.type === 'Cusp Only'
                    ? ['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']
                    : ['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.featureCard}
                >
                  <View style={styles.featureHeader}>
                    {feature.icon}
                    <View style={styles.featureTitleContainer}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <View style={[
                        styles.featureTypeBadge,
                        feature.type === 'Premium' && styles.premiumBadge,
                        feature.type === 'Cusp Only' && styles.cuspBadge,
                        feature.type === 'Free' && styles.freeBadge
                      ]}>
                        <Text style={[
                          styles.featureTypeText,
                          feature.type === 'Premium' && styles.premiumText,
                          feature.type === 'Cusp Only' && styles.cuspText,
                          feature.type === 'Free' && styles.freeText
                        ]}>
                          {feature.type}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </LinearGradient>
              ))}
            </View>

            {/* Cusp Signs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>The 12 Cusp Signs</Text>
              <Text style={styles.sectionSubtitle}>
                Each cusp represents a unique blend of energies and cosmic purpose
              </Text>
              
              <View style={styles.cuspGrid}>
                {cuspSigns.map((cusp, index) => (
                  <LinearGradient
                    key={cusp}
                    colors={['rgba(212, 175, 55, 0.15)', 'rgba(139, 157, 195, 0.1)']}
                    style={styles.cuspItem}
                  >
                    <Text style={styles.cuspText}>{cusp}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>

            {/* Premium Benefits */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.sectionCard}
            >
              <View style={styles.premiumHeader}>
                <Crown size={24} color="#d4af37" />
                <Text style={styles.sectionTitle}>Astral Plane Benefits</Text>
              </View>
              <Text style={styles.sectionText}>
                Upgrade to unlock deeper daily insights, comprehensive monthly forecasts, 
                and exclusive cusp-specific content. Premium members receive:
              </Text>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>• Advanced planetary influence analysis</Text>
                <Text style={styles.benefitItem}>• Detailed monthly cosmic forecasts</Text>
                <Text style={styles.benefitItem}>• Cusp-specific spiritual guidance</Text>
                <Text style={styles.benefitItem}>• Exclusive birthstone manifestation tips</Text>
                <Text style={styles.benefitItem}>• Real-time cosmic event notifications</Text>
              </View>
            </LinearGradient>
            
            {/* Logo Meaning */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.logoMeaningCard}
            >
              <Text style={styles.logoMeaningTitle}>The Cusp Symbol</Text>
              <Text style={styles.logoMeaningText}>
                Our infinity symbol represents the ongoing cosmic forces of the Sun (gold) and Moon (silver). 
                The cusp is the sacred meeting point where these dual energies converge—embodying the eternal 
                dance between solar fire and lunar flow, conscious and unconscious, action and reflection.
              </Text>
              <Text style={styles.logoMeaningText}>
                For those born on the cusp, you are the living bridge between these forces, carrying the 
                infinite potential that comes from existing at the threshold of transformation.
              </Text>
            </LinearGradient>
            
            {/* Terms Link */}
            <TouchableOpacity 
              style={styles.termsLink}
              onPress={() => router.push('/terms')}
            >
              <Text style={styles.termsLinkText}>Terms and Conditions</Text>
            </TouchableOpacity>
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
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  title: {
    fontSize: 40,
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
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'Vazirmatn-Bold',
    color: '#e8e8e8',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionText: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  stepNumber: {
    fontSize: 24,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    marginRight: 16,
    minWidth: 32,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#e8e8e8',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    lineHeight: 20,
  },
  featureCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#e8e8e8',
    marginBottom: 4,
  },
  featureTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: 'rgba(139, 157, 195, 0.2)',
    borderColor: 'rgba(139, 157, 195, 0.4)',
  },
  premiumBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  cuspBadge: {
    backgroundColor: 'rgba(139, 157, 195, 0.3)',
    borderColor: 'rgba(139, 157, 195, 0.5)',
  },
  featureTypeText: {
    fontSize: 10,
    fontFamily: 'Vazirmatn-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  freeText: {
    color: '#8b9dc3',
  },
  premiumText: {
    color: '#d4af37',
  },
  cuspText: {
    color: '#8b9dc3',
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
  },
  cuspGrid: {
    gap: 12,
  },
  cuspItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  cuspText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    textAlign: 'center',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 22,
    marginBottom: 4,
  },
  logoMeaningCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  logoMeaningTitle: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 12,
  },
  logoMeaningText: {
    fontSize: 15,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  termsLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  termsLinkText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Medium',
    color: '#8b9dc3',
    textDecorationLine: 'underline',
  },
  contactDetails: {
    marginTop: 16,
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  instagramIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramText: {
    fontSize: 16,
  },
  boldText: {
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#d4af37',
  },
});