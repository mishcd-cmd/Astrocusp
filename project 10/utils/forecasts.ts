// utils/forecasts.ts
import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';

// Fallback for web environment (Stackblitz sometimes strips Platform)
if (typeof Platform === 'undefined') {
  // shim for web bundlers (avoid TS directive to fix linter error)
  (global as any).Platform = { OS: 'web' };
}

import {
  normalizeSignForDatabase,
  normalizeHemisphereLabel,
} from '@/utils/signs';

export interface ForecastRow {
  sign: string;
  hemisphere: string;        // "NH"/"SH" in DB (we keep string here)
  date: string;              // "YYYY-MM-01"
  monthly_forecast: string;  // DB column
  // Optional alias if any legacy code expects ".forecast"
  forecast?: string;
}

export interface Forecast {
  sign: string;
  hemisphere: 'Northern' | 'Southern';
  forecast_date: string;
  forecast_month: string;
  forecast: string;
}

// ------------------------------------------------------------------------------------
// AsyncStorage (no dynamic imports)
// ------------------------------------------------------------------------------------
type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiRemove(keys: string[]): Promise<void>;
};

// Avoid dynamic `import()` so TS doesn't require different module setting
let RNAsyncStorage: AsyncStorageLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-async-storage/async-storage');
  RNAsyncStorage = mod?.default ?? mod;
} catch {
  RNAsyncStorage = null;
}

// ------------------------------------------------------------------------------------
// Race condition protection for network requests
// ------------------------------------------------------------------------------------
let requestId = 0;

// ------------------------------------------------------------------------------------
// Storage helpers (web + native)
// ------------------------------------------------------------------------------------
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' || !RNAsyncStorage) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {}
      return null;
    }
    return RNAsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' || !RNAsyncStorage) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }
    return RNAsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web' || !RNAsyncStorage) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }
    return RNAsyncStorage.removeItem(key);
  },
  async getAllKeys(): Promise<string[]> {
    if (Platform.OS === 'web' || !RNAsyncStorage) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Object.keys(window.localStorage);
        }
      } catch {}
      return [];
    }
    return RNAsyncStorage.getAllKeys();
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web' || !RNAsyncStorage) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(k => window.localStorage.removeItem(k));
        }
      } catch {}
      return;
    }
    return RNAsyncStorage.multiRemove(keys);
  }
};

// ------------------------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------------------------
function parseAsDate(d: string | undefined): number {
  if (!d) return 0;
  const t = Date.parse(d);
  return Number.isNaN(t) ? 0 : t;
}

function getMonthlyForecastCacheKey(sign: string, hemisphere: string, month: string): string {
  const hemiCode = hemisphere === 'Northern' ? 'NH' : hemisphere === 'Southern' ? 'SH' : hemisphere;
  return `monthly_${sign}__${hemiCode}__${month}`;
}

async function clearOldMonthlyCacheKeys() {
  try {
    const keys = await storage.getAllKeys();
    const badKeys = keys.filter(key =>
      key.startsWith('monthly_SH_') ||
      key.startsWith('monthly_NH_') ||
      (key.startsWith('monthly_') && !key.includes('__'))
    );
    if (badKeys.length > 0) {
      await storage.multiRemove(badKeys);
      console.log('🧹 [monthly] Cleared old cache keys:', badKeys.length);
    }
  } catch (error) {
    console.warn('⚠️ [monthly] Failed to clear old cache keys:', error);
  }
}

// Build sign attempts for monthly forecasts
function buildMonthlySignAttempts(input: string): string[] {
  const trimmed = (input || '').trim();

  if (trimmed.toLowerCase().includes('cusp')) {
    const baseName = trimmed.replace(/\s*cusp\s*$/i, '').trim();
    const parts = baseName.split(/[–-]/).map(p => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      const sign1 = parts[0];
      const sign2 = parts[1];

      // Ensure mutable array type (avoid readonly inference)
      return Array.from(
        new Set(
          [
            // DB cusp format first (lowercase with hyphen)
            `${sign1.toLowerCase()}-${sign2.toLowerCase()}`,
            trimmed,
            `${sign1}–${sign2}`,
            `${sign1}-${sign2}`,
            baseName,
            // Try with "Cusp" suffix
            `${baseName} Cusp`,
            `${sign1}–${sign2} Cusp`,
            `${sign1}-${sign2} Cusp`,
            // Fallback to individual signs
            sign1,
            sign2,
          ].filter(Boolean) as string[]
        )
      );
    }
  }

  return Array.from(new Set([trimmed.toLowerCase(), trimmed].filter(Boolean) as string[]));
}

