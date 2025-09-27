// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CosmicBackground from '@/components/CosmicBackground';
import CosmicButton from '@/components/CosmicButton';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* === 1) HERO — AT THE VERY TOP === */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Welcome to Astrocusp</Text>
            <Text style={styles.heroSubtitle}>
              Daily guidance for cusp souls and pure-signs—tuned to your hemisphere, lunar phase, and current sky.
            </Text>
          </View>

          {/* === 2) EXPLORE FIRST — RIGHT UNDER THE HERO === */}
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.18)', 'rgba(212, 175, 55, 0.08)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Just want to explore?</Text>
            <Text style={styles.cardText}>
              Jump straight to the calculator and discover your cusp or pure sign. No sign-in required.
            </Text>

            <CosmicButton
              title="Calculate my cusp"
              onPress={() => router.push('/(tabs)/find-cusp')}
              style={styles.primaryButton}
            />
          </LinearGradient>

          {/* === 3) SIGN IN / WELCOME BACK (BELOW EXPLORE) === */}
          <LinearGradient
            colors={['rgba(139, 157, 195, 0.18)', 'rgba(139, 157, 195, 0.08)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardText}>
              Sign in to see your Daily Guidance, save your profile, and unlock premium insights.
            </Text>

            <View style={styles.buttonRow}>
              <CosmicButton
                title="Sign in"
                onPress={() => router.push('/auth/login')}
                style={styles.secondaryButton}
              />
              <CosmicButton
                title="Create account"
                onPress={() => router.push('/auth/signup')}
                style={styles.ghostButton}
              />
            </View>
          </LinearGradient>

          {/* (Optional) Anything else can come after this */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  // HERO
  hero: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
  heroTitle: {
    fontSize: 26,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#8b9dc3',
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // CARDS
  card: {
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.28)',
  },
  cardTitle: {
    fontSize: 18,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  // BUTTONS
  primaryButton: { minWidth: 200, alignSelf: 'center' },
  secondaryButton: { minWidth: 140, flex: 1, marginRight: 8 },
  ghostButton: { minWidth: 140, flex: 1, marginLeft: 8 },
  buttonRow: { flexDirection: 'row', gap: 12 },
});
