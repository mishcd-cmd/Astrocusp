// utils/forecasts.ts
import { supabase } from './supabase';

export type MonthlyRow = {
  id?: number | string;
  date: string;                 // "2025-10-01" (monthly rows share same date for the month)
  sign: string;                 // lowercase; cusp "aries-taurus"
  hemisphere: 'NH' | 'SH';
  monthly_forecast?: string;
};

const toHyphen = (s: string) => (s || '').replace(/[–—]/g, '-');
const stripCuspWordLower = (s: string) => (s || '').replace(/\s*cusp.*$/i, '').trim();

/** Convert any label to the stored monthly "sign" format (lowercase; hyphen for cusps; no "cusp") */
function normaliseMonthlySign(label: string) {
  return stripCuspWordLower(toHyphen(label)).toLowerCase();
}

function resolveMonthlyHemisphere(label: string): 'NH' | 'SH' {
  const s = (label || '').toLowerCase();
  if (s === 'sh' || s.startsWith('s')) return 'SH';
  return 'NH';
}

/** Try exact cusp (e.g. "aries-taurus"), then fallback to primary ("aries") */
export async function getLatestForecast(
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: MonthlyRow; reason?: string }> {
  try {
    const exact = normaliseMonthlySign(signLabel);          // "aries-taurus" or "aries"
    const primary = exact.includes('-') ? exact.split('-')[0] : exact;
    const hemi = resolveMonthlyHemisphere(hemisphereLabel); // "NH" | "SH"

    // 1) Try exact (cusp or pure)
    {
      const { data, error } = await supabase
        .from('monthly_forecasts')
        .select('id,date,sign,hemisphere,monthly_forecast')
        .eq('hemisphere', hemi)
        .eq('sign', exact)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { ok: false, reason: error.message };
      if (data) return { ok: true, row: data as MonthlyRow };
    }

    // 2) Fallback to primary sign only (for cusp users who don’t have a cusp row)
    if (primary && primary !== exact) {
      const { data, error } = await supabase
        .from('monthly_forecasts')
        .select('id,date,sign,hemisphere,monthly_forecast')
        .eq('hemisphere', hemi)
        .eq('sign', primary)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { ok: false, reason: error.message };
      if (data) return { ok: true, row: data as MonthlyRow };
    }

    return { ok: false, reason: 'not_found' };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
