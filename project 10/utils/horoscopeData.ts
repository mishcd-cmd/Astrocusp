// utils/horoscopeData.ts
import { supabase } from './supabase';

export type HoroscopeData = {
  date: string;
  sign: string;
  hemisphere: 'Northern' | 'Southern' | 'NH' | 'SH';
  daily?: string;
  affirmation?: string;
  deeper?: string;
  celestialInsight?: string;
};

// ---------- normalization helpers ----------

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/–|—/g, '-')            // all dashes -> hyphen
    .replace(/\s+/g, ' ')            // collapse spaces
    .replace(/\s*-\s*/g, '-')        // tighten hyphen spacing
    .replace(/\s*cusp.*$/i, ' cusp') // normalize any cusp suffix to " cusp"
    .trim();
}

function isCuspLabel(label: string) {
  return /cusp/i.test(label || '');
}

/** Build robust aliases for a requested sign (cusp or pure). */
function buildAliases(inputSign: string): string[] {
  const raw = (inputSign || '').trim();

  // Remove “cusp” word for splitting, but still produce aliases with it
  const base = raw.replace(/\s*cusp.*$/i, '').trim();
  const parts = base.split(/\s*[-–—]\s*/);

  const out = new Set<string>();

  if (parts.length === 2) {
    // CUSP variants
    const a = parts[0]?.trim();
    const b = parts[1]?.trim();

    // with explicit "cusp"
    out.add(norm(`${a}-${b} cusp`));
    out.add(norm(`${a}–${b} cusp`));
    out.add(norm(`${a} ${b} cusp`));

    // without the word “cusp”
    out.add(norm(`${a}-${b}`));
    out.add(norm(`${a}–${b}`));
    out.add(norm(`${a} ${b}`));

    // ultra-defensive
    out.add(norm(`${a} & ${b} cusp`));
  } else {
    // PURE sign
    out.add(norm(raw));                 // exact (case-insensitive)
    out.add(norm(base));                // base without any cusp mention
    out.add(norm(`${base} (pure)`));    // rare editorial suffix
  }

  return Array.from(out);
}

/** Hemisphere variants: accept both long and short forms */
function hemisphereAliases(h: string) {
  const v = (h || '').toLowerCase();
  if (v.startsWith('n')) return ['Northern', 'NH', 'north', 'N'];
  if (v.startsWith('s')) return ['Southern', 'SH', 'south', 'S'];
  // default to both if unknown
  return ['Northern', 'NH', 'Southern', 'SH'];
}

function pickBestRow(rows: any[], requestedSign: string): any | null {
  const aliases = buildAliases(requestedSign);
  const wantCusp = isCuspLabel(requestedSign);

  // Pre-normalize row signs (DB may store ALL CAPS or odd dash spacing)
  const augmented = rows.map(r => ({
    row: r,
    normSign: norm(r.sign || ''),
    isCusp: isCuspLabel(r.sign || ''),
  }));

  // 1) Try exact alias matches
  for (const a of aliases) {
    const hit = augmented.find(x => x.normSign === a);
    if (hit) return hit.row;
  }

  if (wantCusp) {
    // 2) If user requested a cusp:
    // If ANY cusp rows exist for this date+hemisphere set, don't show a pure sign by mistake
    const anyCusps = augmented.some(x => x.isCusp);
    if (anyCusps) return null;

    // 3) Else, gracefully fall back to the *first* part of the cusp
    const first = requestedSign
      .replace(/\s*cusp.*$/i, '')
      .split(/\s*[-–—]\s*/)[0]
      ?.trim();
    if (first) {
      const pureAlias = norm(first);
      const hit = augmented.find(x => x.normSign === pureAlias);
      if (hit) return hit.row;
    }
  }

  // 4) Pure sign requested but no exact match—give up
  return null;
}

function isoDateOnly(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ---------- public API ----------

/**
 * Robust daily fetch that:
 *  - accepts hemisphere as 'Northern' | 'Southern' | 'NH' | 'SH'
 *  - queries both long/short hemisphere forms to match your table
 *  - normalizes ALL CAPS signs and cusp variants
 */
export async function getAccessibleHoroscope(
  date: Date,
  sign: string,
  hemisphereInput: 'Northern' | 'Southern' | 'NH' | 'SH'
): Promise<HoroscopeData | null> {
  const day = isoDateOnly(date);
  const hemiChoices = hemisphereAliases(hemisphereInput); // e.g. ['Northern','NH']

  // Pull all potential matches for this date across the accepted hemisphere variants.
  // (Small result set, then we pick the single best row client-side.)
  const { data, error } = await supabase
    .from('horoscope_cache')
    .select('date, hemisphere, sign, daily_horoscope, affirmation, deeper_insight, celestial_insight')
    .eq('date', day)
    .in('hemisphere', hemiChoices as any); // match both 'Northern' & 'NH' (or Southern/SH)

  if (error) {
    console.error('[daily] Supabase error:', error.message);
    return null;
  }
  if (!data || data.length === 0) {
    // Nothing for that date/hemisphere
    return null;
  }

  // Try to pick the exact cusp/pure row
  const row = pickBestRow(data, sign);
  if (!row) return null;

  return {
    date: row.date,
    sign: row.sign,
    hemisphere: row.hemisphere,
    daily: row.daily_horoscope ?? '',
    affirmation: row.affirmation ?? '',
    deeper: row.deeper_insight ?? '',
    celestialInsight: row.celestial_insight ?? '',
  };
}
