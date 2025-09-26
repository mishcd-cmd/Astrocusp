import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ZODIAC_ICON: Record<string, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎',
  Leo: '♌︎', Virgo: '♍︎', Libra: '♎︎', Scorpio: '♏︎',
  Sagittarius: '♐︎', Capricorn: '♑︎', Aquarius: '♒︎', Pisces: '♓︎',
};

// Accepts either a pure sign ("Aries") or a cusp label ("Aries–Taurus Cusp")
export default function HoroscopeHeader({ signLabel }: { signLabel: string }) {
  // Check if it's a cusp sign
  const isCusp = signLabel?.includes('–') || signLabel?.includes('-');
  
  let iconDisplay: string;
  
  if (isCusp) {
    // For cusp signs, show both symbols
    const parts = signLabel?.split(/\s*[–-]\s*/);
    const firstSign = parts?.[0]?.trim();
    const secondSign = parts?.[1]?.replace(/\s*Cusp.*$/i, '').trim();
    
    const firstIcon = ZODIAC_ICON[firstSign] ?? '✨';
    const secondIcon = ZODIAC_ICON[secondSign] ?? '✨';
    
    iconDisplay = `${firstIcon}${secondIcon}`;
  } else {
    // For pure signs, show single symbol
    const baseSign = signLabel?.split(/\s/)?.[0]?.trim() || 'Aries';
    iconDisplay = ZODIAC_ICON[baseSign] ?? '✨';
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{iconDisplay}</Text>
      <Text style={styles.title}>Daily Horoscope</Text>
      <Text style={styles.sub}>{signLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 6,
    color: '#d4af37',
  },
  title: {
    fontSize: 26,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Bold',
    textAlign: 'center',
  },
  sub: {
    marginTop: 4,
    color: '#8b9dc3',
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
  },
});