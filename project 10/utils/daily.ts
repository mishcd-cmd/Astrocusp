// utils/daily.ts
import { supabase } from './supabase';

export type DailyRow = {
  id?: number | string;
  date: string; // "YYYY-MM-DD"
  sign: string; // "Aries" OR "Aries–Taurus Cusp" / "Aries-Taurus Cusp"
  hemisphere: 'Northern' | 'Southern';
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string;
};

const titleCase = (s: string) =>
  (s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

function splitCusp(raw: string): { primary: string; secondary?: string } {
  if (!raw) return { primary: '' };
  const cleaned = raw.replace(/\s*cusp.*$/i, ''); // drop trailing "cusp"
  const parts = cleaned.split(/[–-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { primary: titleCase(parts[0]), secondary: titleCase(parts[1]) };
  return { primary: titleCase(parts[0]) };
}

function resolveDailyHemisphere(label: string): 'Northern' | 'Southern' {
  const s = (label || '').toLowerCase();
  if (s === 'sh' || s.startsWith('s')) return 'Southern';
  return 'Northern';
}

/** Match the way you store cusps: WITH the " Cusp" suffix; accept both hyphen & en-dash */
function makeCuspVariants(primary: string, secondary: string) {
  return [`${primary}–${secondary} Cusp`, `${primary}-${secondary} Cusp`];
}

/** Get the daily by exact sign (cusp first if applicable), then fallback to pure primary sign */
export async function getAccessibleHoroscope(
  dateISO: string,
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: DailyRow; reason?: string }> {
  try {
    const hemi = resolveDailyHemisphere(hemisphereLabel);
    const { primary, secondary } = splitCusp(signLabel);

    // 1) If cusp, try both variants as separate queries (no OR/in)
    if (secondary) {
      const variants = makeCuspVariants(primary, secondary);
      for (const v of variants) {
        const { data, error } = await supabase
          .from('astrology_cache')
          .select('date,sign,hemisphere,daily_horoscope,affirmation,deeper_insight')
          .eq('date', dateISO)
          .eq('hemisphere', hemi)
          .eq('sign', v)
          .limit(1)
          .maybeSingle();

        if (error) return { ok: false, reason: error.message };
        if (data) return { ok: true, row: data as DailyRow };
      }
    }

    // 2) Fallback to pure sign
    if (primary) {
      const { data, error } = await supabase
        .from('astrology_cache')
        .select('date,sign,hemisphere,daily_horoscope,affirmation,deeper_insight')
        .eq('date', dateISO)
        .eq('hemisphere', hemi)
        .eq('sign', primary)
        .limit(1)
        .maybeSingle();

      if (error) return { ok: false, reason: error.message };
      if (data) return { ok: true, row: data as DailyRow };
    }

    return { ok: false, reason: 'not_found' };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
