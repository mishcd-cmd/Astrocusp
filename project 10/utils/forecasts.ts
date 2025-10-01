// utils/forecasts.ts
import { supabase } from './supabase';

export type ForecastRow = {
  id?: number | string;
  date: string;                 // e.g. 2025-10-01
  sign: string;                 // stored lowercase in monthly_forecasts
  hemisphere: string;           // 'northern' | 'southern'
  monthly_forecast?: string;
};

function normaliseMonthlySign(label: string) {
  // Keep en dash for cusps, strip trailing "cusp", lowercase
  const trimmed = (label || '').trim();
  const noCuspWord = trimmed.replace(/\s*cusp.*$/i, '');
  const withEnDash = noCuspWord.replace(/\s*-\s*/g, '–');
  return withEnDash.toLowerCase();
}

function normaliseMonthlyHemisphere(h: string) {
  const s = (h || '').toLowerCase();
  return s.startsWith('s') ? 'southern' : 'northern';
}

/**
 * Fetch latest monthly forecast for a (cusp or pure) sign + hemisphere.
 */
export async function getLatestForecast(
  signLabel: string,
  hemisphereLabel: string
): Promise<{ ok: boolean; row?: ForecastRow; reason?: string }> {
  try {
    const hemi = normaliseMonthlyHemisphere(hemisphereLabel);
    const exactSign = normaliseMonthlySign(signLabel);

    // Try exact (cusp or pure)
    let { data, error } = await supabase
      .from<ForecastRow>('monthly_forecasts') // ✅ no "public." prefix
      .select('id,date,sign,hemisphere,monthly_forecast')
      .eq('hemisphere', hemi)
      .eq('sign', exactSign)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If not found and it’s a cusp, fall back to the first sign (e.g. 'aries–taurus' → 'aries')
    if (!data && !error && exactSign.includes('–')) {
      const primary = exactSign.split('–')[0];
      const fb = await supabase
        .from<ForecastRow>('monthly_forecasts')
        .select('id,date,sign,hemisphere,monthly_forecast')
        .eq('hemisphere', hemi)
        .eq('sign', primary)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      data = fb.data as any;
      error = fb.error as any;
    }

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: 'not_found' };
    return { ok: true, row: data };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}
