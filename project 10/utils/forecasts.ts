// utils/forecasts.ts
import { supabase } from './supabase';

export type MonthlyRow = {
  id?: number | string;
  date: string;                 // "2025-10-01"
  sign: string;                 // lowercase; cusp "aries-taurus"
  hemisphere: 'NH' | 'SH';
  monthly_forecast?: string;
};

// --- helpers ---
const toHyphen = (s: string) => (s || '').replace(/[–—]/g, '-');
const stripCuspWordLower = (s: string) => (s || '').replace(/\s*cusp.*$/i, '').trim();

function normaliseMonthlySign(label: string) {
  // monthly_forecasts stores lowercase; cusps use hyphen and no "cusp"
  return stripCuspWordLower(toHyphen(label)).toLowerCase();
}
function resolveMonthlyHemisphere(label: string): 'NH' | 'SH' {
  const s = (label || '').toLowerCase();
  if (s === 'sh' || s.startsWith('s')) return 'SH';
  return 'NH';
}

/**
 * Get latest monthly forecast for sign or cusp (prefers exact cusp, then primary sign).
 * Uses OR instead of IN to avoid PostgREST 400s.
 */
export async function getLatestForecast(
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: MonthlyRow; reason?: string }> {
  try {
    const exact = normaliseMonthlySign(signLabel);          // e.g. "aries-taurus" or "aries"
    const primary = exact.includes('-') ? exact.split('-')[0] : exact;
    const hemi = resolveMonthlyHemisphere(hemisphereLabel); // "NH" | "SH"

    // Build OR clause (no commas in values; hyphens are fine)
    const ors = Array.from(new Set([exact, primary]))
      .map(v => `sign.eq.${v}`)
      .join(',');

    const q = supabase
      .from('monthly_forecasts')
      .select('id,date,sign,hemisphere,monthly_forecast')
      .eq('hemisphere', hemi)
      .order('date', { ascending: false })
      .limit(1);

    const { data, error } = await (ors ? q.or(ors).maybeSingle() : q.maybeSingle());

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };

    return { ok: true, row: data as MonthlyRow };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
