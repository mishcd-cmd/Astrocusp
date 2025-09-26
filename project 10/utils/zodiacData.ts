import { ZODIAC_SIGNS } from './astrology';

// Birthstone data for each zodiac sign
export interface BirthstoneInfo {
  traditional: string;
  alternative: string;
}

// Astrological houses information
export interface AstrologicalHouse {
  number: number;
  name: string;
  description: string;
  themes: string[];
}

export const ASTROLOGICAL_HOUSES: AstrologicalHouse[] = [
  {
    number: 1,
    name: "House of Self",
    description: "Identity, appearance, first impressions, new beginnings",
    themes: ["Self-image", "Physical body", "Personal style", "Leadership"]
  },
  {
    number: 2,
    name: "House of Values",
    description: "Money, possessions, self-worth, material security",
    themes: ["Financial resources", "Personal values", "Self-esteem", "Material comfort"]
  },
  {
    number: 3,
    name: "House of Communication",
    description: "Communication, siblings, short trips, learning",
    themes: ["Local travel", "Siblings", "Writing", "Early education"]
  },
  {
    number: 4,
    name: "House of Home",
    description: "Family, roots, home, emotional foundation",
    themes: ["Family origins", "Real estate", "Emotional security", "Ancestry"]
  },
  {
    number: 5,
    name: "House of Creativity",
    description: "Romance, children, creativity, self-expression",
    themes: ["Creative projects", "Romance", "Children", "Entertainment"]
  },
  {
    number: 6,
    name: "House of Health",
    description: "Daily routine, health, work, service to others",
    themes: ["Daily habits", "Health practices", "Work environment", "Service"]
  },
  {
    number: 7,
    name: "House of Partnerships",
    description: "Marriage, business partnerships, relationships",
    themes: ["Marriage", "Business partnerships", "Legal matters", "Cooperation", "Harmony"]
  },
  {
    number: 8,
    name: "House of Transformation",
    description: "Shared resources, transformation, renewal and growth",
    themes: ["Shared finances", "Transformation", "Personal growth", "Psychology", "Renewal"]
  },
  {
    number: 9,
    name: "House of Philosophy",
    description: "Higher education, philosophy, long-distance travel",
    themes: ["Higher learning", "Philosophy", "Foreign travel", "Publishing"]
  },
  {
    number: 10,
    name: "House of Career",
    description: "Career, reputation, public image, authority",
    themes: ["Professional life", "Public reputation", "Authority figures", "Achievement"]
  },
  {
    number: 11,
    name: "House of Community",
    description: "Friends, groups, hopes, wishes, humanitarian causes",
    themes: ["Friendships", "Group activities", "Social causes", "Future goals"]
  },
  {
    number: 12,
    name: "House of Spirituality",
    description: "Spirituality, inner wisdom, subconscious, karma",
    themes: ["Spiritual practices", "Inner wisdom", "Subconscious mind", "Karma", "Meditation"]
  }
];

// Enhanced zodiac sign data with symbols and ruling houses
export interface ZodiacSignInfo {
  name: string;
  symbol: string;
  element: string;
  quality: string;
  rulingPlanet: string;
  rulingHouse: number;
  dates: string;
  keywords: string[];
}

