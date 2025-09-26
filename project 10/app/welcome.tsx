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
import { Shield, Lock, Star, ArrowRight, Eye } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';
import CosmicButton from '../components/CosmicButton';
import CuspLogo from '../components/CuspLogo';

export default function WelcomeScreen() {
  const handleCreateAccount = () => {
    router.push('/auth/signup');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSkipToCalculator = () => {
    router.push('/(tabs)/find-cusp');
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
                Discover your unique cosmic position between zodiac signs
              </Text>
            </View>

            {/* Action Buttons - Moved to top */}
            <View style={styles.actionButtons}>
              <CosmicButton
                title="Create Your Account"
                onPress={handleCreateAccount}
                style={styles.primaryButton}
              />
              
              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInText}>
                  Already have an account? <Text style={styles.signInTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Message */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.privacyCard}
            >
              <View style={styles.privacyHeader}>
                <Shield size={24} color="#8b9dc3" />
                <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
              </View>
              <Text style={styles.privacyText}>
                We understand your birth data is sensitive and private information. 
                To protect you and ensure your cosmic profile remains secure, we ask 
                that you create an account first.
              </Text>
              <View style={styles.privacyFeatures}>
                <View style={styles.privacyFeature}>
                  <Lock size={16} color="#8b9dc3" />
                  <Text style={styles.privacyFeatureText}>Your data is encrypted and secure</Text>
                </View>
                <View style={styles.privacyFeature}>
                  <Eye size={16} color="#8b9dc3" />
                  <Text style={styles.privacyFeatureText}>Only you can access your profile</Text>
                </View>
                <View style={styles.privacyFeature}>
                  <Shield size={16} color="#8b9dc3" />
                  <Text style={styles.privacyFeatureText}>We never share your personal information</Text>
                </View>
              </View>
            </LinearGradient>

            {/* What You'll Get */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.benefitsCard}
            >
              <View style={styles.benefitsHeader}>
                <Star size={24} color="#d4af37" />
                <Text style={styles.benefitsTitle}>What You'll Discover</Text>
              </View>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✨ Your exact cusp position or pure sign energy</Text>
                <Text style={styles.benefitItem}>🌟 Daily personalized horoscope guidance</Text>
                <Text style={styles.benefitItem}>🌙 Current moon phase and cosmic events</Text>
                <Text style={styles.benefitItem}>💎 Your sacred birthstone and its meaning</Text>
                <Text style={styles.benefitItem}>🔮 Hemisphere-specific astronomical insights</Text>
              </View>
            </LinearGradient>

            <>
              {/* Quick Access Option - Moved to bottom */}
              <View style={styles.quickAccessSection}>
                <Text style={styles.quickAccessTitle}>Just want to explore?</Text>
                <TouchableOpacity style={styles.quickAccessButton} onPress={handleSkipToCalculator}>
                  <View style={styles.quickAccessContent}>
                    <Text style={styles.quickAccessText}>Try the Cusp Calculator</Text>
                    <ArrowRight size={16} color="#8b9dc3" />
                  </View>
                  <Text style={styles.quickAccessNote}>
                    (You can create an account later to save your results)
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          </View>
          
          {/* Cache buster comment - updated 2025-01-30 15:45 */}
          {/* Force rebuild - updated 2025-01-30 16:30 */}
          {/* FORCE REBUILD - 2025-01-30 23:45 - Clear old September cache */}
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
  },
  privacyCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 22,
    fontFamily: 'Vazirmatn-Bold',
    color: '#8b9dc3',
    marginLeft: 12,
  },
  privacyText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  privacyFeatures: {
    gap: 12,
  },
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  privacyFeatureText: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  benefitsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 22,
    fontFamily: 'Vazirmatn-Bold',
    color: '#d4af37',
    marginLeft: 12,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 20,
    marginBottom: 32,
  },
  primaryButton: {
    marginTop: 0,
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
  },
  signInTextBold: {
    fontFamily: 'Vazirmatn-Bold',
    color: '#8b9dc3',
  },
  quickAccessSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 157, 195, 0.2)',
  },
  quickAccessTitle: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickAccessButton: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
    alignItems: 'center',
  },
  quickAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickAccessText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-SemiBold',
    color: '#8b9dc3',
    marginRight: 8,
  },
  quickAccessNote: {
    fontSize: 12,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    opacity: 0.8,
  },
});