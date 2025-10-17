// utils/daily.ts
'use client';

import { supabase } from '@/utils/supabase';

// ----- Types -----
export type HemiShort = 'NH' | 'SH';
export type HemiAny = HemiShort | 'Northern' | 'Southern';

export type DailyRow = {
  sign: string;
  hemisphere: 'Northern' | 'Southern';
  date: string;               // ideally "YYYY-MM-DD" or ISO if timestamp
  daily_horoscope?: string;
  affirmation?: string;
  deeper_insight?: string;
  __source_table__?: 'horoscope_cache';
  [key: string]: any;
};

// ============================================================================
// String helpers
// ============================================================================
function toTitleCaseWord(w: string) {
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '';
}

/** Normalize a sign label for DAILY matching (prefer en–dash forms). */
function normalizeSignForDaily(input: string): {
  primaryWithCusp?: string;   // "Aries–Taurus Cusp"
  primaryNoCusp: string;      // "Aries–Taurus" or "Aries"
  parts: string[];
  isCusp: boolean;
} {
  if (!input) return { primaryNoCusp: '', parts: [], isCusp: false };

  let s = input.trim().replace(/\s+/g, ' ').trim();
  const isCusp = /\bcusp\b/i.test(s);

  const hyphenBase = s.replace(/[–—]/g, '-'); // normalize to hyphen
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

/** Compare DB sign vs an attempt, tolerant to hyphen vs en-dash and "Cusp" suffix. */
function rowMatchesSign(dbSign: string, attempt: string) {
  if (!dbSign || !attempt) return false;
  const norm = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[—–]/g, '-')         // normalize dashes to hyphen
      .replace(/\s*cusp\s*$/i, '')   // strip "Cusp"
      .toLowerCase();

  return norm(dbSign) === norm(attempt);
}

// ============================================================================
// Hemisphere helpers
// ============================================================================
function buildHemisphereVariants(hemi: 'Northern' | 'Southern'): string[] {
  return Array.from(new Set([
    hemi,                        // "Southern"
    hemi.toUpperCase(),          // "SOUTHERN"
    hemi.toLowerCase(),          // "southern"
    hemi === 'Southern' ? 'SH' : 'NH'
  ]));
}

// Hemisphere normalisation to match DB ("Northern"/"Southern")
function hemiToDB(hemi?: HemiAny): 'Northern' | 'Southern' {
  const v = (hemi || 'Southern').toString().toLowerCase();
  if (v === 'northern' || v === 'nh') return 'Northern';
  return 'Southern';
}

// ============================================================================
// Date helpers (timezone-safe, no string parsing!)
// ============================================================================
function pad2(n: number) {
  return `${n}`.padStart(2, '0');
}

/**
 * Return YYYY-MM-DD for a given Date in the given IANA time zone.
 * We DO NOT parse locale strings (which causes MM/DD vs DD/MM confusion).
 */
function ymdInTZ(d: Date, timeZone: string): string {
  const y = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(d);
  const m = new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit' }).format(d);
  const day = new Intl.DateTimeFormat('en-US', { timeZone, day: '2-digit' }).format(d);
  return `${y}-${m}-${day}`;
}

/** User time zone (falls back to UTC if unknown) */
function getUserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

