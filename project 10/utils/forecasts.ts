// utils/forecasts.ts
import { supabase } from './supabase';

export type MonthlyRow = {
  id?: number | string;
  date: string;                 // "2025-10-01" (same for the whole month)
  sign: string;                 // lowercase; cusp "aries-taurus"
  hemisphere: 'NH' | 'SH';
  monthly_forecast?: string;
};

// — helpers —
function toHyphen(s: string) {
  // en dash/em dash/strange dashes -> hyphen
  return (s || '').replace(/[–—]/g, '-');
}
function stripCuspWordLower(s: string) {
  // remove trailing "cusp..." in any case; monthly table does NOT store it
  return (s || '').replace(/\s*cusp.*$/i, '').trim();
}
function normaliseMonthlySign(label: string) {
  // monthly table keeps lowercase; cusps use hyphen (not en dash) and no "cusp" word
  return stripCuspWordLower(toHyphen(label)).toLowerCase();
}
function resolveMonthlyHemisphere(label: string): 'NH' | 'SH' {
  const s = (label || '').toLowerCase();
  if (s.startsWith('s')) return 'SH';
  if (s === 'sh') return 'SH';
  return 'NH';
}

/**
 * Get latest monthly forecast for the user’s sign (cusp-aware) and hemisphere (NH/SH).
 * Tries exact cusp slug first; then falls back to primary sign.
 */
export async function getLatestForecast(
  signLabel: string,       // e.g. "Aries–Taurus Cusp" OR "Aries"
  hemisphereLabel: string  // "Northern"/"Southern"/"NH"/"SH"
): Promise<{ ok: boolean; row?: MonthlyRow; reason?: string }> {
  try {
    const exact = normaliseMonthlySign(signLabel);          // "aries-taurus" or "aries"
    const primary = exact.includes('-') ? exact.split('-')[0] : exact;
    const hemi = resolveMonthlyHemisphere(hemisphereLabel); // "NH" | "SH"

    // Try cusp+primary together using IN filters (robust to URL encoding)
    const { data, error } = await supabase
      .from('monthly_forecasts')
      .select('id,date,sign,hemisphere,monthly_forecast')
      .eq('hemisphere', hemi)
      .in('sign', Array.from(new Set([exact, primary])))
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };

    return { ok: true, row: data as MonthlyRow };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
