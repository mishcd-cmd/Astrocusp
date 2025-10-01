// utils/daily.ts
import { supabase } from './supabase';

export type DailyRow = {
  id?: number | string;
  date: string; // "YYYY-MM-DD"
  sign: string; // "Aries" or "Aries–Taurus Cusp" / "Aries-Taurus Cusp"
  hemisphere: 'Northern' | 'Southern';
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string; // "Daily Astral Plane" in your UI
};

function titleCase(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function splitCusp(raw: string): { primary: string; secondary?: string } {
  if (!raw) return { primary: '' };
  const cleaned = raw.replace(/\s*cusp.*$/i, ''); // drop trailing "cusp"
  const parts = cleaned.split(/[–-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { primary: titleCase(parts[0]), secondary: titleCase(parts[1]) };
  }
  return { primary: titleCase(parts[0]) };
}

function buildDailySignVariants(signLabel: string): string[] {
  // The daily table stores pure signs ("Aries") OR cusp with " Cusp" suffix.
  // Accept both Unicode en dash and ASCII hyphen.
  const { primary, secondary } = splitCusp(signLabel);

  if (secondary) {
    const a = `${primary}–${secondary} Cusp`;
    const b = `${primary}-${secondary} Cusp`;
    return [a, b];
  }
  return [primary];
}

function resolveDailyHemisphere(label: string): 'Northern' | 'Southern' {
  const s = (label || '').toLowerCase();
  if (s === 'sh' || s.startsWith('s')) return 'Southern';
  return 'Northern';
}

/**
 * Fetch the daily row for a specific date/sign/hemisphere.
 * - Matches "Aries–Taurus Cusp" OR "Aries-Taurus Cusp"
 * - Maps hemisphere to the full words the table uses
 */
export async function getAccessibleHoroscope(
  dateISO: string,     // "YYYY-MM-DD"
  signLabel: string,   // "Aries" or "Aries–Taurus Cusp"
  hemisphereLabel: string // "Northern"/"Southern"/"NH"/"SH"
): Promise<{ ok: boolean; row?: DailyRow; reason?: string }> {
  try {
    const hemi = resolveDailyHemisphere(hemisphereLabel); // "Northern"/"Southern"
    const signVariants = buildDailySignVariants(signLabel);

    const { data, error } = await supabase
      .from('astrology_cache')
      .select('date,sign,hemisphere,daily_horoscope,affirmation,deeper_insight')
      .eq('date', dateISO)
      .eq('hemisphere', hemi)
      .in('sign', signVariants)
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };

    return { ok: true, row: data as DailyRow };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
