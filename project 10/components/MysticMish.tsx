// components/MysticMish.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentMoonPhase, getCurrentPlanetaryPositionsEnhanced } from '@/utils/astronomy';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

// ✅ Pre-import the avatar image for better type safety
const mishAvatar = require('../assets/images/mystic-mish/headshot.png');

const { width: screenWidth } = Dimensions.get('window');

interface MysticMishProps {
  onRitualReveal?: (ritual: string) => void;
  hemisphere: 'Northern' | 'Southern';
}

// Ritual data (kept as-is; currently unused in the welcome line, but ready for future variants)
const RITUALS = {
  newMoon: [
    "🌑 **New Moon Manifestation**: Write your intentions on paper, fold it three times, and place it under your pillow.",
    "🕯️ **Fresh Start Ritual**: Light a black candle to banish old energy, then a white one for new beginnings.",
    "✨ **Seed Planting**: Write down three goals and bury the paper in a small pot with a seed or plant.",
    "🌑 **Spell of the Silver Seed**: The new moon is coming on the 23rd - A ritual for planting new beginnings under the dark sky of the New Moon - see full spell.",
    "🦁 **Fire Mirror Ritual** (Leo New Moon): Light a gold candle in front of a mirror. Gaze at your reflection and whisper: 'I see the fire. I call it higher.' Write self-praise on a bay leaf and burn it safely. *Mish's Tip: Confidence is a spell—cast it daily with your posture and voice.*",
    "♍ **Herbal Pouch Spell** (Virgo New Moon): Create a pouch with lavender, rosemary, and quartz for cleansing routines. *Mish's Tip: Your daily rituals are spells—make them sacred.*"
  ],
  waxingCrescent: [
    "🌒 **Crescent Growth**: Place a silver coin in water overnight, then use the water to nurture a plant.",
    "📝 **Intention Amplification**: Write your goals with green ink and place the paper where moonlight can touch it.",
    "🔮 **Forward Motion**: Walk clockwise in a circle while visualizing your dreams growing stronger.",
    "💬 **Voice Reclamation Ritual** (Mercury Direct): Write sigils over your journal with lemon balm ink to reclaim your authentic voice. *Mish's Tip: Your words are spells—choose them like magic.*"
  ],
  firstQuarter: [
    "🌓 **Decision Ritual**: Place two candles representing choices, light the one that feels right.",
    "⚖️ **Balance Working**: Hold a small stone in each hand, feel their weight, then choose which to keep.",
    "🌱 **Growth Acceleration**: Water a plant while speaking your intentions aloud.",
  ],
  waxingGibbous: [
    "🌔 **Refinement Spell**: Edit a list of goals, making them more specific and aligned.",
    "✂️ **Cutting Away**: Use scissors to cut paper representing obstacles in your path.",
    "📈 **Energy Building**: Charge a crystal in sunlight, then carry it close to your heart.",
    "🪐 **Portal of Prosperity** (Lionsgate 8/8): Arrange 8 coins in an infinity shape with citrine at centre. Sip sun-charged water and journal: 'I open the gate. I walk with fate.' *Mish's Tip: Think bigger—manifest worth, not just wealth.*",
    "💖 **Rose Water Love Bath** (Venus-Jupiter): Add rose petals to your bath for soul-nourishing love and abundance. *Mish's Tip: Love yourself first—the universe is watching.*"
  ],
  fullMoon: [
    "🌕 **Full Moon Release**: Write what you want to release on paper and safely burn it under moonlight.",
    "💧 **Moon Water Blessing**: Place a bowl of water under the full moon to charge it with lunar energy.",
    "✨ **Illumination Ritual**: Meditate with a white candle and ask for clarity on your path.",
    "🌕 **Electric Thread Ritual** (Aquarius Full Moon): Tie silver thread around your wrist, hold the other end to the moon saying: 'I am connected, expanded, awake.' Write 3 visionary ideas with actions. *Mish's Tip: The world needs your weird—honour your unique code.*"
  ],
  waningGibbous: [
    "🌖 **Gratitude Flow**: List all that you're thankful for and speak each item aloud.",
    "🧹 **Gentle Clearing**: Sweep your home with intention, visualizing clearing away stagnant energy.",
    "🍵 **Healing Tea**: Brew a cup of tea with healing intention, sipping slowly and mindfully.",
    "💫 **Glamour Spell** (Venus in Leo): Use rose petals and gold shimmer to amplify your magnetism. *Mish's Tip: You are the magic—dress like it.*"
  ],
  lastQuarter: [
    "🌗 **Release Ritual**: Write down what no longer serves you and tear the paper into pieces.",
    "🧿 **Protection Working**: Place a blue object near your door to ward off negative energy.",
    "🔄 **Cycle Completion**: Draw a circle and divide it in four, marking what phase of life you're in.",
  ],
  waningCrescent: [
    "🌘 **Final Release**: Wash your hands in salt water to cleanse away the last of what you're releasing.",
    "🌿 **Rest & Recover**: Create a small altar with restful items like lavender or chamomile.",
    "📉 **Surrender Practice**: Write 'I release control of...' and complete the sentence five times.",
    "🪐 **Money Altar Refresh** (Jupiter Retrograde): Refresh your abundance altar with cinnamon, coins, and gratitude. *Mish's Tip: Abundance flows to grateful hearts.*"
  ],
};

