'use client';

import { supabase } from './supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;           // e.g. "Aries" or "Aries-Taurus Cusp"
  hemisphere: 'Northern' | 'Southern';
  date: string;           // "YYYY-MM-DD"
  daily_horoscope?: string; // Today's Guidance
  affirmation?: string;     // Daily Affirmation
  deeper_insight?: string;  // Daily Astral Plane
  [key: string]: any;
};

// ----- String helpers -----
function toTitleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

/**
 * Normalize a sign label as it appears in UI into a canonical form for DB matching.
 * Rules:
 *  - Replace en/em dashes with hyphen
 *  - Collapse spaces
 *  - Title-case tokens
 *  - Normalize "cusp" to "Cusp"
 *  - Allow both with and without " Cusp" versions
 */
function normalizeSignForDaily(input: string): {
  primaryWithCusp?: string;   // e.g. "Aries-Taurus Cusp"
  primaryNoCusp: string;      // e.g. "Aries-Taurus"
  parts: string[];            // e.g. ["Aries","Taurus"] or ["Taurus"]
} {
  if (!input) {
    return { primaryNoCusp: '', parts: [] };
  }

  let s = input.trim();

  // normalize punctuation/spaces
  s = s.replace(/[–—]/g, '-');       // en/em dash -> hyphen
  s = s.replace(/\s+/g, ' ').trim();

  // detect if there's "cusp" at end (any case)
  let hasCusp = /\bcusp\b$/i.test(s);

  // remove trailing "cusp" for base hyphenated name
  let base = s.replace(/\s*cusp\s*$/i, '').trim();

  // title-case tokens around hyphen
  base = base
    .split('-')
    .map(part =>
      part
        .trim()
        .split(' ')
        .map(toTitleCaseWord)
        .join(' ')
    )
    .join('-');

  // reconstruct "Cusp" version if needed
  const primaryWithCusp = hasCusp ? `${base} Cusp` : undefined;

  // compute parts for fallback
  const parts = base.includes('-')
    ? base.split('-').map(p => p.trim()).filter(Boolean)
    : [base];

  return {
    primaryWithCusp,            // may be undefined for pure sign
    primaryNoCusp: base,        // "Aries-Taurus" or "Aries"
    parts
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

// ----- DB query -----
async function fetchDailyRow(
  date: string,
  sign: string,
  hemi: 'Northern' | 'Southern',
  debug?: boolean
) {
  if (debug) {
    console.log('[daily] Executing query with params:', { 
      table: 'horoscope_cache',
      sign, 
      hemisphere: hemi, 
      date,
      query: `SELECT * FROM horoscope_cache WHERE sign = '${sign}' AND hemisphere = '${hemi}' AND date = '${date}'`
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
      actualData: data ? {
        sign: data.sign,
        hemisphere: data.hemisphere,
        date: data.date,
        hasDaily: !!data.daily_horoscope,
        dailyPreview: data.daily_horoscope?.substring(0, 50) + '...'
      } : null
    });
  }

  if (error) {
    return { row: null as DailyRow | null, error };
  }
  return { row: (data as DailyRow | null), error: null };
}

/**
 * Build sign attempts in preferred order:
 *   1) "Aries-Taurus Cusp"  (if present in input)
 *   2) "Aries–Taurus Cusp"  (en-dash version)
 *   3) "Aries-Taurus"
 *   4) "Aries–Taurus"       (en-dash version)
 *   5) "Aries"
 *   6) "Taurus"
 * For pure sign, it's just ["Taurus"].
 */
function buildSignAttemptsForDaily(inputLabel: string): string[] {
  const n = normalizeSignForDaily(inputLabel);
  const list: string[] = [];

  // Try with "Cusp" suffix first (most specific)
  if (n.primaryWithCusp) list.push(n.primaryWithCusp);
  
  // Try en-dash version with Cusp
  if (n.primaryNoCusp.includes('-')) {
    const enDashWithCusp = n.primaryNoCusp.replace('-', '–') + ' Cusp';
    list.push(enDashWithCusp);
  }
  
  // Try without Cusp suffix
  if (n.primaryNoCusp) list.push(n.primaryNoCusp);
  
  // Try en-dash version without Cusp
  if (n.primaryNoCusp.includes('-')) {
    const enDashNoCusp = n.primaryNoCusp.replace('-', '–');
    list.push(enDashNoCusp);
  }

  // then the individual parts
  for (const p of n.parts) {
    if (p) list.push(p);
  }

  // unique, truthy
  return [...new Set(list)].filter(Boolean);
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
 */
export async function getDailyForecast(
  signIn: string,
  hemisphereIn: HemiAny,
  opts?: { userId?: string; forceDate?: string; useCache?: boolean; debug?: boolean }
): Promise<DailyRow | null> {
  const debug = !!opts?.debug;
  const userId = opts?.userId;
  const hemi = hemiToDB(hemisphereIn);

  // CRITICAL: Use today's date in multiple formats to ensure we find content
  const today = new Date();
  const anchors = opts?.forceDate ? [opts.forceDate] : [
    // Today in various formats
    anchorUTC(today),
    anchorLocal(today),
    // Also try yesterday and tomorrow in case of timezone issues
    anchorUTC(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
    anchorUTC(new Date(today.getTime() + 24 * 60 * 60 * 1000)),
  ];
  const signAttempts = buildSignAttemptsForDaily(signIn);

  if (debug) {
    console.log('[daily] ENHANCED DEBUG - attempts', { 
      originalSign: signIn,
      signAttempts, 
      anchors, 
      hemisphere: hemi,
      todayUTC: anchorUTC(today),
      todayLocal: anchorLocal(today)
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
            dailyPreview: row.daily_horoscope?.substring(0, 100) + '...'
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