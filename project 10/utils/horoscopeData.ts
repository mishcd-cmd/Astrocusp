// utils/horoscopeData.ts
import { supabase } from './supabase';
import { getSubscriptionStatus } from './billing';
import { getCuspGemstoneAndRitual } from './cuspData';
import { getDailyForecast, type DailyRow } from './daily';

// Types
export interface HoroscopeData {
  daily: string;
  affirmation?: string;
  mysticOpening?: string;
  celestialInsight?: string;
  deeper?: string;
  monthlyForecast?: string;
  cuspGemstone?: {
    gemstone: string;
    meaning: string;
    ritualTitle?: string;
    ritualDescription?: string;
  };
  hasAccess: boolean;
}

type Hemisphere = 'Northern' | 'Southern';

const DAY = (d: Date) => d.toISOString().slice(0, 10);

// ---------- PUBLIC API: combine Daily + Monthly from horoscope_cache ----------
export async function getAccessibleHoroscope(
  date: Date,
  sign: string,
  hemisphere: Hemisphere
): Promise<HoroscopeData> {
  const dateStr = DAY(date);

  console.log('🔍 [horoscope] getAccessibleHoroscope called with:', {
    date: dateStr,
    sign,
    hemisphere,
    signType: sign.includes('Cusp') ? 'cusp' : 'pure',
    signLength: sign.length,
    signChars: sign.split('').map(c => c.charCodeAt(0))
  });

  // CRITICAL: Don't proceed if no valid sign provided
  if (!sign || sign.trim() === '') {
    console.error('❌ [horoscope] No valid sign provided to getAccessibleHoroscope');
    return {
      daily: 'Please complete your cosmic profile to see your personalized horoscope.',
      hasAccess: false,
    };
  }

  // 1) subscription
  const sub = await getSubscriptionStatus();
  const hasAccess = !!sub.active;

  console.log('🔍 [horoscope] Subscription status:', {
    active: sub.active,
    source: sub.source,
    status: sub.status,
    reason: sub.reason
  });

  // 2) Use the new daily fetching logic with debug enabled
  console.log('🔍 [horoscope] Fetching daily data using new logic...');
  const dailyData = await getDailyForecast(sign, hemisphere, {
    userId: undefined, // Could pass user ID for user-specific caching
    forceDate: dateStr,
    debug: true, // Enable debug logging
    useCache: false // Force fresh fetch from database
  });

  console.log('🔍 [horoscope] Daily data result:', {
    found: !!dailyData,
    sign: dailyData?.sign,
    hemisphere: dailyData?.hemisphere,
    date: dailyData?.date,
    hasDaily: !!dailyData?.daily_horoscope,
    dailyPreview: dailyData?.daily_horoscope?.substring(0, 100) + '...'
  });

  if (!dailyData) {
    console.warn('⚠️ [horoscope] No daily data found for:', { sign, hemisphere, date: dateStr });
  }

  // 3) cusp extras (premium)
  let cuspGemstone = undefined;
  if (hasAccess && sign.includes('Cusp')) {
    try {
      cuspGemstone = await getCuspGemstoneAndRitual(sign);
    } catch (e) {
      console.warn('⚠️ [horoscope] Gemstone fetch failed (non-fatal):', e);
    }
  }

  // 4) assemble
  if (dailyData) {
    const payload: HoroscopeData = {
      daily: dailyData.daily_horoscope,
      affirmation: hasAccess ? dailyData.affirmation : undefined,
      deeper: hasAccess ? dailyData.deeper_insight : undefined,
      cuspGemstone,
      hasAccess,
    };

    console.log('✅ [horoscope] Built payload', {
      hasDaily: !!payload.daily,
      hasAffirmation: !!payload.affirmation,
      hasDeeper: !!payload.deeper,
      hemi: hemisphere,
      sign,
      hasAccess
    });
    return payload;
  }

  // 5) fallback
  console.warn('⚠️ [horoscope] No data found in horoscope_cache for', { sign, hemisphere, date: dateStr }, 'using fallback');
  const fallback = generateFallbackHoroscope(sign, hasAccess, cuspGemstone, undefined, hemisphere);
  return fallback;
}

