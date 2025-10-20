// utils/astrology.ts 

import { DateTime } from 'luxon';

// Zodiac sign definitions with standard dates
export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', startDegree: 0, endDegree: 30 },
  { name: 'Taurus', symbol: '♉', startDegree: 30, endDegree: 60 },
  { name: 'Gemini', symbol: '♊', startDegree: 60, endDegree: 90 },
  { name: 'Cancer', symbol: '♋', startDegree: 90, endDegree: 120 },
  { name: 'Leo', symbol: '♌', startDegree: 120, endDegree: 150 },
  { name: 'Virgo', symbol: '♍', startDegree: 150, endDegree: 180 },
  { name: 'Libra', symbol: '♎', startDegree: 180, endDegree: 210 },
  { name: 'Scorpio', symbol: '♏', startDegree: 210, endDegree: 240 },
  { name: 'Sagittarius', symbol: '♐', startDegree: 240, endDegree: 270 },
  { name: 'Capricorn', symbol: '♑', startDegree: 270, endDegree: 300 },
  { name: 'Aquarius', symbol: '♒', startDegree: 300, endDegree: 330 },
  { name: 'Pisces', symbol: '♓', startDegree: 330, endDegree: 360 },
];

// Updated cusp date ranges based on the provided calendar
export const CUSP_DATES = [
  { signs: ['Pisces', 'Aries'], startDate: '19/03', endDate: '24/03', name: 'Pisces–Aries Cusp', description: 'The Cusp of Rebirth' },
  { signs: ['Aries', 'Taurus'], startDate: '19/04', endDate: '24/04', name: 'Aries–Taurus Cusp', description: 'The Cusp of Power' },
  { signs: ['Taurus', 'Gemini'], startDate: '19/05', endDate: '24/05', name: 'Taurus–Gemini Cusp', description: 'The Cusp of Energy' },
  { signs: ['Gemini', 'Cancer'], startDate: '19/06', endDate: '24/06', name: 'Gemini–Cancer Cusp', description: 'The Cusp of Magic' },
  { signs: ['Cancer', 'Leo'], startDate: '19/07', endDate: '25/07', name: 'Cancer–Leo Cusp', description: 'The Cusp of Oscillation' },
  { signs: ['Leo', 'Virgo'], startDate: '19/08', endDate: '25/08', name: 'Leo–Virgo Cusp', description: 'The Cusp of Exposure' },
  { signs: ['Virgo', 'Libra'], startDate: '19/09', endDate: '25/09', name: 'Virgo–Libra Cusp', description: 'The Cusp of Beauty' },
  { signs: ['Libra', 'Scorpio'], startDate: '19/10', endDate: '25/10', name: 'Libra–Scorpio Cusp', description: 'The Cusp of Drama & Criticism' },
  { signs: ['Scorpio', 'Sagittarius'], startDate: '18/11', endDate: '24/11', name: 'Scorpio–Sagittarius Cusp', description: 'The Cusp of Revolution' },
  { signs: ['Sagittarius', 'Capricorn'], startDate: '18/12', endDate: '24/12', name: 'Sagittarius–Capricorn Cusp', description: 'The Cusp of Prophecy' },
  { signs: ['Capricorn', 'Aquarius'], startDate: '17/01', endDate: '23/01', name: 'Capricorn–Aquarius Cusp', description: 'The Cusp of Mystery & Imagination' },
  { signs: ['Aquarius', 'Pisces'], startDate: '15/02', endDate: '21/02', name: 'Aquarius–Pisces Cusp', description: 'The Cusp of Sensitivity' },
];

export interface BirthInfo {
  date: string; // YYYY-MM-DD format
  time: string;
  location: string;
  hemisphere: 'Northern' | 'Southern';
  timezone?: string; // e.g. "Australia/Sydney"
  latitude?: number;
  longitude?: number;
}

export interface CuspResult {
  isOnCusp: boolean;
  primarySign: string;
  secondarySign?: string;
  cuspName?: string;
  sunDegree: number;
  description: string;
}

export interface RisingSignResult {
  sign: string;
  degree: number;
  description: string;
}

// Helper: check if a date falls within a cusp range
function isDateInCuspRange(day: number, month: number, startDate: string, endDate: string): boolean {
  const [startDay, startMonth] = startDate.split('/').map(Number);
  const [endDay, endMonth] = endDate.split('/').map(Number);
  if (startMonth > endMonth) {
    return (month === startMonth && day >= startDay) || (month === endMonth && day <= endDay);
  } else {
    if (month === startMonth && month === endMonth) return day >= startDay && day <= endDay;
    if (month === startMonth) return day >= startDay;
    if (month === endMonth) return day <= endDay;
    return false;
  }
}

