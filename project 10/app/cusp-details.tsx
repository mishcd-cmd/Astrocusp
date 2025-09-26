import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Sparkles, Gem, Scroll } from 'lucide-react-native';
import CosmicBackground from '../components/CosmicBackground';
import CosmicButton from '../components/CosmicButton';
import BirthstoneInfo from '../components/BirthstoneInfo';
import { getBirthstoneForCusp } from '../utils/birthstones';
import { getCuspGemstoneAndRitual } from '../utils/cuspData';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}
interface CuspDetail {
  name: string;
  title: string;
  symbol: string;
  dateRange: string;
  description: string;
  traits: string[];
  element: string;
  ruling: string;
}

const CUSP_DETAILS: Record<string, CuspDetail> = {
  'Pisces–Aries Cusp': {
    name: 'Pisces–Aries Cusp',
    title: 'The Cusp of Rebirth',
    symbol: '♓♈',
    dateRange: 'Mar 19–24',
    description: 'Dreamy + Bold. You are the bridge between the mystical and the material, blending Pisces\' intuitive depth with Aries\' pioneering spirit. You possess the rare ability to dream big and then take action to make those dreams a reality.',
    traits: ['Intuitive Pioneer', 'Dreamy Warrior', 'Compassionate Leader'],
    element: 'Water meets Fire',
    ruling: 'Neptune & Mars'
  },
  'Aries–Taurus Cusp': {
    name: 'Aries–Taurus Cusp',
    title: 'The Cusp of Power',
    symbol: '♈♉',
    dateRange: 'Apr 19–24',
    description: 'Bold and grounded, you\'re the firestarter who builds what you burn for. You blend Aries\' daring with Taurus\' determination. Fiercely loyal and unshakably driven, you\'re here to conquer your world — one deliberate step at a time.',
    traits: ['Determined Pioneer', 'Practical Warrior', 'Loyal Leader'],
    element: 'Fire meets Earth',
    ruling: 'Mars & Venus'
  },
  'Taurus–Gemini Cusp': {
    name: 'Taurus–Gemini Cusp',
    title: 'The Cusp of Energy',
    symbol: '♉♊',
    dateRange: 'May 19–24',
    description: 'Earthy yet electric, your mind never sleeps. You crave both beauty and buzz, art and information. You\'re a sensual intellect — always seeking pleasure, always asking questions. One part rooted, one part restless.',
    traits: ['Sensual Communicator', 'Curious Creator', 'Grounded Explorer'],
    element: 'Earth meets Air',
    ruling: 'Venus & Mercury'
  },
  'Gemini–Cancer Cusp': {
    name: 'Gemini–Cancer Cusp',
    title: 'The Cusp of Magic',
    symbol: '♊♋',
    dateRange: 'Jun 19–24',
    description: 'Your mind is moonlit. Clever, curious, and deeply emotional, you move between thought and feeling like tides on a shore. You\'re the storyteller, the empath, the friend who texts you both memes and soul-checks.',
    traits: ['Emotional Communicator', 'Intuitive Thinker', 'Caring Storyteller'],
    element: 'Air meets Water',
    ruling: 'Mercury & Moon'
  },
  'Cancer–Leo Cusp': {
    name: 'Cancer–Leo Cusp',
    title: 'The Cusp of Oscillation',
    symbol: '♋♌',
    dateRange: 'Jul 19–25',
    description: 'You are heart and spotlight. A quiet storm with a radiant roar. You feel before you perform, love before you lead. You nurture like Cancer and dazzle like Leo — soft, but impossible to ignore.',
    traits: ['Nurturing Performer', 'Emotional Leader', 'Protective Star'],
    element: 'Water meets Fire',
    ruling: 'Moon & Sun'
  },
  'Leo–Virgo Cusp': {
    name: 'Leo–Virgo Cusp',
    title: 'The Cusp of Exposure',
    symbol: '♌♍',
    dateRange: 'Aug 19–25',
    description: 'Polished and purposeful, you shine with precision. You carry Leo\'s charisma and Virgo\'s perfectionism — always chasing the ideal. A natural leader who notices everything, you are confidence with a conscience.',
    traits: ['Perfectionist Leader', 'Charismatic Analyst', 'Precise Performer'],
    element: 'Fire meets Earth',
    ruling: 'Sun & Mercury'
  },
  'Virgo–Libra Cusp': {
    name: 'Virgo–Libra Cusp',
    title: 'The Cusp of Beauty',
    symbol: '♍♎',
    dateRange: 'Sep 19–25',
    description: 'You are grace under analysis. You love harmony, but only if it\'s earned. Virgo\'s discipline meets Libra\'s aesthetic — making you the designer, the diplomat, the one who makes logic look beautiful.',
    traits: ['Aesthetic Perfectionist', 'Diplomatic Analyst', 'Graceful Critic'],
    element: 'Earth meets Air',
    ruling: 'Mercury & Venus'
  },
  'Libra–Scorpio Cusp': {
    name: 'Libra–Scorpio Cusp',
    title: 'The Cusp of Drama & Criticism',
    symbol: '♎♏',
    dateRange: 'Oct 19–25',
    description: 'You are velvet with steel beneath. At once charming and intense, you lure people in with wit, then leave them breathless with your depth. A magnetic force who loves hard, thinks sharp, and plays for keeps.',
    traits: ['Magnetic Diplomat', 'Intense Charmer', 'Deep Strategist'],
    element: 'Air meets Water',
    ruling: 'Venus & Pluto'
  },
  'Scorpio–Sagittarius Cusp': {
    name: 'Scorpio–Sagittarius Cusp',
    title: 'The Cusp of Revolution',
    symbol: '♏♐',
    dateRange: 'Nov 18–24',
    description: 'Truth-teller. Truth-seeker. You carry Scorpio\'s depth and Sagittarius\' daring — an explorer of the emotional underground and the highest skies. You question everything and burn for more.',
    traits: ['Truth Seeker', 'Passionate Explorer', 'Revolutionary Thinker'],
    element: 'Water meets Fire',
    ruling: 'Pluto & Jupiter'
  },
  'Sagittarius–Capricorn Cusp': {
    name: 'Sagittarius–Capricorn Cusp',
    title: 'The Cusp of Prophecy',
    symbol: '♐♑',
    dateRange: 'Dec 18–24',
    description: 'The visionary and the builder, you dream in blueprints. You\'re restless but goal-oriented — with Sagittarius\' optimism and Capricorn\'s grit. You want to see the world and improve it.',
    traits: ['Visionary Builder', 'Optimistic Achiever', 'Philosophical Leader'],
    element: 'Fire meets Earth',
    ruling: 'Jupiter & Saturn'
  },
  'Capricorn–Aquarius Cusp': {
    name: 'Capricorn–Aquarius Cusp',
    title: 'The Cusp of Mystery & Imagination',
    symbol: '♑♒',
    dateRange: 'Jan 17–23',
    description: 'You are ancient and futuristic all at once. A pragmatic rebel with a structured mind and a wild soul. You crave innovation with impact — ideas that do something. You don\'t follow trends. You make them.',
    traits: ['Innovative Traditionalist', 'Structured Rebel', 'Future-Focused Builder'],
    element: 'Earth meets Air',
    ruling: 'Saturn & Uranus'
  },
  'Aquarius–Pisces Cusp': {
    name: 'Aquarius–Pisces Cusp',
    title: 'The Cusp of Sensitivity',
    symbol: '♒♓',
    dateRange: 'Feb 15–21',
    description: 'You are the cosmic sponge — intuitive, electric, idealistic. Aquarius\' mind meets Pisces\' heart, giving you dreams for the future and feelings for everyone. You\'re tuned in to things others don\'t even sense yet.',
    traits: ['Intuitive Innovator', 'Empathetic Visionary', 'Cosmic Dreamer'],
    element: 'Air meets Water',
    ruling: 'Uranus & Neptune'
  },
};

