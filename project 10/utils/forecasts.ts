// utils/forecasts.ts
import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

import {
  normalizeSignForDatabase,
  normalizeHemisphereLabel,
  buildDailySignAttempts,
} from '@/utils/signs';

export interface ForecastRow {
  sign: string;
  hemisphere: string;
  date: string;
  forecast: string;
}

export interface Forecast {
  sign: string;
  hemisphere: 'Northern' | 'Southern';
  forecast_date: string;
  forecast_month: string;
  forecast: string;
}

// Race condition protection
let requestId = 0;

// Web-compatible storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem(key) 
        : null;
    }
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default.removeItem(key);
  },
  async getAllKeys(): Promise<string[]> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage 
        ? Object.keys(window.localStorage) 
        : [];
    }
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default.getAllKeys();
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        keys.forEach(key => window.localStorage.removeItem(key));
      }
      return;
    }
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default.multiRemove(keys);
  }
};

// Parse date string safely for sorting
function parseAsDate(d: string | undefined): number {
  if (!d) return 0;
  const t = Date.parse(d);
  return Number.isNaN(t) ? 0 : t;
}

// FIX 1: Proper cache key that includes sign to prevent cross-contamination
function getMonthlyForecastCacheKey(sign: string, hemisphere: string, month: string): string {
  const hemiCode = hemisphere === 'Northern' ? 'NH' : hemisphere === 'Southern' ? 'SH' : hemisphere;
  return `monthly_${sign}__${hemiCode}__${month}`;
}

// Clear old bad cache keys that were missing the sign (run once to clean up)
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
  const trimmed = input.trim();
  console.log('🔍 [monthly] Building sign attempts for:', trimmed);

  if (trimmed.toLowerCase().includes('cusp')) {
    const baseName = trimmed.replace(/\s*cusp\s*$/i, '').trim();
    const parts = baseName.split(/[–-]/).map(p => p.trim()).filter(Boolean);
    
    if (parts.length >= 2) {
      const sign1 = parts[0];
      const sign2 = parts[1];
      
      return [
        // PRIORITIZE DATABASE CUSP FORMATS FIRST (lowercase with hyphen) 
        `${sign1.toLowerCase()}-${sign2.toLowerCase()}`,
        trimmed,
        `${sign1}–${sign2}`,
        `${sign1}-${sign2}`,
        baseName,
        // Try with "Cusp" suffix
        `${baseName} Cusp`,
        `${sign1}–${sign2} Cusp`,
        `${sign1}-${sign2} Cusp`,
        // Individual signs as fallback
        sign1,
        sign2,
      ].filter(Boolean);
    }
  }
  
  // For pure signs
  return [trimmed.toLowerCase(), trimmed];
}

export function decideMonthlyTargetSign(user: any): string {
  if (!user?.cuspResult) return user?.preferred_sign || '';
  
  // Use the comprehensive sign resolution function for consistency
  const { getDefaultSignFromUserData } = require('./signs');
  const resolvedSign = getDefaultSignFromUserData(user);
  console.log('🎯 [monthly] Using resolved sign for all users:', resolvedSign);
  return resolvedSign;
}

export function normalizeCuspLabelToDB(sign: string): string {
  // Convert "Aries–Taurus Cusp" → "Aries-Taurus"
  const noCuspWord = sign.replace(/\s*cusp.*$/i, '').trim();
  // Replace en-dash / em-dash / long dash with hyphen
  return noCuspWord.replace(/[–—−]/g, '-');
}

/**
 * FIX 2 & 3: Robust query with no fallback that drops sign filter + race protection
 */
