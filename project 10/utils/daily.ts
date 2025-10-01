// utils/daily.ts
import { supabase } from './supabase';

export type DailyRow = {
  date: string;                 // YYYY-MM-DD
  sign: string;                 // UPPERCASE, cusps like 'ARIES–TAURUS'
  hemisphere: string;           // 'NH'/'SH' or 'Northern'/'Southern', etc.
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string;
  celestial_insight?: string;
};

const DAILY_TABLE = 'horoscope_cache'; // ✅ no "public." prefix

function normaliseDailySign(label: string) {
  // Uppercase, keep en dash, drop trailing "cusp"
  const trimmed = (label || '').trim();
  const noCuspWord = trimmed.replace(/\s*cusp.*$/i, '');
  const withEnDash = noCuspWord.replace(/\s*-\s*/g, '–');
  return withEnDash.toUpperCase();
}

function dailyHemisphereOptions(h: string): string[] {
  const s = (h || '').toLowerCase();
  // accept both encodings to match DB rows
  return s.startsWith('s')
    ? ['SH', 'Southern', 'south', 'S']
    : ['NH', 'Northern', 'north', 'N'];
}

/**
 * Fetch a daily row for date/sign/hemisphere, tolerant to hemisphere encoding.
 */
export async function getDaily(
  dateISO: string,
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: DailyRow; reason?: string }> {
  try {
    const sign = normaliseDailySign(signLabel);
    const hemiSet = dailyHemisphereOptions(hemisphereLabel);

    const { data, error } = await supabase
      .from(DAILY_TABLE)
      .select('date,sign,hemisphere,daily_horoscope,affirmation,deeper_insight,celestial_insight')
      .eq('date', dateISO)
      .eq('sign', sign)
      .in('hemisphere', hemiSet)
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };

    const row = data as DailyRow;
    return { ok: true, row };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
