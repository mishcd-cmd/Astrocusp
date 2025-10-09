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
      let subscriptionStatus: any;
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

  // === Beltane (Southern) ===
  const southernEclipseSpell = {
    title: '🌺 The Wild Green Awakening',
    subtitle: '🌸 Southern Hemisphere Beltane Spell',
    description:
      "A ritual for sensual rebirth and life force ignition as spring reaches its ecstatic peak",
    seasonalContext:
      "While the North walks with ghosts, the South dances with life erupting. October here is Beltane season — spring's passionate crescendo before summer's fullness. The witch's wheel turns towards fire, fertility, and unbridled creative force.",
    fullSpell: `🌸 Southern Hemisphere Beltane Spell
🌺 The Wild Green Awakening
A ritual for sensual rebirth and life force ignition as spring reaches its ecstatic peak

Seasonal Context:
While the North walks with ghosts, the South dances with life erupting. October here is Beltane season — spring's passionate crescendo before summer's fullness. The witch's wheel turns towards fire, fertility, and unbridled creative force.

Moon Phase:
Waxing towards Full (building power, manifestation)

Elements:
Fire & Earth

🔥 What You'll Need
• Red or green candle (vitality and growth)
• Fresh flowers (jasmine, rose, or whatever blooms near you)
• Honey (sweetness of life)
• Small bowl of soil
• Ribbon (red, green, or white)
• Your favourite sensual oil or perfume

🌿 Steps
1. Ground in the Green
Stand barefoot on earth or hold your bowl of soil.
Feel the rising life force beneath you — roots drinking, seeds splitting, everything reaching.
Say:
"From winter's sleep, the wild awakes,
The Earth herself now stirs and shakes."

2. Anoint and Invoke
Dab oil on your pulse points — wrists, throat, heart.
Light your candle and say:
"I am the blossom and the thorn,
The sensual, the fierce, reborn.
Life moves through me, strong and free—
As spring ignites, so too do I decree."

3. Weave Your Intention
Take your ribbon and tie it loosely around your wrist.
As you tie it, speak aloud what you're calling into bloom:
Creativity? Passion? New projects? Love? Vitality?
Say:
"By fire and flower, soil and sun,
I call what I desire — let it be done.
No timid seed, no cautious start—
I bloom with wildness in my heart."

4. The Honey Blessing
Place a drop of honey on your tongue.
Feel the sweetness.
Say:
"Life is sweet, and life is mine.
I drink the nectar, I taste the divine."

5. Flower Offering
Scatter your fresh flowers — some on your altar, some outside for the land, some in water to float and release.
As you scatter them:
"For the Earth who feeds me,
For the fire that frees me,
For the spring that sees me—
I give beauty back to the world."

6. Dance the Ignition
Move your body. Put on music. Let the vitality you've invoked move through you.
Even one minute of wild, free movement seals the spell.

✨ Optional Touch:
Keep the ribbon on for three days, then tie it to a tree as an offering. Plant something — even a single seed in a pot — to ground your Beltane magic into physical form.

🌙 Blessed Samhain, blessed Beltane — may the wheel turn well for you, wherever you stand upon it.`,
    moonPhase: 'Waxing to Full',
    element: 'Fire & Earth',
  };

  // === Samhain (Northern) ===
  const northernEclipseSpell = {
    title: "🕯️ The Veil Walker's Binding",
    subtitle: '🎃 Northern Hemisphere Samhain Spell',
    description:
      'A ritual for ancestral connection and protective passage through the thinning veil',
    seasonalContext:
      "The autumn harvest reaches its final breath as October descends towards Samhain — the moment when summer's death becomes winter's gestation. The veil between worlds grows gossamer-thin, and those with sight may glimpse what lies beyond.",
    fullSpell: `🎃 Northern Hemisphere Samhain Spell
🕯️ The Veil Walker's Binding
A ritual for ancestral connection and protective passage through the thinning veil

Seasonal Context:
The autumn harvest reaches its final breath as October descends towards Samhain — the moment when summer's death becomes winter's gestation. The veil between worlds grows gossamer-thin, and those with sight may glimpse what lies beyond.

Moon Phase:
Waning Moon moving towards Dark Moon (ideal for shadow work and ancestral communion)

Elements:
Fire & Spirit

🔥 What You'll Need
• Orange or black candle (the threshold flame)
• Dried autumn leaves or herbs (rosemary, mugwort, or sage)
• Small mirror or reflective surface
• Photograph of an ancestor or mentor (or blank paper for unknown guides)
• Apple (symbol of the otherworld)
• Salt or ash (protection)

🌙 Steps
1. Cast the Circle
Sprinkle salt or ash in a circle around your workspace, moving counter-clockwise (the direction of the thinning veil).
Whisper:
"As the wheel turns towards the dark,
I call the guardians, I light the spark."

2. Light the Threshold
Kindle your candle and gaze into its flame.
Say:
"Between the living and the gone,
Between the dusk and coming dawn,
I stand where two worlds briefly meet—
I honour those whose path's complete."

3. Speak to the Mirror
Hold the mirror before the candle. See your reflection flicker.
Place the photograph or paper before it.
Say the name of your ancestor or simply:
"To those who walked before my time,
Whose blood runs ancient through this line—
Show me what I need to see,
Lend your wisdom, set it free."

4. The Apple Offering
Cut the apple crosswise to reveal the pentagram star within.
Eat half slowly, with intention.
Leave half on your altar or beneath a tree as offering.

5. Burn and Release
Place dried leaves in a fireproof dish and set them alight with your candle.
As they burn, say:
"What must pass, I let it burn.
What must come, I wait its turn.
Through smoke and flame, the message sent—
Between the worlds, my prayer is spent."

6. Close the Veil
Thank your ancestors. Extinguish the candle with wet fingers (never blow—respect the threshold).
Break the salt circle, sweeping clockwise.
Carry the protective herb ash in a small pouch for the season.

✨ Optional Touch:
Leave a candle burning in your window on Samhain night to guide helpful spirits and honour the beloved dead.`,
    moonPhase: 'Waning to Dark Moon',
    element: 'Fire & Spirit',
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
              <Text style={styles.moonTitle}>Seasonal Rituals</Text>
            </View>
            
            {moonPhase && (
              <Text style={styles.moonPhaseText}>
                Current Moon: {moonPhase.phase} ({moonPhase.illumination}% illuminated)
              </Text>
            )}
            
            <Text style={styles.moonMessage}>
              Southern: Beltane energy is rising 🌸 • Northern: Samhain veil is thinning 🕯️
            </Text>
            <Text style={styles.moonDescription}>
              Explore your hemisphere’s full ritual below to align with the current seasonal magic.
            </Text>
          </LinearGradient>

          {/* Southern Hemisphere Spell */}
          <View style={styles.spellsSection}>
            <Text style={styles.sectionTitle}>🌍 Southern Hemisphere — Beltane Ritual</Text>
            
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
            <Text style={styles.sectionTitle}>🌎 Northern Hemisphere — Samhain Ritual</Text>
            
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
            
            {tips.map((tip) => (
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