export async function getLatestForecast(
  rawSign: any,
  rawHemisphere: any,
  targetMonth?: Date
): Promise<{ ok: true; row: ForecastRow } | { ok: false; reason: string }> {
  console.log('🔍 [forecasts] getLatestForecast called with:', {
    rawSign,
    rawHemisphere,
    targetMonth
  });
  
  // Clean up old cache keys on first run
  await clearOldMonthlyCacheKeys();
  
  // FIX 3: Race condition protection
  const myRequestId = ++requestId;
  
  const signNormalized = normalizeSignForDatabase(rawSign);
  const hemiLabel = normalizeHemisphereLabel(rawHemisphere);
  
  console.log('🔍 [forecasts] Normalized inputs:', {
    original: rawSign,
    normalized: signNormalized,
    hemisphere: hemiLabel
  });
  
  // Convert to database format: NH/SH
  const hemiCode = hemiLabel === 'Northern' ? 'NH' : 'SH';

  if (!signNormalized) {
    console.warn('[monthly] empty sign after normalization', JSON.stringify({ rawSign }));
    return { ok: false, reason: 'empty_sign' };
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Fix: Use current month (September 2025) instead of August
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthKey = targetMonth 
    ? targetMonth.toISOString().slice(0, 8) + '01'
    : `${currentYear}-${currentMonth}-01`; // This will be 2025-09-01 for September 2025
  const cacheKey = getMonthlyForecastCacheKey(signNormalized, hemiLabel, monthKey);

  console.log('🔍 [forecast] Fetching forecast with proper caching:', {
    rawSign,
    normalizedSign: signNormalized,
    hemisphere: hemiLabel,
    hemisphereCode: hemiCode,
    cacheKey,
    targetMonth: monthKey,
    requestId: myRequestId
  });

  // FIX 1: Check cache with sign-specific key
  try {
    const cached = await storage.getItem(cacheKey);
    if (cached) {
      const cachedRow = JSON.parse(cached);
      console.log('💾 [forecast] Cache hit:', { key: cacheKey, sign: cachedRow.sign });
      return { ok: true, row: cachedRow as ForecastRow };
    }
  } catch (error) {
    console.warn('⚠️ [forecast] Cache read error:', error);
  }

  // Build sign attempts
  const signAttempts = buildMonthlySignAttempts(signNormalized);

  try {
    // FIX 2: Try all sign variations but NEVER drop the sign filter
    for (const sign of signAttempts) {
      // FIX 3: Check if request is still current (race protection)
      if (myRequestId !== requestId) {
        console.log('🚫 [forecast] Request cancelled (race condition)');
        return { ok: false, reason: 'cancelled' };
      }
      
      console.log('🔍 [forecast] Trying exact match:', { 
        sign: sign, 
        hemisphere: hemiCode,
        table: 'monthly_forecasts',
        monthKey
      });
      
      console.log('🔍 [forecasts] Query details:', {
        sign,
        hemisphere: hemiCode,
        date: monthKey
      });
      
      const { data, error } = await supabase
        .from('monthly_forecasts')
        .select('sign, hemisphere, date, monthly_forecast')
        .eq('sign', sign)
        .eq('hemisphere', hemiCode)
        .eq('date', monthKey)
        .order('date', { ascending: false })
        .limit(1);
      
      console.log('🔍 [forecasts] Supabase query result:', {
        error: error?.message,
        dataLength: data?.length,
        firstRow: data?.[0]
      });

      if (error) {
        console.warn('⚠️ [forecast] Query error for', { sign, hemisphere: hemiCode, error: error.message });
        continue;
      }

      console.log('🔍 [forecast] Query result for', { sign, hemisphere: hemiCode }, ':', { 
        found: !!data && data.length > 0, 
        count: data?.length,
        sampleSigns: data?.slice(0, 3).map(d => d.sign)
      });
      
      if (data && data.length) {
        // Sort by parsed date desc (since date is TEXT in schema)
        const sorted = [...data].sort(
          (a, b) => parseAsDate(b.date) - parseAsDate(a.date)
        );
        const best = sorted[0];

        if (best?.monthly_forecast) {
          console.log('✅ [forecast] Found forecast:', { sign: best.sign, hemisphere: best.hemisphere, date: best.date });
          
          // FIX 1: Cache with sign-specific key
          try {
            await storage.setItem(cacheKey, JSON.stringify(best));
            console.log('💾 [forecast] Cached result:', { key: cacheKey, sign: best.sign });
          } catch (error) {
            console.warn('⚠️ [forecast] Cache write error:', error);
          }
          
          return { ok: true, row: best as ForecastRow };
        }
      }
    }

    // FIX 2: NO FALLBACK QUERIES - if no specific sign found, return not found
    // This prevents everyone from getting the same forecast
    console.warn('🙈 [forecast] No forecast found after all strategies.', {
      signNormalized,
      hemiLabel,
      hemiCode,
      signAttempts
    });
    return { ok: false, reason: 'not_found' };
  } catch (e: any) {
    console.error('❌ [forecast] Exception:', { message: e?.message, stack: e?.stack });
    return { ok: false, reason: e?.message || 'exception' };
  }
}

/** Simple wrapper to return legacy shape */
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

// One-time selective cache purge for specific users
export async function purgeUserCache(email: string) {
  try {
    const keys = await storage.getAllKeys();

    // Remove generic userData cache if it belongs to this user
    const userDataKeys = keys.filter(k =>
      k === '@astro_cusp_user_data' ||
      k.startsWith(`userData:${email.toLowerCase()}`) ||
      k.startsWith(`cosmicProfile:${email.toLowerCase()}`)
    );

    // Remove any monthly caches that missed the sign in the key (old bug)
    const badMonthlyKeys = keys.filter(k =>
      k.startsWith('monthly_SH_') ||
      k.startsWith('monthly_NH_') ||
      (k.startsWith('monthly_') && !k.includes('__'))
    );

    // Remove scoped monthly caches for this user
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