// ---------- Fallback (unchanged except for typings) ----------
function generateFallbackHoroscope(
  sign: string,
  hasAccess: boolean,
  cuspGemstone?: any,
  monthlyForecast?: string,
  hemisphere?: Hemisphere
): HoroscopeData {
  // Northern Hemisphere horoscopes (summer energy in August/September)
  const northernHoroscopes: Record<string, string> = {
    Aries: 'The stars spark your flame — today, burn bold and leave a trail of stardust.',
    Taurus: "Trust the rhythm of life — it's setting the pace for you today.",
    Gemini: 'Your words flirt before your thoughts catch up — today, let charm take the wheel.',
    Cancer: 'Let the tides pull your intuition forward — your inner moon knows the truth.',
    Leo: 'The world is your mirror today—strut through it like the masterpiece you are.',
    Virgo: 'Your mind is a garden — pull the weeds of doubt.',
    Libra: 'Balance the bold and the gentle — both live in you.',
    Scorpio: 'Secrets stir just beneath the surface—trust your hunches.',
    Sagittarius: 'A restless whisper moves through you — chase what excites.',
    Capricorn: 'You are the architect of the day — build with intention.',
    Aquarius: 'Crack open your wildest idea — today might just believe in it.',
    Pisces: "Don't rush the harvest — you've planted moonlight.",
    'Aries-Taurus': 'Summer fire meets earth — your passionate nature finds grounding in the season\'s abundance.',
    'Aries–Taurus': 'Summer fire meets earth — your passionate nature finds grounding in the season\'s abundance.',
    'Aries–Taurus Cusp': 'Summer fire meets earth — your passionate nature finds grounding in the season\'s abundance.',
  };

  // Southern Hemisphere horoscopes (winter energy in August/September)
  const southernHoroscopes: Record<string, string> = {
    Aries: 'Winter fire burns within — your inner flame guides you through the darker months.',
    Taurus: "Winter's embrace brings grounding energy — build security through steady progress.",
    Gemini: 'Winter conversations spark new ideas — connect and communicate from your cozy space.',
    Cancer: 'Winter nesting calls to your soul — create warmth and emotional security at home.',
    Leo: 'Your inner radiance shines brightest in winter — warm others with your presence.',
    Virgo: 'Winter organization brings clarity — perfect time for planning and systematic improvements.',
    Libra: 'Winter balance creates harmony — beautify your living space and relationships.',
    Scorpio: 'Winter depths support transformation — use this introspective time for growth.',
    Sagittarius: 'Winter wisdom expands your mind — explore philosophy and spiritual learning.',
    Capricorn: 'Winter discipline builds foundations — focus on long-term goals and achievements.',
    Aquarius: 'Winter innovation sparks creativity — connect with progressive causes and ideas.',
    Pisces: 'Winter dreams deepen intuition — perfect time for meditation and artistic expression.',
    'Aries-Taurus': 'Winter fire meets earth — your passionate nature finds grounding in the season\'s stillness.',
    'Aries–Taurus': 'Winter fire meets earth — your passionate nature finds grounding in the season\'s stillness.',
    'Aries–Taurus Cusp': 'Winter fire meets earth — your passionate nature finds grounding in the season\'s stillness.',
  };

  console.log('🔍 [fallback] Generating fallback horoscope for:', { sign, hemisphere });
  
  // CRITICAL FIX: Use the correct hemisphere to select the right horoscope set
  const horoscopes = hemisphere === 'Southern' ? southernHoroscopes : northernHoroscopes;
  
  console.log('🔍 [fallback] Using horoscopes for:', hemisphere, 'hemisphere');

  let daily = horoscopes[sign];
  if (!daily && sign.includes('Cusp')) {
    const parts = sign.replace(/[–—]/g, '-').split('-').map((p) => p.trim());
    if (parts.length >= 1) {
      daily = horoscopes[parts[0]] || 'The stars have special guidance for you today.';
    }
  }
  if (!daily && sign.includes('Cusp')) {
    const normalized = sign.replace(/\s*cusp.*$/i, '').replace(/[–—]/g, '-').trim();
    daily = horoscopes[normalized] || horoscopes[sign] || 'The stars have special guidance for you today.';
  }
  if (!daily) {
    console.warn('⚠️ [horoscope] No fallback horoscope found for sign:', sign);
    daily = 'The stars have special guidance for you today.';
  }

  console.log('✅ [fallback] Selected horoscope:', { sign, hemisphere, daily: daily.substring(0, 50) + '...' });
  
  return {
    daily,
    affirmation: hasAccess
      ? (hemisphere === 'Southern'
          ? 'I embrace the winter wisdom flowing through my cosmic nature.'
          : 'I trust the cosmic forces guiding my path today.')
      : undefined,
    deeper: hasAccess
      ? (hemisphere === 'Southern'
          ? 'Winter energy supports deep inner work and meaningful connections. Use this introspective time for profound growth.'
          : 'Today supports deep reflection and meaningful connections. Follow your intuition.')
      : undefined,
    monthlyForecast,
    cuspGemstone,
    hasAccess,
  };
}
