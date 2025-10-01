// utils/daily.ts
'use client';

import { supabase } from '@/utils/supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;
  hemisphere: 'Northern' | 'Southern';
  date: string;
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string;
  __source_table__?: 'horoscope_cache';
  [key: string]: any;
};

// ----- String helpers -----
function toTitleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

function normalizeSignForDaily(input: string): {
  primaryWithCusp?: string;
  primaryNoCusp: string;
  parts: string[];
  isCusp: boolean;
} {
  if (!input) return { primaryNoCusp: '', parts: [], isCusp: false };

  let s = input.trim().replace(/\s+/g, ' ').trim();
  const isCusp = /\bcusp\b/i.test(s);

  const hyphenBase = s.replace(/[–—]/g, '-');
  const noCusp = hyphenBase.replace(/\s*cusp\s*$/i, '').trim();

  const parts = noCusp
    .split('-')
    .map(part =>
      part
        .trim()
        .split(' ')
        .map(toTitleCaseWord)
        .join(' ')
    )
    .filter(Boolean);

  const baseEnDash = parts.join('–');
  const primaryNoCusp = baseEnDash;
  const primaryWithCusp = isCusp ? `${baseEnDash} Cusp` : undefined;

  return { primaryWithCusp, primaryNoCusp, parts, isCusp };
}

function hemiToDB(hemi?: HemiAny): 'Northern' | 'Southern' {
  const v = (hemi || 'Southern').toString().toLowerCase();
  if (v === 'northern' || v === 'nh') return 'Northern';
  return 'Southern';
}

// ----- Date helpers with Sydney timezone support -----
function pad2(n: number) { 
  return `${n}`.padStart(2, '0'); 
}

// Get date in Sydney timezone
function getSydneyDate(d = new Date()): Date {
  const sydneyString = d.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyString);
}

function anchorSydney(d = new Date()): string {
  const sydDate = getSydneyDate(d);
  return `${sydDate.getFullYear()}-${pad2(sydDate.getMonth() + 1)}-${pad2(sydDate.getDate())}`;
}

function anchorLocal(d = new Date()): string { 
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; 
}

function anchorUTC(d = new Date()): string { 
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; 
}

function buildDailyAnchors(d = new Date()): string[] {
  const aSydney = anchorSydney(d);
  const aUTC = anchorUTC(d);
  const aLocal = anchorLocal(d);
  
  // Try Sydney date first (for Australian users), then UTC, then local, then ±1 day for edge cases
  const anchors = [
    aSydney,
    aUTC,
    aLocal,
    anchorSydney(new Date(d.getTime() - 24 * 60 * 60 * 1000)), // yesterday Sydney
    anchorSydney(new Date(d.getTime() + 24 * 60 * 60 * 1000)), // tomorrow Sydney
  ];
  
  // Return unique values only
  return [...new Set(anchors)].filter(Boolean);
}

// ----- Cache helpers -----
function cacheKeyDaily(
  userId: string | undefined,
  sign: string,
  hemi: 'Northern' | 'Southern',
  ymd: string
) {
  return `daily:${userId ?? 'anon'}:${sign}:${hemi}:${ymd}`;
}

function getFromCache<T = unknown>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { 
    return null; 
  }
}

function setInCache(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { 
    /* ignore */ 
  }
}

function buildSignAttemptsForDaily(
  inputLabel: string,
  opts?: { allowTrueSignFallback?: boolean }
): string[] {
  const { primaryWithCusp, primaryNoCusp, parts, isCusp } = normalizeSignForDaily(inputLabel);
  const allowFallback = !!opts?.allowTrueSignFallback;

  const list: string[] = [];
  if (primaryWithCusp) list.push(primaryWithCusp);
  if (primaryWithCusp) list.push(primaryWithCusp.replace('–', '-'));
  if (primaryNoCusp) list.push(primaryNoCusp);
  if (primaryNoCusp) list.push(primaryNoCusp.replace('–', '-'));

  if (!isCusp || allowFallback) {
    for (const p of parts) if (p) list.push(p);
  }
  return [...new Set(list)].filter(Boolean);
}

