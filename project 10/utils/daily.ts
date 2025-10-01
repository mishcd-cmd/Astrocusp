'use client';

import { supabase } from './supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;             // e.g. "Aries" or "Aries-Taurus Cusp"
  hemisphere: 'Northern' | 'Southern';
  date: string;             // "YYYY-MM-DD"
  daily_horoscope?: string; // Today's Guidance
  affirmation?: string;     // Daily Affirmation
  deeper_insight?: string;  // Daily Astral Plane
  [key: string]: any;
};

// ========== string helpers ==========
const toTitle = (w: string) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '');

function normalizeSignTokens(raw: string) {
  if (!raw) return '';
  // normalize unicode dashes, trim spaces, collapse spaces
  let s = raw.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

  // title-case around hyphen and spaces
  s = s
    .split('-')
    .map((part) =>
      part
        .trim()
        .split(' ')
        .map(toTitle)
        .join(' ')
    )
    .join('-');

  // normalize ending "cusp" -> "Cusp"
  s = s.replace(/\s*cusp\s*$/i, ' Cusp').trim();

  return s;
}

// Hemisphere → DB format
function hemiToDB(hemi?: HemiAny): 'Northern' | 'Southern' {
  const v = (hemi || 'Southern').toString().toLowerCase();
  if (v === 'northern' || v === 'nh') return 'Northern';
  return 'Southern';
}

// ========== date helpers ==========
const pad2 = (n: number) => `${n}`.padStart(2, '0');
const anchorLocal = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const anchorUTC = (d = new Date()) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

function buildDailyAnchors(d = new Date()): string[] {
  // Try UTC and Local, as well as +/- 1 day to dodge tz cutovers
  const todayUTC = anchorUTC(d);
  const todayLocal = anchorLocal(d);
  const yUTC = anchorUTC(new Date(d.getTime() - 24 * 60 * 60 * 1000));
  const tUTC = anchorUTC(new Date(d.getTime() + 24 * 60 * 60 * 1000));

  const list = [todayUTC, todayLocal, yUTC, tUTC];
  return [...new Set(list)];
}

