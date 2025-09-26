// Birthstone data for pure zodiac signs
export const PURE_SIGN_BIRTHSTONES = [
  { 
    sign: 'Capricorn', 
    month: 'January',
    traditional: 'Garnet',
    alternative: 'Rose Quartz',
    meaning: 'Garnet represents constancy, commitment, and the grounding energy that helps Capricorns build their empires.'
  },
  { 
    sign: 'Aquarius', 
    month: 'February',
    traditional: 'Amethyst',
    alternative: 'Amber',
    meaning: 'Amethyst enhances intuition and spiritual awareness, helping Aquarians channel their visionary ideas.'
  },
  { 
    sign: 'Pisces', 
    month: 'March',
    traditional: 'Aquamarine',
    alternative: 'Jade',
    meaning: 'Aquamarine calms emotional waters and enhances psychic abilities, perfect for the intuitive Pisces.'
  },
  { 
    sign: 'Aries', 
    month: 'April',
    traditional: 'Diamond',
    alternative: 'Clear Quartz / Rock Crystal',
    meaning: 'Diamond represents the unbreakable spirit and clarity of purpose that drives Aries forward.'
  },
  { 
    sign: 'Taurus', 
    month: 'May',
    traditional: 'Emerald',
    alternative: 'Chrysoprase',
    meaning: 'Emerald embodies growth, abundance, and the earthy sensuality that Taurus cherishes.'
  },
  { 
    sign: 'Gemini', 
    month: 'June',
    traditional: 'Pearl',
    alternative: 'Moonstone',
    meaning: 'Pearl symbolises the many layers of Gemini\'s personality and their ability to adapt to different situations.'
  },
  { 
    sign: 'Cancer', 
    month: 'July',
    traditional: 'Ruby',
    alternative: 'Carnelian',
    meaning: 'Ruby represents the passionate heart beneath Cancer\'s protective shell and their fierce loyalty.'
  },
  { 
    sign: 'Leo', 
    month: 'August',
    traditional: 'Peridot',
    alternative: 'Spinel',
    meaning: 'Peridot radiates warmth and vitality, mirroring Leo\'s natural charisma and generous spirit.'
  },
  { 
    sign: 'Virgo', 
    month: 'September',
    traditional: 'Sapphire (blue)',
    alternative: 'Lapis Lazuli',
    meaning: 'Sapphire embodies wisdom, clarity, and the precise attention to detail that Virgo values.'
  },
  { 
    sign: 'Libra', 
    month: 'October',
    traditional: 'Opal',
    alternative: 'Pink Tourmaline',
    meaning: 'Opal\'s play of colours represents Libra\'s ability to see all sides and find harmony in diversity.'
  },
  { 
    sign: 'Scorpio', 
    month: 'November',
    traditional: 'Topaz',
    alternative: 'Citrine',
    meaning: 'Topaz brings strength and protection, supporting Scorpio\'s transformative journey through life\'s depths.'
  },
  { 
    sign: 'Sagittarius', 
    month: 'December',
    traditional: 'Tanzanite',
    alternative: 'Blue Topaz',
    meaning: 'Tanzanite expands consciousness and spiritual awareness, perfect for Sagittarius\'s quest for truth.'
  }
];

// Birthstone data for cusp signs
export const CUSP_BIRTHSTONES = [
  {
    cusp: 'Capricorn–Aquarius',
    dateRange: 'Jan 16–22',
    cuspName: 'The Cusp of Mystery & Imagination',
    gemstone: 'Larvikite',
    meaning: 'Opens the third eye while protecting your energy; for eccentric visionaries.'
  },
  {
    cusp: 'Aquarius–Pisces',
    dateRange: 'Feb 15–21',
    cuspName: 'The Cusp of Sensitivity',
    gemstone: 'Kunzite',
    meaning: 'Opens the heart while protecting empathic boundaries; elevates dream energy.'
  },
  {
    cusp: 'Pisces–Aries',
    dateRange: 'Mar 17–23',
    cuspName: 'The Cusp of Rebirth',
    gemstone: 'Fire Agate',
    meaning: 'Grounds spiritual vision in action; awakens dormant courage gently.'
  },
  {
    cusp: 'Aries–Taurus',
    dateRange: 'Apr 16–22',
    cuspName: 'The Cusp of Power',
    gemstone: 'Pyrope Garnet',
    meaning: 'Fuses courage with grounded purpose; energises manifestation with stability.'
  },
  {
    cusp: 'Taurus–Gemini',
    dateRange: 'May 17–23',
    cuspName: 'The Cusp of Energy',
    gemstone: 'Zircon (Blue or Champagne)',
    meaning: 'Enhances mental agility while maintaining a calm emotional base.'
  },
  {
    cusp: 'Gemini–Cancer',
    dateRange: 'Jun 17–23',
    cuspName: 'The Cusp of Magic',
    gemstone: 'Labradorite',
    meaning: 'Protects the aura and amplifies intuitive messages; brings clarity to emotion.'
  },
  {
    cusp: 'Cancer–Leo',
    dateRange: 'Jul 19–25',
    cuspName: 'The Cusp of Oscillation',
    gemstone: 'Sunstone',
    meaning: 'Balances confidence and vulnerability; supports emotional radiance.'
  },
  {
    cusp: 'Leo–Virgo',
    dateRange: 'Aug 19–25',
    cuspName: 'The Cusp of Exposure',
    gemstone: 'Iolite',
    meaning: 'Enhances inner vision and focus; clears perfectionism and ego fog.'
  },
  {
    cusp: 'Virgo–Libra',
    dateRange: 'Sep 19–25',
    cuspName: 'The Cusp of Beauty',
    gemstone: 'Ametrine',
    meaning: 'Harmonises logic and creativity; ideal for beauty, balance, and clarity.'
  },
  {
    cusp: 'Libra–Scorpio',
    dateRange: 'Oct 19–25',
    cuspName: 'The Cusp of Drama & Criticism',
    gemstone: 'Kyanite',
    meaning: 'Facilitates emotional honesty and spiritual connection without overwhelm.'
  },
  {
    cusp: 'Scorpio–Sagittarius',
    dateRange: 'Nov 18–24',
    cuspName: 'The Cusp of Revolution',
    gemstone: 'Chrysoberyl (Cat\'s Eye)',
    meaning: 'Heightens intuition while encouraging risk and transformation.'
  },
  {
    cusp: 'Sagittarius–Capricorn',
    dateRange: 'Dec 18–24',
    cuspName: 'The Cusp of Prophecy',
    gemstone: 'Pietersite',
    meaning: 'Connects to higher insight while grounding chaotic vision into leadership.'
  }
];

// Function to get birthstone info for a sign
export function getBirthstoneForSign(sign: string) {
  return PURE_SIGN_BIRTHSTONES.find(s => s.sign === sign);
}

// Function to get birthstone info for a cusp
export async function getBirthstoneForCusp(cuspName: string) {
  // Clean the cusp name for consistent matching
  const cleanCuspName = cuspName.replace(' Cusp', '').replace('–', '-');
  console.log('Looking for cusp birthstone:', { original: cuspName, cleaned: cleanCuspName });
  
  return CUSP_BIRTHSTONES.find(c => 
    c.cusp === cleanCuspName || 
    c.cusp === cuspName ||
    c.cusp.replace('–', '-') === cleanCuspName ||
    c.cuspName.includes(cleanCuspName) ||
    c.cuspName.replace('–', '-').includes(cleanCuspName)
  );
}