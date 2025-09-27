// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CosmicBackground from '@/components/CosmicBackground';

// ✅ Use require so Metro bundles the image
const logo = require('../assets/images/icon.png'); // path from app/index.tsx → assets/images/icon.png

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 🔝 Explore first */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/find-cusp')}
          style={styles.exploreCta}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#2a2a44', '#1a1a2e']} style={styles.exploreCtaInner}>
            <Text style={styles.exploreTitle}>Just want to explore?</Text>
            <Text style={styles.exploreSubtitle}>Calculate your cusp instantly →</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 🔰 Hero */}
        <View style={styles.hero}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Welcome to Astrocusp</Text>
          <Text style={styles.subtitle}>
            Daily guidance for cusp souls and pure-signs—tuned to your hemisphere, lunar phase, and current sky.
          </Text>
        </View>

        {/* ✅ Actions — Create account restored */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/astrology')} style={styles.btnTertiary}>
            <Text style={styles.btnTertiaryText}>Go to Daily Guidance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },

  // TOP CTA
  exploreCta: { marginBottom: 20 },
  exploreCtaInner: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
  },
  exploreTitle: {
    fontSize: 16,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-SemiBold',
    textAlign: 'center',
  },
  exploreSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#d4af37',
    fontFamily: 'Vazirmatn-Medium',
    textAlign: 'center',
  },

  // HERO
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 96, height: 96, marginBottom: 12, borderRadius: 20 },
  title: { fontSize: 22, color: '#e8e8e8', fontFamily: 'Vazirmatn-Bold', textAlign: 'center' },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#8b9dc3',
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
  },

  // ACTIONS
  actions: { gap: 12, marginTop: 24 },

  btnPrimary: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#1a1a2e', fontFamily: 'Vazirmatn-SemiBold', fontSize: 16 },

  btnSecondary: {
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
  },
  btnSecondaryText: { color: '#e8e8e8', fontFamily: 'Vazirmatn-SemiBold', fontSize: 16 },

  btnTertiary: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnTertiaryText: { color: '#8b9dc3', fontFamily: 'Vazirmatn-Medium', fontSize: 15 },
});