export default function MysticMish({ onRitualReveal, hemisphere }: MysticMishProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentRitual, setCurrentRitual] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [moonPhase, setMoonPhase] = useState(getCurrentMoonPhase());
  const [planetaryPositions, setPlanetaryPositions] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(true); // ← default to true (soft gate)
  const [imageError, setImageError] = useState(false);

  const isMounted = useRef(true);

  // Persist Animated values across renders
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;

  const checkRitualTime = async () => {
    const currentMoon = getCurrentMoonPhase();
    setMoonPhase(currentMoon);

    try {
      // Try with hemisphere if your util supports it; fall back otherwise
      const positions =
        typeof getCurrentPlanetaryPositionsEnhanced === 'function'
          ? await getCurrentPlanetaryPositionsEnhanced(hemisphere as any)
          : [];
      setPlanetaryPositions(Array.isArray(positions) ? positions : []);
    } catch {
      setPlanetaryPositions([]);
    }

    // Your current default message (kept intact)
    const welcomeRitual =
      'Spooky! Halloween is nearby and there is some prep to do before unleashing with spells!- see the Mystic Mish tab to find out';

    if (isMounted.current) {
      setCurrentRitual(welcomeRitual);
      setIsVisible(true);
      startAnimations();
    }
  };

  const startAnimations = () => {
    // Keep iOS light for perf
    if (Platform.OS === 'ios') return;

    // Floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnimation, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Sparkle pulse/rotate
    Animated.loop(
      Animated.timing(sparkleAnimation, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    // Gentle wiggle
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnimation, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(wiggleAnimation, { toValue: -1, duration: 4000, useNativeDriver: true }),
        Animated.timing(wiggleAnimation, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleMishTap = () => {
    if (isAnimating) return;

    if (isMounted.current) setIsAnimating(true);

    Animated.sequence([
      Animated.timing(scaleAnimation, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnimation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (isMounted.current) {
        setIsAnimating(false);
        setShowRitual(true);
        onRitualReveal?.(currentRitual);
      }
    });
  };

  useEffect(() => {
    isMounted.current = true;

    // Soft subscription check (does NOT gate rendering)
    const checkAccess = async () => {
      try {
        const { getSubscriptionStatus } = await import('@/utils/billing');
        const subscriptionStatus = await getSubscriptionStatus();
        console.log('🔍 [MysticMish] Subscription check:', subscriptionStatus);
        if (isMounted.current) {
          // allow if active is true OR undefined
          const allowed = subscriptionStatus?.active !== false;
          setHasAccess(allowed);
        }
      } catch (error) {
        console.error('❌ [MysticMish] Access check error:', error);
        if (isMounted.current) setHasAccess(true); // fail-open to keep Mish visible
      }
    };

    checkAccess();

    const isOldDevice = Platform.OS === 'ios' && (Number(Platform.Version) || 0) < 13;
    const delay = isOldDevice ? 3000 : 2000;

    const timer = setTimeout(async () => {
      if (isMounted.current) {
        await checkRitualTime();
      }
    }, delay);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hemisphere]);

  // Auto-hide ritual popup after a while (keeps avatar visible)
  useEffect(() => {
    if (!showRitual) return;
    const timer = setTimeout(() => {
      if (isMounted.current) setShowRitual(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showRitual]);

  // 🔑 IMPORTANT: we no longer gate on hasAccess here
  if (!isVisible) return null;

  const floatTransform = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const wiggleRotate = wiggleAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-1.5deg', '0deg', '1.5deg'],
  });

  const getTransforms = () => {
    if (Platform.OS === 'ios') {
      return [{ scale: scaleAnimation }];
    }
    return [{ translateY: floatTransform }, { scale: scaleAnimation }, { rotate: wiggleRotate }];
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Ritual popup */}
      {showRitual && (
        <View style={styles.ritualPopup} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(139, 157, 195, 0.98)', 'rgba(75, 0, 130, 0.95)']}
            style={styles.ritualCard}
          >
            <Text style={styles.ritualTitle}>✨ Mystic Mish Says ✨</Text>
            <Text style={styles.moonPhaseText}>
              Current Moon: {moonPhase.phase} ({moonPhase.illumination}%)
            </Text>
            <Text style={styles.ritualText}>{currentRitual}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRitual(false)}>
              <Text style={styles.closeButtonText}>Thank you, Mish! 🌟</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Mystic Mish character */}
      <Animated.View style={[styles.mishContainer, { transform: getTransforms() }]}>
        <TouchableOpacity onPress={handleMishTap} style={styles.mishTouchable} activeOpacity={0.8}>
          {/* Sparkles (skip for iOS to avoid native driver warnings) */}
          {Platform.OS !== 'ios' && (
            <>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle1,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle2,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>🌟</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle3,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>⭐</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle4,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>💫</Text>
              </Animated.View>
            </>
          )}

          {/* Avatar */}
          <View style={styles.imageContainer}>
            {!imageError ? (
              <Image
                source={mishAvatar}
                style={styles.mishImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.mishPlaceholder}>
                <Text style={styles.mishEmoji}>🔮</Text>
                <Text style={styles.mishName}>Mish</Text>
              </View>
            )}
            {Platform.OS !== 'ios' && <View style={styles.glowEffect} />}
          </View>

          {/* Little “!” bubble */}
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>!</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120, // near the Daily title
    left: 15,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  mishContainer: {
    position: 'relative',
  },
  mishTouchable: {
    position: 'relative',
    padding: 8,
    pointerEvents: 'auto',
  },
  imageContainer: {
    position: 'relative',
    width: 85,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
    }),
  },
  mishImage: {
    width: 80,
    height: 95,
    borderRadius: 18,
  },
  mishPlaceholder: {
    width: 80,
    height: 95,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  mishEmoji: { fontSize: 32, marginBottom: 4 },
  mishName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    ...Platform.select({
      web: { boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
    }),
  },
  sparkle: { position: 'absolute', zIndex: 1 },
  sparkle1: { top: 2, left: 12 },
  sparkle2: { top: 18, right: 8 },
  sparkle3: { bottom: 15, left: 8 },
  sparkle4: { top: 35, right: 20 },
  sparkleText: {
    fontSize: 12,
    color: '#FFD700',
    ...Platform.select({
      web: { textShadow: '0 0 2px rgba(255, 255, 255, 1)' },
      ios: {},
      default: {
        textShadowColor: 'rgba(255, 255, 255, 1)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
      },
    }),
  },
  speechBubble: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      web: { boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
      },
    }),
  },
  speechText: { color: '#4B0082', fontSize: 12, fontFamily: 'Inter-Bold' },

  ritualPopup: {
    position: 'absolute',
    top: 0,
    left: 95,
    width: Math.min(screenWidth - 130, 280),
    zIndex: 1001,
  },
  ritualCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FFD700',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
    }),
  },
  ritualTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    ...Platform.select({
      web: { textShadow: '1px 1px 2px #4B0082' },
      ios: {},
      default: {
        textShadowColor: '#4B0082',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  moonPhaseText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  ritualText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  closeButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
});