// ------------------------
// DB fetcher (horoscope_cache)
// ------------------------
async function fetchFromHoroscopeCache(
  date: string,
  sign: string,
  hemi: 'Northern' | 'Southern',
  debug?: boolean
): Promise<{ row: DailyRow | null; error: any }> {
  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight')
    .eq('sign', sign)
    .eq('hemisphere', hemi)
    .eq('date', date)
    .maybeSingle();

  if (debug) {
    console.log('[daily] (horoscope_cache) result:', {
      sign, 
      hemisphere: hemi, 
      date,
      error: error?.message || null,
      hasData: !!data,
      preview: data?.daily_horoscope?.substring?.(0, 60) + '…'
    });
  }

  if (error) return { row: null, error };
  if (!data) return { row: null, error: null };

  const row: DailyRow = {
    sign: data.sign,
    hemisphere: data.hemisphere,
    date: data.date,
    daily_horoscope: data.daily_horoscope || '',
    affirmation: data.affirmation || '',
    deeper_insight: data.deeper_insight || '',
    __source_table__: 'horoscope_cache',
  };
  return { row, error: null };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function getDailyForecast(
  signIn: string,
  hemisphereIn: HemiAny,
  opts?: {
    userId?: string;
    forceDate?: string;
    useCache?: boolean;
    debug?: boolean;
    allowTrueSignFallback?: boolean;
  }
): Promise<DailyRow | null> {
  const debug = !!opts?.debug;
  const userId = opts?.userId;
  const hemi = hemiToDB(hemisphereIn);

  const today = new Date();
  const anchors = opts?.forceDate
    ? [opts.forceDate]
    : buildDailyAnchors(today);

  const signAttempts = buildSignAttemptsForDaily(signIn, {
    allowTrueSignFallback: !!opts?.allowTrueSignFallback,
  });

  if (debug) {
    console.log('[daily] attempts', {
      originalSign: signIn, 
      signAttempts, 
      anchors, 
      hemisphere: hemi,
      todaySydney: anchorSydney(today),
      todayUTC: anchorUTC(today), 
      todayLocal: anchorLocal(today),
    });
  }

  // Cache first
  if (opts?.useCache !== false) {
    for (const dateStr of anchors) {
      for (const s of signAttempts) {
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        const cached = getFromCache<DailyRow>(key);
        if (cached && cached.date === dateStr && cached.hemisphere === hemi && cached.sign === s) {
          if (debug) console.log('💾 [daily] cache hit', { 
            key, 
            sign: s, 
            hemi, 
            date: dateStr, 
            source: cached.__source_table__ 
          });
          return cached;
        }
      }
    }
  }

  // DB tries (horoscope_cache only)
  for (const dateStr of anchors) {
    for (const s of signAttempts) {
      if (debug) console.log(`[daily] Trying query: sign="${s}", hemisphere="${hemi}", date="${dateStr}"`);
      const { row, error } = await fetchFromHoroscopeCache(dateStr, s, hemi, debug);
      if (error) continue;
      if (row) {
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        setInCache(key, row);
        if (debug) {
          console.log(`[daily] FOUND row`, {
            sign: row.sign, 
            hemisphere: row.hemisphere, 
            date: row.date,
            hasDaily: !!row.daily_horoscope, 
            hasAff: !!row.affirmation, 
            hasDeep: !!row.deeper_insight,
          });
        }
        return row;
      }
    }
  }

  if (debug) console.warn('[daily] not found for', { signAttempts, anchors, hemi });
  return null;
}

export async function getAccessibleHoroscope(user: any, opts?: {
  forceDate?: string;
  useCache?: boolean;
  debug?: boolean;
}) {
  const debug = !!opts?.debug;

  const hemisphere: HemiAny =
    user?.hemisphere === 'NH' || user?.hemisphere === 'SH'
      ? user.hemisphere
      : (user?.hemisphere as 'Northern' | 'Southern') || 'Southern';

  const signLabel =
    user?.cuspResult?.cuspName ||
    user?.cuspResult?.primarySign ||
    user?.preferred_sign ||
    '';

  const isCuspInput = /\bcusp\b/i.test(signLabel);

  const row = await getDailyForecast(signLabel, hemisphere, {
    userId: user?.id || user?.email,
    forceDate: opts?.forceDate,
    useCache: opts?.useCache,
    debug,
    allowTrueSignFallback: !isCuspInput ? true : false,
  });

  if (!row) return null;

  return {
    date: row.date,
    sign: row.sign,
    hemisphere: row.hemisphere,
    daily: row.daily_horoscope || '',
    affirmation: row.affirmation || '',
    deeper: row.deeper_insight || '',
    raw: row,
  };
}

export const DailyHelpers = {
  normalizeSignForDaily,
  hemiToDB,
  anchorLocal,
  anchorUTC,
  anchorSydney,
  buildDailyAnchors,
  buildSignAttemptsForDaily,
  cacheKeyDaily,
};