export default function CuspDetailsScreen() {
  const { cuspName, hemisphere } = useLocalSearchParams<{ 
    cuspName: string; 
    hemisphere?: string; 
  }>();
  
  // Extract base cusp name for consistent lookups
  const baseCuspName = cuspName ? cuspName.replace(' Cusp', '') : '';
  
  const cuspDetail = cuspName ? CUSP_DETAILS[cuspName] : null;
  const cuspBirthstoneData = cuspName ? getCuspGemstoneAndRitual(cuspName) : null;

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/astrology');
    }
  };

  const handleExploreMore = () => {
    console.log('=== BUTTON CLICKED: Navigating to horoscope with params from cusp-details ===');
    
    if (cuspName) {
      router.push({
        pathname: '/(tabs)/astrology' as any,
        params: {
          sign: encodeURIComponent(cuspName),
          hemisphere: encodeURIComponent(hemisphere || 'Northern')
        }
      });
    } else {
      router.push('/(tabs)/astrology');
    }
  };

  if (!cuspDetail) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Cusp details not found</Text>
            <CosmicButton title="Go Back" onPress={handleGoBack} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
            <View style={styles.headerSection}>
              <Text style={styles.symbol}>{cuspDetail.symbol}</Text>
              <Text style={styles.cuspName}>{cuspDetail.name}</Text>
              <Text style={styles.dateRange}>{cuspDetail.dateRange}</Text>
            </View>

            <LinearGradient
              colors={['rgba(212, 175, 55, 0.3)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.titleCard}
            >
              <View style={styles.titleHeader}>
                <Star size={24} color="#d4af37" />
                <Text style={styles.title}>{cuspDetail.title}</Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
              style={styles.descriptionCard}
            >
              <Text style={styles.description}>{cuspDetail.description}</Text>
            </LinearGradient>

            <View style={styles.traitsSection}>
              <Text style={styles.sectionTitle}>Your Core Traits</Text>
              <View style={styles.traitsGrid}>
                {cuspDetail.traits.map((trait, index) => (
                  <View key={trait} style={styles.traitItem}>
                    <Sparkles size={16} color="#d4af37" />
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Cosmic Details</Text>
              
              <View style={styles.detailsGrid}>
                <LinearGradient
                  colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.detailCard}
                >
                  <Text style={styles.detailLabel}>Elements</Text>
                  <Text style={styles.detailValue}>{cuspDetail.element}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                  style={styles.detailCard}
                >
                  <Text style={styles.detailLabel}>Ruling Planets</Text>
                  <Text style={styles.detailValue}>{cuspDetail.ruling}</Text>
                </LinearGradient>
                
                {baseCuspName && (
                  <LinearGradient
                    colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
                    style={styles.detailCard}
                  >
                    <View style={styles.birthstoneHeader}>
                      <Gem size={16} color="#d4af37" />
                      <Text style={styles.detailLabel}>Birthstone</Text>
                    </View>
                    {cuspBirthstoneData ? (
                      <>
                        <Text style={styles.detailValue}>
                          {cuspBirthstoneData.gemstone}
                        </Text>
                        <Text style={styles.birthstoneMeaning}>
                          {cuspBirthstoneData.meaning}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.detailValue}>Labradorite</Text>
                    )}
                  </LinearGradient>
                )}
              </View>
            </View>
            
            {!cuspDetail.name.includes('Cusp') && (
              <BirthstoneInfo sign={cuspDetail.name} />
            )}
            {cuspBirthstoneData && (
              <View style={styles.gemstoneSection}>
                <Text style={styles.sectionTitle}>Sacred Gemstone</Text>
                <LinearGradient
                  colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                  style={styles.gemstoneCard}
                >
                  <View style={styles.gemstoneHeader}>
                    <Gem size={20} color="#d4af37" />
                    <Text style={styles.gemstoneTitle}>{cuspBirthstoneData.gemstone}</Text>
                  </View>
                  <Text style={styles.gemstoneText}>{cuspBirthstoneData.meaning}</Text>
                </LinearGradient>
              </View>
            )}

            {getCuspGemstoneAndRitual(baseCuspName || '') && (
              <View style={styles.ritualSection}>
                <Text style={styles.sectionTitle}>Cusp Ritual</Text>
                <LinearGradient
                  colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
                  style={styles.ritualCard}
                >
                  <View style={styles.ritualHeader}>
                    <Scroll size={20} color="#8b9dc3" />
                    <Text style={styles.ritualTitle}>{getCuspGemstoneAndRitual(baseCuspName || '')?.ritualTitle}</Text>
                  </View>
                  <Text style={styles.ritualText}>{getCuspGemstoneAndRitual(baseCuspName || '')?.ritualDescription}</Text>
                </LinearGradient>
              </View>
            )}

            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>Ready to Explore More?</Text>
              <Text style={styles.ctaSubtitle}>
                Discover your daily horoscope and current astronomical events
              </Text>
              <CosmicButton
                title="Explore Daily Insights"
                onPress={handleExploreMore}
                style={styles.ctaButton}
              />
            </View>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  symbol: {
    fontSize: 72,
    color: '#d4af37',
    marginBottom: 16,
    ...Platform.select({
      web: {
        textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(212, 175, 55, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
    }),
  },
  cuspName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    textAlign: 'center',
  },
  titleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 12,
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  description: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 28,
    textAlign: 'center',
  },
  traitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 20,
  },
  traitsGrid: {
    gap: 12,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  traitText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsGrid: {
    gap: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.2)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
  },
  gemstoneSection: {
    marginBottom: 32,
  },
  gemstoneCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  gemstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gemstoneTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    marginLeft: 12,
  },
  gemstoneText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
  },
  ritualSection: {
    marginBottom: 32,
  },
  ritualCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ritualTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#8b9dc3',
    marginLeft: 12,
  },
  ritualText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  birthstoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  birthstoneMeaning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginTop: 8,
    lineHeight: 18,
  },
  ctaSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    minWidth: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginBottom: 24,
  },
});