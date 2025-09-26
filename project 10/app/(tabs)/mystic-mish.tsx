import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Moon, Star, Sparkles, Eye, Scroll, Crown } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import HoroscopeHeader from '../../components/HoroscopeHeader';
import { getCurrentMoonPhase } from '../../utils/astronomy';
import { getSubscriptionStatus } from '../../utils/billing';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

// ✅ Pre-import the avatar image for better type safety (renamed to lowercase, no spaces)
const mishAvatar = require('../../assets/images/mystic-mish/headshot.png');

export default function MysticMishScreen() {
  const router = useRouter();
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      let subscriptionStatus;
      try {
        console.log('🔍 [mystic-mish] Checking subscription status...');
        subscriptionStatus = await getSubscriptionStatus();
        console.log('🔍 [mystic-mish] Subscription result:', subscriptionStatus);
        
        // Load moon phase
        const phase = getCurrentMoonPhase();
        setMoonPhase(phase);
      } catch (error) {
        console.error('Error loading Mystic Mish data:', error);
      } finally {
        if (isMounted) {
          if (subscriptionStatus) {
            setHasAccess(subscriptionStatus.active || false);
          }
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

  const handleAccount = () => {
    router.push('/settings');
  };
  const southernEclipseSpell = {
    title: '🌑 Spell of the Eclipse Veil',
    subtitle: 'Full Moon Lunar Eclipse - Southern Hemisphere',
    description: 'A ritual for releasing shadows and embracing rebirth under the eclipsed Full Moon.',
    seasonalContext: 'August/September eclipses here occur in the late winter / early spring cusp — the season of endings merging with new beginnings. This is a time for shedding what is frozen or stagnant, so fresh life may emerge.',
    fullSpell: `🌙 What You'll Need

White candle (truth/light of the Full Moon)

Black scarf or cloth (eclipse shadow)

Small bowl of water (cleansing + renewal)

Paper + pen

Protective crystal (obsidian, smoky quartz, black tourmaline)

🔮 Steps

Prepare Your Space
Sit near a window or outside. Place your tools before you. Whisper:
"From winter's shadow into spring's bloom,
The Moon unveils my living room."

Name the Shadow
Write on the paper one fear, pattern, or heaviness you're ready to melt away.

Enact the Eclipse
Light the white candle, then cover it briefly with the black cloth. Imagine your old self being eclipsed, its shadow dissolving.

Release & Cleanse
Uncover the candle. Pass the paper through its smoke three times, then sink it into the bowl of water. Say:
"Shadow shed, the way made clear,
I step renewed — no longer bound here."

Anchor with Stone
Hold your crystal, feel its grounding, then keep it under your pillow or near your bed to guard your rebirth.

✨ Optional Touch: Scatter a few fresh flower petals into the water, symbolizing new spring growth emerging from release.`,
    moonPhase: 'Full Moon Lunar Eclipse',
    element: 'Water & Shadow'
  };

  const northernEclipseSpell = {
    title: '🌑 Spell of the Eclipse Veil',
    subtitle: 'Full Moon Lunar Eclipse - Northern Hemisphere',
    description: 'A ritual for releasing shadows and calling transformation under the eclipsed Full Moon.',
    seasonalContext: 'This eclipse arrives in late summer / early autumn — harvest time. It\'s about cutting away what\'s overripe, what weighs you down, so that true nourishment remains.',
    fullSpell: `🌙 What You'll Need

White candle (illumination)

Black scarf/cloth (eclipse shadow)

Bowl of water (reflection)

Paper + pen

Protective crystal (onyx, obsidian, hematite)

🔮 Steps

Prepare Your Space
Sit near a window or outdoors under the Moon. Light the candle and whisper:
"Through summer's fire and autumn's call,
The Moon reveals what must now fall."

Name the Shadow
On the paper, write what has grown "too heavy" — a fear, habit, or attachment that no longer nourishes you.

Eclipse & Release
Cover the candle with the black cloth. As the flame disappears, imagine your burden dissolving into shadow.

Cleanse with Water
Unveil the candle, pass your paper through the smoke, then immerse it in the bowl. Whisper:
"Eclipsed away, the past is gone,
I harvest truth, my spirit strong."

Seal with Stone
Hold your crystal tight. Feel your body lighter, your path clearer. Place it where you'll see it daily as a reminder of freedom.

✨ Optional Touch: Add a few grains of rice or wheat into the water to honor the harvest and abundance that follows release.`,
    moonPhase: 'Full Moon Lunar Eclipse',
    element: 'Earth & Shadow'
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Loading mystical wisdom...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Show paywall if no access
  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Mystic Mish</Text>
              <Text style={styles.subtitle}>Your Cosmic Guide & Ritual Keeper</Text>
            </View>

            {/* Paywall */}
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.paywallCard}
            >
              <View style={styles.paywallHeader}>
                <Crown size={32} color="#d4af37" />
                <Text style={styles.paywallTitle}>Unlock Mystic Mish</Text>
              </View>
              
              <Text style={styles.paywallDescription}>
                Access Mystic Mish's sacred spells, moon rituals, and cosmic wisdom with Astral Plane.
              </Text>
              
              {/* Mystic Mish Preview */}
              <View style={styles.mishPreviewContainer}>
                <Image
                  source={mishAvatar}
                  style={styles.mishPreviewImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
                {imageError && (
                  <View style={styles.mishPreviewFallback}>
                    <Text style={styles.mishEmojiLarge}>🔮</Text>
                    <Text style={styles.mishNameLarge}>Mish</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Scroll size={16} color="#d4af37" />
                  <Text style={styles.featureText}>Sacred spells & rituals</Text>
                </View>
                <View style={styles.featureItem}>
                  <Moon size={16} color="#d4af37" />
                  <Text style={styles.featureText}>Moon phase magic guidance</Text>
                </View>
                <View style={styles.featureItem}>
                  <Sparkles size={16} color="#d4af37" />
                  <Text style={styles.featureText}>Cusp-specific magical practices</Text>
                </View>
                <View style={styles.featureItem}>
                  <Eye size={16} color="#d4af37" />
                  <Text style={styles.featureText}>Mystic wisdom & cosmic tips</Text>
                </View>
              </View>
              
              <CosmicButton
                title="Upgrade to Astral Plane"
                onPress={handleUpgrade}
                style={styles.upgradeButton}
              />
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const tips = [
    {
      icon: <Moon size={20} color="#d4af37" />,
      title: 'Moon Phase Magic',
      tip: 'New moons are for setting intentions, full moons for releasing and manifesting. Waxing moons grow your desires, waning moons help you let go.'
    },
    {
      icon: <Sparkles size={20} color="#8b9dc3" />,
      title: 'Cusp Power',
      tip: 'If you\'re on a cusp, you have access to dual energies. Use this to your advantage in spells - you can work with both signs\' ruling planets and elements.'
    },
    {
      icon: <Star size={20} color="#d4af37" />,
      title: 'Daily Practice',
      tip: 'Small daily rituals are more powerful than elaborate monthly ones. Light a candle with intention, speak an affirmation, or simply pause to connect with cosmic energy.'
    }
  ];

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>✨</Text>
            <Text style={styles.headerTitle}>Mystic Mish</Text>
            <Text style={styles.headerSubtitle}>Your Cosmic Guide & Ritual Keeper</Text>
          </View>

          {/* Mish Avatar & Welcome */}
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(139, 157, 195, 0.1)']}
            style={styles.welcomeCard}
          >
            {/* Mystic Mish Avatar */}
            <View style={styles.mishAvatarContainer}>
              <Image
                source={mishAvatar}
                style={styles.mishAvatar}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <View style={styles.mishAvatarFallback}>
                  <Text style={styles.mishEmojiLarge}>🔮</Text>
                  <Text style={styles.mishNameLarge}>Mish</Text>
                </View>
              )}
            </View>
            
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome, cosmic soul! ✨</Text>
              <Text style={styles.welcomeText}>
                I'm Mystic Mish, your guide through the celestial realms. I appear when the cosmic energies are ripe for magic and ritual work. 
                Let me share the ancient wisdom of moon cycles, spell craft, and cosmic timing.
              </Text>
            </View>
          </LinearGradient>

          {/* Current Moon Message */}
          <LinearGradient
            colors={['rgba(139, 157, 195, 0.25)', 'rgba(75, 0, 130, 0.15)']}
            style={styles.moonMessageCard}
          >
            <View style={styles.moonHeader}>
              <Moon size={24} color="#d4af37" />
              <Text style={styles.moonTitle}>Lunar Eclipse Wisdom</Text>
            </View>
            
            {moonPhase && (
              <Text style={styles.moonPhaseText}>
                Current Moon: {moonPhase.phase} ({moonPhase.illumination}% illuminated)
              </Text>
            )}
            
            <Text style={styles.moonMessage}>
              🌑 Full Moon Lunar Eclipse on September 7th - Eclipse Veil Ritual
            </Text>
            <Text style={styles.moonDescription}>
              A powerful ritual for releasing shadows and embracing transformation under the eclipsed Full Moon - see hemisphere-specific spells below.
            </Text>
          </LinearGradient>

          {/* Southern Hemisphere Spell */}
          <View style={styles.spellsSection}>
            <Text style={styles.sectionTitle}>🌍 Southern Hemisphere Eclipse Ritual</Text>
            
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.spellCard}
            >
              <View style={styles.spellHeader}>
                <Scroll size={20} color="#d4af37" />
                <Text style={styles.spellTitle}>{southernEclipseSpell.title}</Text>
              </View>
              
              <Text style={styles.spellSubtitle}>{southernEclipseSpell.subtitle}</Text>
              <Text style={styles.spellDescription}>{southernEclipseSpell.description}</Text>
              
              <View style={styles.seasonalContextContainer}>
                <Text style={styles.seasonalContextTitle}>Seasonal Context:</Text>
                <Text style={styles.seasonalContextText}>{southernEclipseSpell.seasonalContext}</Text>
              </View>
              
              <View style={styles.spellDetails}>
                <View style={styles.spellDetailItem}>
                  <Text style={styles.spellDetailLabel}>Moon Phase:</Text>
                  <Text style={styles.spellDetailValue}>{southernEclipseSpell.moonPhase}</Text>
                </View>
                <View style={styles.spellDetailItem}>
                  <Text style={styles.spellDetailLabel}>Elements:</Text>
                  <Text style={styles.spellDetailValue}>{southernEclipseSpell.element}</Text>
                </View>
              </View>
              
              <View style={styles.fullSpellContainer}>
                <Text style={styles.fullSpellTitle}>The Ritual:</Text>
                <Text style={styles.fullSpellText}>{southernEclipseSpell.fullSpell}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Northern Hemisphere Spell */}
          <View style={styles.spellsSection}>
            <Text style={styles.sectionTitle}>🌎 Northern Hemisphere Eclipse Ritual</Text>
            
            <LinearGradient
              colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
              style={styles.spellCard}
            >
              <View style={styles.spellHeader}>
                <Scroll size={20} color="#8b9dc3" />
                <Text style={styles.spellTitle}>{northernEclipseSpell.title}</Text>
              </View>
              
              <Text style={styles.spellSubtitle}>{northernEclipseSpell.subtitle}</Text>
              <Text style={styles.spellDescription}>{northernEclipseSpell.description}</Text>
              
              <View style={styles.seasonalContextContainer}>
                <Text style={styles.seasonalContextTitle}>Seasonal Context:</Text>
                <Text style={styles.seasonalContextText}>{northernEclipseSpell.seasonalContext}</Text>
              </View>
              
              <View style={styles.spellDetails}>
                <View style={styles.spellDetailItem}>
                  <Text style={styles.spellDetailLabel}>Moon Phase:</Text>
                  <Text style={styles.spellDetailValue}>{northernEclipseSpell.moonPhase}</Text>
                </View>
                <View style={styles.spellDetailItem}>
                  <Text style={styles.spellDetailLabel}>Elements:</Text>
                  <Text style={styles.spellDetailValue}>{northernEclipseSpell.element}</Text>
                </View>
              </View>
              
              <View style={styles.fullSpellContainer}>
                <Text style={styles.fullSpellTitle}>The Ritual:</Text>
                <Text style={styles.fullSpellText}>{northernEclipseSpell.fullSpell}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Mystic Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Mish's Cosmic Tips</Text>
            
            {tips.map((tip, index) => (
              <LinearGradient
                key={tip.title}
                colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
                style={styles.tipCard}
              >
                <View style={styles.tipHeader}>
                  {tip.icon}
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </View>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </LinearGradient>
            ))}
          </View>

          {/* Mish's Wisdom */}
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(139, 157, 195, 0.1)']}
            style={styles.wisdomCard}
          >
            <View style={styles.wisdomHeader}>
              <Eye size={24} color="#d4af37" />
              <Text style={styles.wisdomTitle}>Mish's Final Wisdom</Text>
            </View>
            <Text style={styles.wisdomText}>
              "Remember, dear cosmic soul - magic isn't about the perfect ritual or the right tools. 
              It's about your intention, your connection to the universe, and your willingness to believe 
              in the unseen forces that guide us all. Trust your intuition, honor the moon cycles, 
              and let your unique cosmic position be your greatest strength."
            </Text>
            <Text style={styles.wisdomSignature}>— Mystic Mish ✨</Text>
          </LinearGradient>
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
  headerCenter: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginTop: 4,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mishAvatarSimple: {
    position: 'relative',
    width: 80,
    height: 95,
    marginRight: 20,
  },
  mishAvatarContainer: {
    position: 'relative',
    width: 80,
    height: 95,
    marginRight: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  mishAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  mishAvatarFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 80,
    height: 95,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mishPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4af37',
    width: 100,
    height: 120,
  },
  mishPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mishPreviewFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
  },
  moonMessageCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  moonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moonTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 8,
  },
  moonPhaseText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 12,
  },
  moonMessage: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  moonDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  spellsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 20,
  },
  spellCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  spellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spellTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    marginLeft: 8,
  },
  spellSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
    marginBottom: 8,
    textAlign: 'center',
  },
  spellDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  spellDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  spellDetailItem: {
    alignItems: 'center',
  },
  spellDetailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  spellDetailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
  },
  fullSpellContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  fullSpellTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
    marginBottom: 8,
  },
  fullSpellText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  seasonalContextContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  seasonalContextTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8b9dc3',
    marginBottom: 4,
  },
  seasonalContextText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#e8e8e8',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 20,
  },
  wisdomCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  wisdomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wisdomTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 8,
  },
  wisdomText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  wisdomSignature: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginTop: 12,
  },
  paywallCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  paywallHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paywallTitle: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        textShadow: '1px 1px 2px #4B0082',
      },
      default: {
        textShadowColor: '#4B0082',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  mishPreviewSimple: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mishEmojiLarge: {
    fontSize: 60,
    marginBottom: 8,
  },
  mishNameLarge: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
  paywallDescription: {
    fontSize: 20,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  upgradeButton: {
    minWidth: 200,
  },
  headerCenter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 6,
    color: '#d4af37',
  },
  headerTitle: {
    fontSize: 26,
    color: '#e8e8e8',
    fontFamily: 'Vazirmatn-Bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#8b9dc3',
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    textAlign: 'center',
  },
});