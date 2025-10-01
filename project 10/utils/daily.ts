// utils/daily.ts
'use client';

import { supabase } from '@/utils/supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;               // e.g. "Aries" or "Aries-Taurus Cusp"
  hemisphere: 'Northern' | 'Southern';
  date: string;               // "YYYY-MM-DD"
  daily_horoscope?: string;   // Today's Guidance
  affirmation?: string;       // Daily Affirmation
  deeper_insight?: string;    // Daily Astral Plane
  [key: string]: any;
};

// ----- String helpers -----
function toTitleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

/**
 * Normalize a sign label for DAILY matching.
 * - Replaces en/em dash with hyphen
 * - Title-cases tokens
 * - Preserves/normalizes "Cusp"
 */
function normalizeSignForDaily(input: string): {
  primaryWithCusp?: string;   // "Aries-Taurus Cusp"
  primaryNoCusp: string;      // "Aries-Taurus" or "Aries"
  parts: string[];            // ["Aries","Taurus"] or ["Taurus"]
  isCusp: boolean;
} {
  if (!input) {
    return { primaryNoCusp: '', parts: [], isCusp: false };
  }

  let s = input.trim();
  s = s.replace(/[–—]/g, '-');     // en/em dashes → hyphen
  s = s.replace(/\s+/g, ' ').trim();

  const isCusp = /\bcusp\b/i.test(s);
  const base = s
    .replace(/\s*cusp\s*$/i, '')
    .trim()
    .split('-')
    .map(part =>
      part
        .trim()
        .split(' ')
        .map(toTitleCaseWord)
        .join(' ')
    )
    .join('-');

  const parts = base.includes('-')
    ? base.split('-').map(p => p.trim()).filter(Boolean)
    : [base];

  const primaryWithCusp = isCusp ? `${base} Cusp` : undefined;

  return {
    primaryWithCusp,
    primaryNoCusp: base,
    parts,
    isCusp,
  };
}

// Hemisphere normalisation to match DB ("Northern"/"Southern")
function hemiToDB(hemi?: HemiAny): 'Northern' | 'Southern' {
  const v = (hemi || 'Southern').toString().toLowerCase();
  if (v === 'northern' || v === 'nh') return 'Northern';
  return 'Southern';
}

