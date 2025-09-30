import React from 'react'; 
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface CosmicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function CosmicButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: CosmicButtonProps) {
  const handlePress = () => {
    try {
      console.log('[CosmicButton] Button pressed:', title);
      
      if (!disabled && !loading) {
        console.log('[CosmicButton] Executing onPress for:', title);
        onPress();
      } else {
        console.log('[CosmicButton] Button press ignored - disabled:', disabled, 'loading:', loading);
      }
    } catch (error) {
      console.error('[CosmicButton] Button press error:', error);
      // Still try to execute if it's a critical action
      if (!disabled && !loading) {
        try {
          onPress();
        } catch (retryError) {
          console.error('[CosmicButton] Retry also failed:', retryError);
        }
      }
    }
  };
  
  const buttonStyles = [styles.button, style];
  const textStyles = [styles.text];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled || loading ? ['#4a4a4a', '#2a2a2a'] : ['#d4af37', '#b8941f']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[textStyles, { color: disabled || loading ? '#888' : '#1a1a2e' }]}>
            {loading ? 'Loading...' : title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
          <Text style={[textStyles, { color: '#d4af37' }]}>{loading ? 'Loading...' : title}</Text>
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[buttonStyles, styles.outline]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text style={[textStyles, { color: '#d4af37' }]}>{loading ? 'Loading...' : title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurBackground: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.3)',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#d4af37',
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-SemiBold',
    textAlign: 'center',
  },
});