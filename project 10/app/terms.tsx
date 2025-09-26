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
import { ArrowLeft } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';

export default function TermsScreen() {
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

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
            <Text style={styles.title}>Terms and Conditions</Text>
            <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

            {/* Introduction */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Welcome to Astro Cusp</Text>
              <Text style={styles.sectionText}>
                These Terms and Conditions ("Terms") govern your use of the Astro Cusp mobile application 
                ("App", "Service") operated by Astro Cusp ("we", "us", "our").
              </Text>
              <Text style={styles.sectionText}>
                By accessing or using our Service, you agree to be bound by these Terms. 
                If you disagree with any part of these terms, then you may not access the Service.
              </Text>
            </LinearGradient>

            {/* Guidance and Entertainment Disclaimer */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.importantCard}
            >
              <Text style={styles.importantTitle}>Important: Guidance and Personal Responsibility</Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>Astro Cusp is a guidance tool designed to promote a positive state of mind</Text> and 
                provide astrological insights for entertainment and self-reflection purposes. Our content is intended to:
              </Text>
              <Text style={styles.bulletPoint}>• Inspire positive thinking and self-awareness</Text>
              <Text style={styles.bulletPoint}>• Offer cosmic perspective on daily life</Text>
              <Text style={styles.bulletPoint}>• Encourage personal growth and reflection</Text>
              <Text style={styles.bulletPoint}>• Provide entertainment through astrological content</Text>
              <Text style={styles.bulletPoint}>• Awaken your subconscious mind</Text>
              
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>What the stars tell you and how it manifests in your life is entirely up to you as an individual.</Text> 
                You have complete agency over your choices, actions, and responses to any guidance provided by our App.
              </Text>
              
              <Text style={styles.sectionText}>
                Astro Cusp does not predict the future, make guarantees about outcomes, or replace professional advice. 
                All astrological content should be considered as one perspective among many in your decision-making process.
              </Text>
            </LinearGradient>

            {/* Use of Service */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Use of Service</Text>
              <Text style={styles.sectionText}>
                You may use our Service for lawful purposes only. You agree not to use the Service:
              </Text>
              <Text style={styles.bulletPoint}>• In any way that violates applicable laws or regulations</Text>
              <Text style={styles.bulletPoint}>• To transmit harmful, offensive, or inappropriate content</Text>
              <Text style={styles.bulletPoint}>• To interfere with or disrupt the Service or servers</Text>
              <Text style={styles.bulletPoint}>• To attempt to gain unauthorised access to any part of the Service</Text>
            </View>

            {/* User Accounts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Accounts</Text>
              <Text style={styles.sectionText}>
                When you create an account with us, you must provide accurate, complete, and current information. 
                You are responsible for safeguarding your account and all activities that occur under your account.
              </Text>
              <Text style={styles.sectionText}>
                We reserve the right to refuse service, terminate accounts, or cancel subscriptions 
                at our sole discretion without notice.
              </Text>
            </View>

            {/* Subscriptions and Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscriptions and Payments</Text>
              <Text style={styles.sectionText}>
                Some parts of the Service are billed on a subscription basis ("Subscription"). 
                You will be billed in advance on a recurring basis.
              </Text>
              <Text style={styles.sectionText}>
                Subscriptions automatically renew unless cancelled. You may cancel your subscription 
                at any time through your account settings or app store subscription management.
              </Text>
              <Text style={styles.sectionText}>
                Refunds are handled according to the app store's refund policy where you purchased your subscription.
              </Text>
            </View>

            {/* Content and Intellectual Property */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content and Intellectual Property</Text>
              <Text style={styles.sectionText}>
                The Service and its original content, features, and functionality are owned by The Cusp 
                and are protected by international copyright, trademark, and other intellectual property laws.
              </Text>
              <Text style={styles.sectionText}>
                All astrological content, horoscopes, and guidance provided through the App are original 
                works created specifically for the Astro Cusp platform.
              </Text>
            </View>

            {/* Privacy */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy</Text>
              <Text style={styles.sectionText}>
                Your privacy is important to us. We collect minimal personal information necessary 
                to provide our Service, including your birth information for astrological calculations.
              </Text>
              <Text style={styles.sectionText}>
                We do not sell, trade, or share your personal information with third parties. 
                Your birth data is used solely for generating personalised astrological content.
              </Text>
            </View>

            {/* Disclaimers */}
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Disclaimers</Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>Entertainment and Guidance Only:</Text> The Cusp provides astrological content 
                for entertainment, self-reflection, and positive mindset cultivation. It is not intended as professional advice.
              </Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>No Guarantees:</Text> We make no representations or warranties about the accuracy, 
                completeness, or reliability of any astrological content provided.
              </Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>Personal Responsibility:</Text> You acknowledge that your interpretation and 
                application of any guidance is your personal choice and responsibility.
              </Text>
              <Text style={styles.sectionText}>
                <Text style={styles.boldText}>Not Professional Advice:</Text> The Service does not provide medical, legal, 
                financial, or therapeutic advice. Consult qualified professionals for such matters.
              </Text>
            </LinearGradient>

            {/* Limitation of Liability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Limitation of Liability</Text>
              <Text style={styles.sectionText}>
                In no event shall The Cusp, its directors, employees, or agents be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising out of your use of the Service.
              </Text>
            </View>

            {/* Termination */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Termination</Text>
              <Text style={styles.sectionText}>
                We may terminate or suspend your account and access to the Service immediately, 
                without prior notice, for conduct that we believe violates these Terms.
              </Text>
            </View>

            {/* Changes to Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Changes to Terms</Text>
              <Text style={styles.sectionText}>
                We reserve the right to modify these Terms at any time. We will notify users of any 
                material changes by posting the new Terms in the App.
              </Text>
              <Text style={styles.sectionText}>
                Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </Text>
            </View>

            {/* Contact Information */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
              style={styles.sectionCard}
            >
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.sectionText}>
                If you have any questions about these Terms and Conditions, please contact us at 
                Mysticmish@astrocusp.com.au or You can DM Mystic Mish through instagram at Astrocusp
              </Text>
            </LinearGradient>

            {/* Final Reminder */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.finalCard}
            >
              <Text style={styles.finalTitle}>Remember</Text>
              <Text style={styles.finalText}>
                Astro Cusp is here to inspire, guide, and support your journey of self-discovery. 
                The cosmic insights we provide are tools for reflection—how you choose to use them 
                is entirely in your hands. Trust your intuition, embrace your agency, and let the 
                stars illuminate your path while you walk it with intention.
              </Text>
            </LinearGradient>
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
  title: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  importantCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(139, 157, 195, 0.5)',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    marginBottom: 12,
  },
  importantTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
  },
  bulletPoint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 8,
  },
  finalCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  finalTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 12,
  },
  finalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
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
    fontFamily: 'Inter-Medium',
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
});