// ----- Date helpers (UTC + Local anchors) -----
function pad2(n: number) {
  return `${n}`.padStart(2, '0');
}
function anchorLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function anchorUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
function buildDailyAnchors(d = new Date()): string[] {
  const aUTC = anchorUTC(d);
  const aLocal = anchorLocal(d);
  return aUTC === aLocal ? [aUTC] : [aUTC, aLocal];
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

/**
 * Build sign attempts in **strict cusp-first** order.
 * For cusp inputs, we DO NOT fall back to true signs by default.
 *   1) "Aries-Taurus Cusp"
 *   2) "Aries–Taurus Cusp" (en-dash)
 *   3) "Aries-Taurus"
 *   4) "Aries–Taurus"
 * (and stop here for cusp unless allowTrueSignFallback = true)
 * For pure signs, it's just ["Taurus"].
 */
function buildSignAttemptsForDaily(
  inputLabel: string,
  opts?: { allowTrueSignFallback?: boolean }
): string[] {
  const { primaryWithCusp, primaryNoCusp, parts, isCusp } = normalizeSignForDaily(inputLabel);
  const allowFallback = !!opts?.allowTrueSignFallback;

  const list: string[] = [];

  if (primaryWithCusp) list.push(primaryWithCusp);
  if (primaryNoCusp.includes('-')) {
    // en-dash with Cusp
    const enDashWithCusp = `${primaryNoCusp.replace('-', '–')} Cusp`;
    list.push(enDashWithCusp);
  }

  // Without "Cusp" suffix (some content may be stored without it)
  if (primaryNoCusp) list.push(primaryNoCusp);
  if (primaryNoCusp.includes('-')) {
    const enDashNoCusp = primaryNoCusp.replace('-', '–');
    list.push(enDashNoCusp);
  }

  // Only if we explicitly allow it, append the individual signs
  if (!isCusp || allowFallback) {
    for (const p of parts) {
      if (p) list.push(p);
    }
  }

  // unique, truthy
  return [...new Set(list)].filter(Boolean);
}

// ----- DB query (uses your table: astrology_cache) -----
async function fetchDailyRow(
  date: string,
  sign: string,
  hemi: 'Northern' | 'Southern',
  debug?: boolean
) {
  if (debug) {
    console.log('[daily] Executing query with params:', {
      table: 'astrology_cache',
      sign,
      hemisphere: hemi,
      date,
      query: `SELECT sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight
              FROM astrology_cache
              WHERE sign='${sign}' AND hemisphere='${hemi}' AND date='${date}'`
    });
  }

  const { data, error } = await supabase
    .from('astrology_cache')
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
            sign: data.sign,
            hemisphere: data.hemisphere,
            date: data.date,
            hasDaily: !!data.daily_horoscope,
            hasAff: !!data.affirmation,
            hasDeep: !!data.deeper_insight,
            dailyPreview: data.daily_horoscope?.substring(0, 60) + '…'
          }
        : null
    });
  }

  if (error) {
    return { row: null as DailyRow | null, error };
  }
  return { row: (data as DailyRow | null), error: null };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get daily horoscope row for a user, cached by user+sign+hemisphere+date.
 *
 * @param signIn - UI label, e.g. "Aries-Taurus Cusp", "Aries-Taurus", or "Taurus"
 * @param hemisphereIn - "NH" | "SH" | "Northern" | "Southern"
 * @param opts
 *  - userId?: scope cache per user (recommended)
 *  - forceDate?: "YYYY-MM-DD"
 *  - useCache?: boolean (default true)
 *  - debug?: boolean (logs attempts and results)
 *  - allowTrueSignFallback?: boolean (default false for cusp inputs)
 */
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

  // Try today (UTC + local) and ±1 day to cover timezone edges
  const today = new Date();
  const anchors = opts?.forceDate
    ? [opts.forceDate]
    : [
        anchorUTC(today),
        anchorLocal(today),
        anchorUTC(new Date(today.getTime() - 24 * 60 * 60 * 1000)), // yesterday UTC
        anchorUTC(new Date(today.getTime() + 24 * 60 * 60 * 1000)), // tomorrow UTC
      ];

  // IMPORTANT: for cusp, default to no fallback to true signs
  const signAttempts = buildSignAttemptsForDaily(signIn, {
    allowTrueSignFallback: !!opts?.allowTrueSignFallback,
  });

  if (debug) {
    console.log('[daily] attempts', {
      originalSign: signIn,
      signAttempts,
      anchors,
      hemisphere: hemi,
      todayUTC: anchorUTC(today),
      todayLocal: anchorLocal(today),
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
          console.log(`[daily] FOUND row for sign="${s}", date="${dateStr}":`, {
            sign: row.sign,
            hemisphere: row.hemisphere,
            date: row.date,
            daily: !!row.daily_horoscope,
            affirmation: !!row.affirmation,
            deeper: !!row.deeper_insight,
          });
        }
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        setInCache(key, row);
        return row;
      }
    }
  }

  if (debug) {
    console.warn('[daily] not found for', { signAttempts, anchors, hemi });
  }
  return null;
}

/**
 * Convenience wrapper your screens can call.
 * Resolves sign and hemisphere from a user object, and returns a ready payload.
 */
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

  // Resolve the most specific sign label from user data for DAILY
  // Prefer explicit cusp label if present
  const signLabel =
    user?.cuspResult?.cuspName || // e.g. "Aries–Taurus Cusp"
    user?.cuspResult?.primarySign || // fallback
    user?.preferred_sign ||
    '';

  // For cusp inputs we do not fall back to true sign by default
  const isCuspInput = /\bcusp\b/i.test(signLabel);

  const row = await getDailyForecast(signLabel, hemisphere, {
    userId: user?.id || user?.email,
    forceDate: opts?.forceDate,
    useCache: opts?.useCache,
    debug,
    allowTrueSignFallback: !isCuspInput ? true : false, // cusp → no fallback; pure sign → fine
  });

  if (!row) {
    return null;
  }

  // Build payload that your UI expects (names seen in your logs)
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

// Optional helpers if you need them elsewhere
export const DailyHelpers = {
  normalizeSignForDaily,
  hemiToDB,
  anchorLocal,
  anchorUTC,
  buildDailyAnchors,
  buildSignAttemptsForDaily,
  cacheKeyDaily,
};
