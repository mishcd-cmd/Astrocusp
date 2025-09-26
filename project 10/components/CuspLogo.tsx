import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CuspLogoProps {
  size?: number;
  animated?: boolean;
}

export default function CuspLogo({ size = 120, animated = false }: CuspLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Cosmic blue background matching app theme */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0a0a1a']}
        style={[styles.cosmicBackground, { width: size, height: size }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.05)', 'rgba(192, 192, 192, 0.05)']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      
      {/* Use the correct logo image */}
      <Image
        source={require('../assets/images/icon.png')}
        style={[styles.logoImage, { width: size, height: size }]}
        resizeMode="contain"
      />
      
      {/* Enhanced glow effect */}
      <View style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    opacity: 0.1,
  },
  cosmicBackground: {
    position: 'absolute',
    borderRadius: 60,
  },
  logoImage: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
    }),
  },
});