// utils/forecasts.ts
import { supabase } from './supabase';

export type ForecastRow = {
  id?: string;
  date: string;               // ISO date for the month, e.g. "2025-10-01"
  sign: string;               // stored lowercase in DB (e.g. "aries-taurus cusp" or "aries")
  hemisphere: string;         // "Northern" | "Southern"  (or "NH"/"SH" if that's your schema—adjust below)
  monthly_forecast: string;   // <-- IMPORTANT: the text column your UI reads
  created_at?: string;
  updated_at?: string;
};

/**
 * Normalizes a human label to the sign format used in your monthly table
 * - lowercases
 * - trims " cusp" suffix punctuation variants
 */
function normalizeMonthlySign(label: string) {
  const s = (label || '').toLowerCase().trim();
  // Keep full cusp names, just normalize dashes to "–" or vice versa consistently if needed
  return s
    .replace(/\s*-\s*/g, '–')      // unify hyphen to en-dash
    .replace(/\s+cusp$/, ' cusp'); // normalize trailing spacing
}

/**
 * If your monthly table stores "NH"/"SH" instead of full words, flip this flag
 */
const MONTHLY_HEMI_IS_FULL_WORDS = true; // set false if your schema is "NH"/"SH"

function normalizeMonthlyHemisphere(h: string) {
  if (MONTHLY_HEMI_IS_FULL_WORDS) return h; // "Northern"/"Southern"
  return /^n/i.test(h) ? 'NH' : 'SH';
}

export async function getLatestForecast(signLabel: string, hemisphereLabel: string) {
  const sign = normalizeMonthlySign(signLabel);
  const hemisphere = normalizeMonthlyHemisphere(hemisphereLabel);

  const { data, error } = await supabase
    .from('monthly_forecasts')
    .select('id,date,sign,hemisphere,monthly_forecast,created_at,updated_at')
    .eq('sign', sign)
    .eq('hemisphere', hemisphere)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle<ForecastRow>();

  if (error) {
    return { ok: false as const, row: null, reason: error.message };
  }
  if (!data) {
    return { ok: false as const, row: null, reason: 'not_found' };
  }
  return { ok: true as const, row: data, reason: null };
}