export function decideMonthlyTargetSign(user: any): string {
  if (!user?.cuspResult) return user?.preferred_sign || '';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getDefaultSignFromUserData } = require('./signs');
  const resolvedSign = getDefaultSignFromUserData(user);
  return resolvedSign;
}

export function normalizeCuspLabelToDB(sign: string): string {
  const noCuspWord = (sign || '').replace(/\s*cusp.*$/i, '').trim();
  return noCuspWord.replace(/[–—−]/g, '-');
}

// ------------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------------
export async function getLatestForecast(
  rawSign: any,
  rawHemisphere: any,
  targetMonth?: Date
): Promise<{ ok: true; row: ForecastRow } | { ok: false; reason: string }> {
  await clearOldMonthlyCacheKeys();

  // Race protection
  const myRequestId = ++requestId;

  const signNormalized = normalizeSignForDatabase(rawSign);
  const hemiLabel = normalizeHemisphereLabel(rawHemisphere);
  const hemiCode = hemiLabel === 'Northern' ? 'NH' : 'SH';

  if (!signNormalized) {
    return { ok: false, reason: 'empty_sign' };
  }

  // Current month key "YYYY-MM-01"
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthKey = targetMonth
    ? targetMonth.toISOString().slice(0, 8) + '01'
    : `${currentYear}-${currentMonth}-01`;

  const cacheKey = getMonthlyForecastCacheKey(signNormalized, hemiLabel, monthKey);

  // Cache first
  try {
    const cached = await storage.getItem(cacheKey);
    if (cached) {
      const cachedRow = JSON.parse(cached);
      return { ok: true, row: cachedRow as ForecastRow };
    }
  } catch {
    /* ignore cache read errors */
  }

  const signAttempts: string[] = buildMonthlySignAttempts(signNormalized);

  try {
    for (const sign of signAttempts) {
      if (myRequestId !== requestId) {
        return { ok: false, reason: 'cancelled' };
      }

      const { data, error } = await supabase
        .from('monthly_forecasts')
        .select('sign, hemisphere, date, monthly_forecast')
        .eq('sign', sign)
        .eq('hemisphere', hemiCode)
        .eq('date', monthKey)
        .order('date', { ascending: false })
        .limit(1);

      if (error) {
        continue;
      }

      if (data && data.length) {
        const sorted = [...data].sort(
          (a, b) => parseAsDate(b.date) - parseAsDate(a.date)
        );
        const best = sorted[0];

        if (best?.monthly_forecast) {
          try {
            await storage.setItem(cacheKey, JSON.stringify(best));
          } catch {
            /* ignore cache write errors */
          }
          // Add alias for any legacy code expecting ".forecast"
          (best as any).forecast = best.monthly_forecast;
          return { ok: true, row: best as ForecastRow };
        }
      }
    }

    return { ok: false, reason: 'not_found' };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'exception' };
  }
}

/** Legacy wrapper */
export async function getForecast(
  signLabel: string,
  hemisphereLabel: 'Northern' | 'Southern'
): Promise<Forecast | null> {
  const res = await getLatestForecast(signLabel, hemisphereLabel);
  if (!res.ok) return null;

  return {
    sign: res.row.sign,
    hemisphere: normalizeHemisphereLabel(res.row.hemisphere),
    forecast_date: res.row.date,
    forecast_month: res.row.date,
    forecast: res.row.monthly_forecast,
  };
}

export async function purgeUserCache(email: string) {
  try {
    const keys = await storage.getAllKeys();

    const userDataKeys = keys.filter(k =>
      k === '@astro_cusp_user_data' ||
      k.startsWith(`userData:${email.toLowerCase()}`) ||
      k.startsWith(`cosmicProfile:${email.toLowerCase()}`)
    );

    const badMonthlyKeys = keys.filter(k =>
      k.startsWith('monthly_SH_') ||
      k.startsWith('monthly_NH_') ||
      (k.startsWith('monthly_') && !k.includes('__'))
    );

    const userMonthlyKeys = keys.filter(k =>
      k.startsWith(`monthly:${email.toLowerCase()}:`)
    );

    const allKeysToRemove = [...userDataKeys, ...badMonthlyKeys, ...userMonthlyKeys];

    if (allKeysToRemove.length > 0) {
      await storage.multiRemove(allKeysToRemove);
      console.log('🧹 [cache] Purged stale keys for', email, ':', allKeysToRemove.length);
    }
  } catch (error) {
    console.error('❌ [cache] Error purging cache for', email, ':', error);
  }
}
