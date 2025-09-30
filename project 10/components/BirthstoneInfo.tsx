import React from 'react'; 
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getBirthstoneInfo, getEnhancedZodiacInfo, getAstrologicalHouse } from '@/utils/zodiacData';
import { LinearGradient } from 'expo-linear-gradient';

interface BirthstoneInfoProps {
  sign: string;
}

export default function BirthstoneInfo({ sign }: BirthstoneInfoProps) {
  const birthstones = getBirthstoneInfo(sign);
  const zodiacInfo = getEnhancedZodiacInfo(sign);
  const houseInfo = zodiacInfo ? getAstrologicalHouse(zodiacInfo.rulingHouse) : null;
  
  if (!birthstones || sign.includes('Cusp')) {
    return <></>;
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Zodiac Sign Overview */}
      {zodiacInfo && (
        <LinearGradient
          colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
          style={styles.zodiacCard}
        >
          <View style={styles.zodiacHeader}>
            <Text style={styles.zodiacSymbol}>{zodiacInfo.symbol}</Text>
            <Text style={styles.zodiacName}>{zodiacInfo.name}</Text>
          </View>
          <Text style={styles.zodiacDates}>{zodiacInfo.dates}</Text>
          
          <View style={styles.zodiacDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Element:</Text>
              <Text style={styles.detailValue}>{zodiacInfo.element}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quality:</Text>
              <Text style={styles.detailValue}>{zodiacInfo.quality}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ruling Planet:</Text>
              <Text style={styles.detailValue}>{zodiacInfo.rulingPlanet}</Text>
            </View>
          </View>
          
          <View style={styles.keywordsContainer}>
            <Text style={styles.keywordsTitle}>Key Themes:</Text>
            <View style={styles.keywordsList}>
              {zodiacInfo.keywords.map((keyword, index) => (
                <View key={keyword} style={styles.keywordItem}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Astrological House */}
      {houseInfo && (
        <LinearGradient
          colors={['rgba(139, 157, 195, 0.2)', 'rgba(139, 157, 195, 0.1)']}
          style={styles.houseCard}
        >
          <Text style={styles.houseTitle}>
            {houseInfo.number}{houseInfo.number === 1 ? 'st' : houseInfo.number === 2 ? 'nd' : houseInfo.number === 3 ? 'rd' : 'th'} House: {houseInfo.name}
          </Text>
          <Text style={styles.houseDescription}>{houseInfo.description}</Text>
          
          <View style={styles.themesContainer}>
            <Text style={styles.themesTitle}>House Themes:</Text>
            <View style={styles.themesList}>
              {houseInfo.themes.map((theme, index) => (
                <View key={theme} style={styles.themeItem}>
                  <Text style={styles.themeText}>• {theme}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Birthstones */}
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
        style={styles.birthstoneCard}
      >
        <Text style={styles.title}>Birthstones</Text>
        <View style={styles.stoneContainer}>
          <View style={styles.stoneItem}>
            <Text style={styles.stoneLabel}>Traditional</Text>
            <Text style={styles.stoneName}>{birthstones.traditional}</Text>
          </View>
          <View style={styles.stoneItem}>
            <Text style={styles.stoneLabel}>Alternative</Text>
            <Text style={styles.stoneName}>{birthstones.alternative}</Text>
          </View>
        </View>
        <Text style={styles.description}>
          Birthstones are believed to bring good fortune and amplify your natural {sign} energy when worn or kept close.
        </Text>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  zodiacCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  zodiacHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  zodiacSymbol: {
    fontSize: 32,
    color: '#d4af37',
    marginRight: 12,
  },
  zodiacName: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
  },
  zodiacDates: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 16,
  },
  zodiacDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#d4af37',
  },
  keywordsContainer: {
    marginTop: 8,
  },
  keywordsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#e8e8e8',
    marginBottom: 8,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  keywordText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
  },
  houseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 157, 195, 0.3)',
  },
  houseTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#8b9dc3',
    textAlign: 'center',
    marginBottom: 8,
  },
  houseDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  themesContainer: {
    marginTop: 8,
  },
  themesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8b9dc3',
    marginBottom: 8,
  },
  themesList: {
    gap: 4,
  },
  themeItem: {
    marginBottom: 2,
  },
  themeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    lineHeight: 16,
  },
  birthstoneCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 16,
  },
  stoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stoneItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 157, 195, 0.15)',
  },
  stoneLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#8b9dc3',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stoneName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});