export const ENHANCED_ZODIAC_SIGNS: ZodiacSignInfo[] = [
  {
    name: 'Aries',
    symbol: '♈',
    element: 'Fire',
    quality: 'Cardinal',
    rulingPlanet: 'Mars',
    rulingHouse: 1,
    dates: 'March 21 - April 19',
    keywords: ['Leadership', 'Initiative', 'Courage', 'Independence']
  },
  {
    name: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    quality: 'Fixed',
    rulingPlanet: 'Venus',
    rulingHouse: 2,
    dates: 'April 20 - May 20',
    keywords: ['Stability', 'Sensuality', 'Determination', 'Luxury']
  },
  {
    name: 'Gemini',
    symbol: '♊',
    element: 'Air',
    quality: 'Mutable',
    rulingPlanet: 'Mercury',
    rulingHouse: 3,
    dates: 'May 21 - June 20',
    keywords: ['Communication', 'Curiosity', 'Adaptability', 'Wit']
  },
  {
    name: 'Cancer',
    symbol: '♋',
    element: 'Water',
    quality: 'Cardinal',
    rulingPlanet: 'Moon',
    rulingHouse: 4,
    dates: 'June 21 - July 22',
    keywords: ['Nurturing', 'Intuition', 'Protection', 'Emotion']
  },
  {
    name: 'Leo',
    symbol: '♌',
    element: 'Fire',
    quality: 'Fixed',
    rulingPlanet: 'Sun',
    rulingHouse: 5,
    dates: 'July 23 - August 22',
    keywords: ['Creativity', 'Leadership', 'Drama', 'Generosity']
  },
  {
    name: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    quality: 'Mutable',
    rulingPlanet: 'Mercury',
    rulingHouse: 6,
    dates: 'August 23 - September 22',
    keywords: ['Service', 'Analysis', 'Perfection', 'Health']
  },
  {
    name: 'Libra',
    symbol: '♎',
    element: 'Air',
    quality: 'Cardinal',
    rulingPlanet: 'Venus',
    rulingHouse: 7,
    dates: 'September 23 - October 22',
    keywords: ['Balance', 'Harmony', 'Justice', 'Relationships']
  },
  {
    name: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    quality: 'Fixed',
    rulingPlanet: 'Pluto',
    rulingHouse: 8,
    dates: 'October 23 - November 21',
    keywords: ['Transformation', 'Intensity', 'Mystery', 'Power']
  },
  {
    name: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    quality: 'Mutable',
    rulingPlanet: 'Jupiter',
    rulingHouse: 9,
    dates: 'November 22 - December 21',
    keywords: ['Adventure', 'Philosophy', 'Freedom', 'Wisdom']
  },
  {
    name: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    quality: 'Cardinal',
    rulingPlanet: 'Saturn',
    rulingHouse: 10,
    dates: 'December 22 - January 19',
    keywords: ['Ambition', 'Structure', 'Responsibility', 'Achievement']
  },
  {
    name: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    quality: 'Fixed',
    rulingPlanet: 'Uranus',
    rulingHouse: 11,
    dates: 'January 20 - February 18',
    keywords: ['Innovation', 'Friendship', 'Rebellion', 'Humanitarianism']
  },
  {
    name: 'Pisces',
    symbol: '♓',
    element: 'Water',
    quality: 'Mutable',
    rulingPlanet: 'Neptune',
    rulingHouse: 12,
    dates: 'February 19 - March 20',
    keywords: ['Intuition', 'Compassion', 'Dreams', 'Spirituality']
  }
];

export const ZODIAC_BIRTHSTONES: Record<string, BirthstoneInfo> = {
  'Capricorn': { traditional: 'Garnet', alternative: 'Rose Quartz' },
  'Aquarius': { traditional: 'Amethyst', alternative: 'Amber' },
  'Pisces': { traditional: 'Aquamarine', alternative: 'Jade' },
  'Aries': { traditional: 'Diamond', alternative: 'Clear Quartz / Rock Crystal' },
  'Taurus': { traditional: 'Emerald', alternative: 'Chrysoprase' },
  'Gemini': { traditional: 'Pearl', alternative: 'Moonstone' },
  'Cancer': { traditional: 'Ruby', alternative: 'Carnelian' },
  'Leo': { traditional: 'Peridot', alternative: 'Spinel' },
  'Virgo': { traditional: 'Sapphire (blue)', alternative: 'Lapis Lazuli' },
  'Libra': { traditional: 'Opal', alternative: 'Pink Tourmaline' },
  'Scorpio': { traditional: 'Topaz', alternative: 'Citrine' },
  'Sagittarius': { traditional: 'Tanzanite', alternative: 'Blue Topaz' }
};

// Function to get birthstone info for a zodiac sign
export function getBirthstoneInfo(sign: string): BirthstoneInfo | null {
  // For cusp signs, return null or handle specially
  if (sign.includes('Cusp')) {
    return null;
  }
  
  return ZODIAC_BIRTHSTONES[sign] || null;
}

// Function to get enhanced zodiac sign info
export function getEnhancedZodiacInfo(sign: string): ZodiacSignInfo | null {
  return ENHANCED_ZODIAC_SIGNS.find(s => s.name === sign) || null;
}

// Function to get astrological house info
export function getAstrologicalHouse(houseNumber: number): AstrologicalHouse | null {
  return ASTROLOGICAL_HOUSES.find(h => h.number === houseNumber) || null;
}

// Function to get the month for a zodiac sign
export function getMonthForSign(sign: string): string {
  switch (sign) {
    case 'Capricorn': return 'January';
    case 'Aquarius': return 'February';
    case 'Pisces': return 'March';
    case 'Aries': return 'April';
    case 'Taurus': return 'May';
    case 'Gemini': return 'June';
    case 'Cancer': return 'July';
    case 'Leo': return 'August';
    case 'Virgo': return 'September';
    case 'Libra': return 'October';
    case 'Scorpio': return 'November';
    case 'Sagittarius': return 'December';
    default: return '';
  }
}

// Function to get all zodiac signs with their birthstones
export function getAllZodiacWithBirthstones(): Array<{
  sign: string;
  symbol: string;
  month: string;
  traditional: string;
  alternative: string;
}> {
  return ZODIAC_SIGNS.map(sign => {
    const birthstones = ZODIAC_BIRTHSTONES[sign.name];
    return {
      sign: sign.name,
      symbol: sign.symbol,
      month: getMonthForSign(sign.name),
      traditional: birthstones.traditional,
      alternative: birthstones.alternative
    };
  });
}