// ========== cache helpers ==========
function cacheKeyDaily(userId: string | undefined, sign: string, hemi: 'Northern' | 'Southern', ymd: string) {
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

// ========== DB query ==========
async function fetchDailyRow(date: string, sign: string, hemi: 'Northern' | 'Southern', debug?: boolean) {
  if (debug) {
    console.log('[daily] Executing query with params:', {
      table: 'horoscope_cache',
      sign,
      hemisphere: hemi,
      date,
      query: `SELECT * FROM horoscope_cache WHERE sign = '${sign}' AND hemisphere = '${hemi}' AND date = '${date}'`,
    });
  }

  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight')
    .eq('sign', sign)
    .eq('hemisphere', hemi)
    .eq('date', date)
    .maybeSingle();

  if (debug) {
    console.log('[daily] Query result:', {
      sign,
      hemisphere: hemi,
      date,
      error: error?.message || null,
      hasData: !!data,
      actualData: data
        ? {
            sign: (data as any).sign,
            hemisphere: (data as any).hemisphere,
            date: (data as any).date,
            hasDaily: !!(data as any).daily_horoscope,
            dailyPreview: (data as any).daily_horoscope?.substring(0, 60) + '...',
          }
        : null,
    });
  }

  if (error) return { row: null as DailyRow | null, error };
  return { row: (data as DailyRow | null), error: null };
}

/**
 * Build sign attempts in strict order.
 * If the input looks like a cusp (contains hyphen or "cusp"), we try ONLY cusp spellings:
 *   1) "Aries-Taurus Cusp"
 *   2) "Aries–Taurus Cusp" (en-dash)
 *   3) "Aries–Taurus" (en-dash, no "Cusp")  ← optional if allowTrueSignFallback is false, this is still a cusp form in DB occasionally
 *   4) "Aries-Taurus" (hyphen, no "Cusp")
 *   (We DO NOT add single-sign fallbacks unless explicitly allowed.)
 *
 * If the input is a pure sign, the attempts are just ["Aries"].
 */
function buildStrictDailyAttempts(inputLabel: string, allowTrueSignFallback: boolean): string[] {
  const normalized = normalizeSignTokens(inputLabel);
  if (!normalized) return [];

  const looksLikeCusp = /cusp$/i.test(normalized) || normalized.includes('-');

  // Split base and detect en-dash pair
  const baseNoCusp = normalized.replace(/\s*Cusp$/i, '').trim(); // e.g. "Aries-Taurus"
  const enDashBase = baseNoCusp.includes('-') ? baseNoCusp.replace('-', '–') : baseNoCusp;

  if (looksLikeCusp) {
    const attempts: string[] = [
      `${baseNoCusp} Cusp`, // "Aries-Taurus Cusp"
      `${enDashBase} Cusp`, // "Aries–Taurus Cusp"
      enDashBase,           // "Aries–Taurus" (some rows may lack "Cusp")
      baseNoCusp,           // "Aries-Taurus"
    ];

    // Only if explicitly allowed, add true-sign fallbacks
    if (allowTrueSignFallback) {
      const parts = baseNoCusp.split('-').map((p) => p.trim()).filter(Boolean);
      attempts.push(...parts);
    }

    return [...new Set(attempts.filter(Boolean))];
  }

  // Pure sign case
  return [baseNoCusp];
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get daily horoscope row for a user, cached by user+sign+hemisphere+date.
 *
 * @param signIn - UI label, e.g. "Aries-Taurus Cusp", "Aries-Taurus", or "Aries"
 * @param hemisphereIn - "NH" | "SH" | "Northern" | "Southern"
 * @param opts
 *  - userId?: scope cache per user (recommended)
 *  - forceDate?: "YYYY-MM-DD"
 *  - useCache?: boolean (default true)
 *  - allowTrueSignFallback?: boolean (default false) ← keep cusp strict by default
 *  - debug?: boolean (logs attempts and results)
 */
export async function getDailyForecast(
  signIn: string,
  hemisphereIn: HemiAny,
  opts?: {
    userId?: string;
    forceDate?: string;
    useCache?: boolean;
    allowTrueSignFallback?: boolean;
    debug?: boolean;
  }
): Promise<DailyRow | null> {
  const debug = !!opts?.debug;
  const allowTrueSignFallback = !!opts?.allowTrueSignFallback; // default false = strict cusp
  const userId = opts?.userId;
  const hemi = hemiToDB(hemisphereIn);

  const anchors = opts?.forceDate ? [opts.forceDate] : buildDailyAnchors(new Date());
  const signAttempts = buildStrictDailyAttempts(signIn, allowTrueSignFallback);

  if (debug) {
    console.log('[daily] ENHANCED DEBUG - attempts', {
      originalSign: signIn,
      signAttempts,
      anchors,
      hemisphere: hemi,
      todayUTC: anchorUTC(new Date()),
      todayLocal: anchorLocal(new Date()),
      allowTrueSignFallback,
    });
  }

  // Try cache first
  if (opts?.useCache !== false) {
    for (const dateStr of anchors) {
      for (const s of signAttempts) {
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        const cached = getFromCache<DailyRow>(key);
        if (cached && cached.date === dateStr && cached.hemisphere === hemi && cached.sign === s) {
          if (debug) console.log('💾 [daily] cache hit', { key, sign: s, hemi, date: dateStr });
          return cached;
        }
      }
    }
  }

  // Query DB in order of date anchors x sign attempts
  for (const dateStr of anchors) {
    for (const s of signAttempts) {
      if (debug) {
        console.log(`[daily] Trying query: sign="${s}", hemisphere="${hemi}", date="${dateStr}"`);
      }
      const { row, error } = await fetchDailyRow(dateStr, s, hemi, debug);
      if (error) continue;
      if (row) {
        if (debug) {
          console.log(`[daily] SUCCESS! Found row for sign="${s}", date="${dateStr}":`, {
            sign: row.sign,
            hemisphere: row.hemisphere,
            date: row.date,
            dailyPreview: row.daily_horoscope?.substring(0, 100) + '...',
          });
        }
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        setInCache(key, row);
        return row;
      }
    }
  }

  if (debug) {
    console.warn('[daily] not found for', { signAttempts, anchors, hemi, allowTrueSignFallback });
  }
  return null;
}

// Optional helpers
export const DailyHelpers = {
  normalizeSignTokens,
  hemiToDB,
  anchorLocal,
  anchorUTC,
  buildDailyAnchors,
  buildStrictDailyAttempts,
  cacheKeyDaily,
};