// Legacy helpers (still used in logs/fallbacks)
function anchorLocal(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function anchorUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/**
 * Build date anchors prioritizing the USER'S LOCAL DAY in their time zone,
 * then UTC, plus ±1-day in the user TZ to cover midnight edges.
 */
function buildDailyAnchors(d = new Date()): string[] {
  const userTZ = getUserTimeZone();

  const todayUser = ymdInTZ(d, userTZ);
  const yesterdayUser = ymdInTZ(new Date(d.getTime() - 24 * 60 * 60 * 1000), userTZ);
  const tomorrowUser = ymdInTZ(new Date(d.getTime() + 24 * 60 * 60 * 1000), userTZ);

  const todayUTC = anchorUTC(d);
  const todayLocal = anchorLocal(d); // device clock (rarely needed, but harmless)

  const anchors = [
    todayUser,
    todayUTC,
    todayLocal,
    yesterdayUser,
    tomorrowUser,
  ];

  return [...new Set(anchors)].filter(Boolean);
}

// ============================================================================
// Cache helpers
// ============================================================================
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

/** Build sign attempts in strict cusp-first order (no true-sign fallback for cusp unless enabled). */
function buildSignAttemptsForDaily(
  inputLabel: string,
  opts?: { allowTrueSignFallback?: boolean }
): string[] {
  const { primaryWithCusp, primaryNoCusp, parts, isCusp } = normalizeSignForDaily(inputLabel);
  const allowFallback = !!opts?.allowTrueSignFallback;

  const list: string[] = [];
  if (primaryWithCusp) list.push(primaryWithCusp);                    // en–dash + "Cusp"
  if (primaryWithCusp) list.push(primaryWithCusp.replace(/–/g, '-')); // hyphen + "Cusp"
  if (primaryNoCusp) list.push(primaryNoCusp);                         // en–dash no cusp
  if (primaryNoCusp) list.push(primaryNoCusp.replace(/–/g, '-'));     // hyphen no cusp

  if (!isCusp || allowFallback) {
    for (const p of parts) if (p) list.push(p);                       // fallback to each sign if allowed
  }
  return [...new Set(list)].filter(Boolean);
}

// ============================================================================
// DB fetchers (tolerant to hemisphere + timestamp dates)
// ============================================================================

/**
 * Fetch all rows for a given date+hemisphere, tolerant to:
 *  - hemisphere variants: "Southern"/"southern"/"SOUTHERN"/"SH"
 *  - DATE vs TIMESTAMP: queries by [date, date+1) UTC range
 */
async function fetchRowsForDate(
  date: string,
  hemi: 'Northern' | 'Southern',
  debug?: boolean
): Promise<{ rows: DailyRow[]; error: any }> {
  const hemiVariants = buildHemisphereVariants(hemi);

  // Date range [date, date+1) in UTC to cover DATE and TIMESTAMP columns
  const start = `${date}T00:00:00.000Z`;
  const end = new Date(`${date}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const endIso = end.toISOString();

  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight')
    .in('hemisphere', hemiVariants as any)
    .gte('date', start)
    .lt('date', endIso);

  if (debug) {
    console.log('[daily] (horoscope_cache:list tolerant)', {
      date, start, end: endIso, hemi, hemiVariants,
      error: error?.message || null,
      count: Array.isArray(data) ? data.length : 0,
    });
  }

  if (error) return { rows: [], error };

  const rows: DailyRow[] = (data || []).map(r => ({
    sign: r.sign,
    hemisphere: r.hemisphere,
    date: r.date,
    daily_horoscope: r.daily_horoscope || '',
    affirmation: r.affirmation || '',
    deeper_insight: r.deeper_insight || '',
    __source_table__: 'horoscope_cache',
  }));

  // If still nothing, do a quick visibility probe (no date filter) to help debugging
  if (!rows.length && debug) {
    const probe = await supabase
      .from('horoscope_cache')
      .select('sign, hemisphere, date')
      .in('hemisphere', hemiVariants as any)
      .limit(3);
    console.log('[daily] probe any-date rows for hemisphere', {
      hemiVariants,
      error: probe.error?.message || null,
      sample: probe.data || [],
    });
  }

  return { rows, error: null };
}

/** Latest-row fallback for sign+hemisphere in case no anchors matched (RLS/date mismatch/etc.). */
async function fetchLatestForSignAndHemi(
  signAttempts: string[],
  hemi: 'Northern' | 'Southern',
  debug?: boolean
): Promise<DailyRow | null> {
  const hemiVariants = buildHemisphereVariants(hemi);

  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('sign, hemisphere, date, daily_horoscope, affirmation, deeper_insight')
    .in('hemisphere', hemiVariants as any)
    .order('date', { ascending: false })
    .limit(200);

  if (debug) {
    console.log('[daily] latest fallback fetch', {
      hemiVariants,
      error: error?.message || null,
      count: Array.isArray(data) ? data.length : 0,
    });
  }
  if (error || !data?.length) return null;

  for (const cand of signAttempts) {
    const match = data.find(r => rowMatchesSign(r.sign, cand));
    if (match) {
      if (debug) {
        console.log('[daily] ✅ latest fallback match', {
          wanted: cand, matchedRowSign: match.sign, date: match.date,
          hasDaily: !!match.daily_horoscope, hasAff: !!match.affirmation, hasDeep: !!match.deeper_insight,
        });
      }
      return {
        sign: match.sign,
        hemisphere: match.hemisphere,
        date: match.date,
        daily_horoscope: match.daily_horoscope || '',
        affirmation: match.affirmation || '',
        deeper_insight: match.deeper_insight || '',
        __source_table__: 'horoscope_cache',
      };
    }
  }
  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function getDailyForecast(
  signIn: string,
  hemisphereIn: HemiAny,
  opts?: {
    userId?: string;
    forceDate?: string;        // if provided, overrides anchors entirely
    useCache?: boolean;
    debug?: boolean;
    allowTrueSignFallback?: boolean;
  }
): Promise<DailyRow | null> {
  const debug = !!opts?.debug;
  const userId = opts?.userId;
  const hemi = hemiToDB(hemisphereIn);

  const today = new Date();
  const anchors = opts?.forceDate ? [opts?.forceDate] : buildDailyAnchors(today);

  const signAttempts = buildSignAttemptsForDaily(signIn, {
    allowTrueSignFallback: !!opts?.allowTrueSignFallback,
  });

  if (debug) {
    console.log('[daily] attempts', {
      originalSign: signIn,
      signAttempts,
      anchors,
      hemisphere: hemi,
      todayUserTZ: getUserTimeZone(),
      todayUTC: anchorUTC(today),
      todayLocal: anchorLocal(today),
    });
  }

  // Cache-first pass
  if (opts?.useCache !== false) {
    for (const dateStr of anchors) {
      for (const s of signAttempts) {
        const key = cacheKeyDaily(userId, s, hemi, dateStr);
        const cached = getFromCache<DailyRow>(key);
        if (cached && cached.date && cached.hemisphere && cached.sign) {
          if (debug) console.log('💾 [daily] cache hit', {
            key, sign: s, hemi, date: dateStr, source: cached.__source_table__
          });
          return cached;
        }
      }
    }
  }

  // DB: list-by-date+hemi (tolerant) then match sign in-app
  for (const dateStr of anchors) {
    if (debug) console.log('[daily] Fetching list for date="%s", hemisphere="%s"', dateStr, hemi);
    const { rows, error } = await fetchRowsForDate(dateStr, hemi, debug);
    if (error) continue;
    if (!rows.length) {
      if (debug) console.log('[daily] no rows for that date+hemi, trying next anchor');
      continue;
    }

    // Try to match our sign attempts against the list
    for (const cand of signAttempts) {
      const hit = rows.find(r => rowMatchesSign(r.sign, cand));
      if (hit) {
        const clean: DailyRow = {
          sign: hit.sign,
          hemisphere: hit.hemisphere,
          date: hit.date,
          daily_horoscope: hit.daily_horoscope || '',
          affirmation: hit.affirmation || '',
          deeper_insight: hit.deeper_insight || '',
          __source_table__: 'horoscope_cache',
        };
        // cache per specific attempt
        const key = cacheKeyDaily(userId, cand, hemi, dateStr);
        setInCache(key, clean);
        if (debug) {
          console.log('[daily] FOUND row via list+match', {
            sign: clean.sign, hemisphere: clean.hemisphere, date: clean.date,
            hasDaily: !!clean.daily_horoscope, hasAff: !!clean.affirmation, hasDeep: !!clean.deeper_insight,
          });
        }
        return clean;
      }
    }

    if (debug) {
      console.log('[daily] had rows for date+hemi but none matched sign attempts', {
        signAttempts,
        exampleRows: rows.slice(0, 3).map(r => r.sign),
      });
    }
  }

  // ---- FINAL SAFETY NET: latest known row for this sign+hemi ----
  if (debug) console.warn('[daily] not found for anchors; trying latest fallback…');
  const latest = await fetchLatestForSignAndHemi(signAttempts, hemi, debug);
  if (latest) return latest;

  if (debug) console.warn('[daily] not found for', { signAttempts, anchors, hemi });
  return null;
}

/** Convenience wrapper for screens */
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
  ymdInTZ,
  buildDailyAnchors,
  buildSignAttemptsForDaily,
  cacheKeyDaily,
};
