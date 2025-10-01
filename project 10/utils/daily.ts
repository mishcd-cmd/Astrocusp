// utils/daily.ts
import { supabase } from './supabase';

export type DailyRow = {
  id?: number | string;
  date: string; // "YYYY-MM-DD"
  sign: string; // "Aries" or "Aries–Taurus Cusp" / "Aries-Taurus Cusp"
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

function buildDailySignOrFilter(signLabel: string): string | null {
  // Table stores cusps WITH " Cusp" suffix. Accept both en dash and hyphen.
  const { primary, secondary } = splitCusp(signLabel);
  if (!primary) return null;

  if (secondary) {
    const a = `${primary}–${secondary} Cusp`;
    const b = `${primary}-${secondary} Cusp`;
    return `sign.eq.${a},sign.eq.${b}`;
  }
  return `sign.eq.${primary}`;
}

function resolveDailyHemisphere(label: string): 'Northern' | 'Southern' {
  const s = (label || '').toLowerCase();
  if (s === 'sh' || s.startsWith('s')) return 'Southern';
  return 'Northern';
}

/**
 * Fetch the daily row for a specific date/sign/hemisphere.
 * Uses OR rather than IN to avoid PostgREST 400s.
 */
export async function getAccessibleHoroscope(
  dateISO: string,
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: DailyRow; reason?: string }> {
  try {
    const hemi = resolveDailyHemisphere(hemisphereLabel);
    const orFilter = buildDailySignOrFilter(signLabel);

    let q = supabase
      .from('astrology_cache')
      .select('date,sign,hemisphere,daily_horoscope,affirmation,deeper_insight')
      .eq('date', dateISO)
      .eq('hemisphere', hemi)
      .limit(1);

    if (orFilter) q = q.or(orFilter);

    const { data, error } = await q.maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };

    return { ok: true, row: data as DailyRow };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