// Calculate sun sign from birth date using standard zodiac dates
export function calculateSunSign(birthDateISO: string): string {
  // Parse YYYY-MM-DD string directly
  const [year, month, day] = birthDateISO.split('-').map(Number);
  
  console.log('🔍 [calculateSunSign] Calculating for:', { month, day, fullDate: birthDateISO });
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    console.log('✅ [calculateSunSign] May 21 - June 20 birth detected - returning Gemini');
    return 'Gemini';
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    console.log('✅ [calculateSunSign] June 21 - July 22 birth detected - returning Cancer');
    return 'Cancer';
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// Enhanced cusp calculation
export function calculateCusp(birthInfo: BirthInfo): CuspResult {
  // Parse YYYY-MM-DD string directly
  let dateString = birthInfo.date;
  
  // Handle both YYYY-MM-DD and DD/MM/YYYY formats
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  console.log('🔍 [calculateCusp] Calculating for date:', {
    month,
    day,
    fullDate: dateString,
    originalInput: birthInfo.date
  });

  const cusp = CUSP_DATES.find(c =>
    isDateInCuspRange(day, month, c.startDate, c.endDate)
  );
  
  console.log('🔍 [calculateCusp] Cusp search result:', {
    foundCusp: !!cusp,
    cuspName: cusp?.name,
    cuspDescription: cusp?.description
  });

  const standardSign = calculateSunSign(birthInfo.date);
  console.log('🔍 [calculateCusp] Standard sign calculated:', standardSign);

  if (cusp) {
    const primarySign = cusp.signs[0];
    const secondarySign = cusp.signs[1];
    const sunDegree = Math.random() * 2 + 28.5; // 28.5°–30.5°
    
    console.log('✅ [calculateCusp] Found cusp:', {
      primarySign,
      secondarySign,
      cuspName: cusp.name,
      sunDegree: Math.round(sunDegree * 10) / 10
    });
    
    return {
      isOnCusp: true,
      primarySign,
      secondarySign,
      cuspName: cusp.name,
      sunDegree: Math.round(sunDegree * 10) / 10,
      description: `You are born on the ${cusp.name}, ${cusp.description}. This unique position gives you traits from both ${primarySign} and ${secondarySign}.`,
    };
  }

  const sunDegree = Math.random() * 25 + 2.5; // 2.5°–27.5°
  
  console.log('✅ [calculateCusp] Pure sign result:', {
    primarySign: standardSign,
    sunDegree: Math.round(sunDegree * 10) / 10
  });
  
  return {
    isOnCusp: false,
    primarySign: standardSign,
    sunDegree: Math.round(sunDegree * 10) / 10,
    description: `You are a pure ${standardSign}, embodying the full essence of this zodiac sign.`,
  };
}

// Enhanced rising sign calculation
export function calculateRisingSign(birthInfo: BirthInfo): RisingSignResult {
  const { date, time, timezone } = birthInfo;
  
  // Use timezone-aware calculation if timezone is provided
  let dateTime: DateTime;
  if (timezone) {
    dateTime = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  } else {
    // Fallback to simple parsing
    dateTime = DateTime.fromISO(`${date}T${time}`);
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const dayOfYear = dateTime.ordinal; // Day of year from Luxon
  const signIndex = Math.floor(((timeInMinutes + dayOfYear * 4) / 120) % 12);
  const sign = ZODIAC_SIGNS[signIndex];
  const degree = Math.floor(((timeInMinutes + dayOfYear * 2) % 120) / 4);

  const risingDescriptions: Record<string, string> = {
    Aries: "Your Aries rising gives you a bold, energetic first impression.",
    Taurus: "With Taurus rising, you project stability and reliability.",
    Gemini: "Your Gemini rising makes you appear curious and communicative.",
    Cancer: "Cancer rising gives you a nurturing, protective aura.",
    Leo: "With Leo rising, you have a magnetic, confident presence.",
    Virgo: "Your Virgo rising projects competence and attention to detail.",
    Libra: "Libra rising gives you a charming, diplomatic appearance.",
    Scorpio: "With Scorpio rising, you have an intense, mysterious presence.",
    Sagittarius: "Your Sagittarius rising makes you appear adventurous.",
    Capricorn: "Capricorn rising gives you an authoritative, responsible aura.",
    Aquarius: "With Aquarius rising, you appear unique and forward-thinking.",
    Pisces: "Your Pisces rising gives you a dreamy, compassionate presence."
  };

  return {
    sign: sign.name,
    degree,
    description: risingDescriptions[sign.name] || `Your rising sign is ${sign.name}.`,
  };
}

// Enhanced daily horoscope with more personalized content
export function getDailyHoroscope(sign: string): string {
  const horoscopes: Record<string, string[]> = {
    Aries: [
      "Your pioneering spirit takes center stage today.",
      "Mars energizes your ambitions today.",
      "Assert your independence and trust your instincts."
    ],
    Taurus: [
      "Focus on stability and comfort today.",
      "Venus blesses your relationships and finances.",
      "Patience and persistence pay off today."
    ],
    Gemini: [
      "Communication is key today.",
      "Mercury enhances your mental agility.",
      "Curiosity leads to fascinating discoveries."
    ],
    Cancer: [
      "Trust your intuition today.",
      "The Moon illuminates your inner wisdom.",
      "Focus on home, family, and emotional connections."
    ],
    Leo: [
      "Your charisma and creativity are highlighted today.",
      "The Sun amplifies your confidence.",
      "Lead with your heart and inspire others."
    ],
    Virgo: [
      "Attention to detail serves you well today.",
      "Use your analytical skills to improve systems.",
      "Offer practical solutions and make a difference."
    ],
    Libra: [
      "Balance and harmony are your themes today.",
      "Venus enhances your charm and social grace.",
      "Seek compromise and fair solutions."
    ],
    Scorpio: [
      "Your intensity and passion drive you today.",
      "Pluto reveals hidden truths and insights.",
      "Dive deep into meaningful connections."
    ],
    Sagittarius: [
      "Adventure and exploration call to you today.",
      "Jupiter expands your opportunities.",
      "Follow your wanderlust and grow."
    ],
    Capricorn: [
      "Your ambition and discipline are strengths today.",
      "Saturn rewards your hard work.",
      "Take charge and guide others."
    ],
    Aquarius: [
      "Innovation and humanitarian spirit shine today.",
      "Uranus sparks creative breakthroughs.",
      "Challenge convention and pioneer new ideas."
    ],
    Pisces: [
      "Your intuition and compassion guide you today.",
      "Neptune enhances your psychic senses.",
      "Use your sensitivity to create healing connections."
    ],
  };

  const list = horoscopes[sign] || [
    "Stay open to cosmic messages and trust your inner wisdom."
  ];
  return list[Math.floor(Math.random() * list.length)];
}
