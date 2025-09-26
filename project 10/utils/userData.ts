// utils/userData.ts
import type { User } from '@supabase/supabase-js';
import { CuspResult } from './astrology';
import { clearLocalAuthData } from './auth';

// ✅ use the shared singletons
import { supabase } from '@/utils/supabase';

// ---------------- Types ----------------
export interface UserProfile {
  email: string;
  name: string;
  birthDate: string;       // ISO string
  birthTime: string;
  birthLocation: string;
  hemisphere: 'Northern' | 'Southern';
  cuspResult: CuspResult;
  createdAt: string;       // ISO string
  lastLoginAt?: string;    // ISO string
  needsRecalc?: boolean;   // Flag for profiles that need recalculation
}

// Session-level promise to avoid duplicate fetches
let _userDataPromise: Promise<UserProfile | null> | null = null;

// Web-compatible storage
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
  async getAllKeys(): Promise<string[]> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Object.keys(window.localStorage);
    }
    return [];
  },
  async multiRemove(keys: string[]): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      keys.forEach(key => window.localStorage.removeItem(key));
    }
  }
};

// Export for manual cache clearing
export function clearUserDataPromise(): void {
  _userDataPromise = null;
}

// NUCLEAR: Always force refresh until Liam's issue is resolved
let _forceCacheRefresh = true;
let _cacheVersion = Date.now(); // Invalidate all existing caches

const USER_DATA_KEY = '@astro_cusp_user_data';

// ---------------- Helpers ----------------
function computeCuspFallback(birthDate?: string): CuspResult | null {
  if (!birthDate) return null;
  
  // PRODUCTION CRITICAL: Never create profiles with placeholder dates
  if (birthDate === '1900-01-01' || birthDate.startsWith('1900-01-01')) {
    console.error('❌ [computeCuspFallback] PRODUCTION: Refusing to compute for placeholder date:', birthDate);
    return null;
  }
  
  try {
    console.log('🔍 [computeCuspFallback] PRODUCTION: Computing fallback for birth date:', birthDate);
    
    // Parse YYYY-MM-DD string directly without creating Date object
    const [year, month, day] = birthDate.split('-').map(Number);
    
    // Validate the date is reasonable (not 1900 or future)
    if (year < 1920 || year > new Date().getFullYear()) {
      console.error('❌ [computeCuspFallback] PRODUCTION: Invalid year:', year, 'for date:', birthDate);
      return null;
    }
    
    // Check for Sagittarius-Capricorn cusp (Dec 18-24)
    if (month === 12 && day >= 18 && day <= 24) {
      console.log('✅ [computeCuspFallback] PRODUCTION: Detected Sagittarius-Capricorn cusp for:', birthDate);
      return {
        isOnCusp: true,
        primarySign: 'Sagittarius',
        secondarySign: 'Capricorn',
        cuspName: 'Sagittarius–Capricorn Cusp',
        sunDegree: 28.5 + Math.random() * 2,
        description: 'You are born on the Sagittarius–Capricorn Cusp, The Cusp of Prophecy. This unique position gives you traits from both Sagittarius and Capricorn.',
      };
    }
    
    // Check other cusp dates
    const CUSP_DATES = [
      { signs: ['Pisces', 'Aries'], startDate: '19/03', endDate: '24/03', name: 'Pisces–Aries Cusp' },
      { signs: ['Aries', 'Taurus'], startDate: '19/04', endDate: '24/04', name: 'Aries–Taurus Cusp' },
      { signs: ['Taurus', 'Gemini'], startDate: '19/05', endDate: '24/05', name: 'Taurus–Gemini Cusp' },
      { signs: ['Gemini', 'Cancer'], startDate: '19/06', endDate: '24/06', name: 'Gemini–Cancer Cusp' },
      { signs: ['Cancer', 'Leo'], startDate: '19/07', endDate: '25/07', name: 'Cancer–Leo Cusp' },
      { signs: ['Leo', 'Virgo'], startDate: '19/08', endDate: '25/08', name: 'Leo–Virgo Cusp' },
      { signs: ['Virgo', 'Libra'], startDate: '19/09', endDate: '25/09', name: 'Virgo–Libra Cusp' },
      { signs: ['Libra', 'Scorpio'], startDate: '19/10', endDate: '25/10', name: 'Libra–Scorpio Cusp' },
      { signs: ['Scorpio', 'Sagittarius'], startDate: '18/11', endDate: '24/11', name: 'Scorpio–Sagittarius Cusp' },
      { signs: ['Capricorn', 'Aquarius'], startDate: '17/01', endDate: '23/01', name: 'Capricorn–Aquarius Cusp' },
      { signs: ['Aquarius', 'Pisces'], startDate: '15/02', endDate: '21/02', name: 'Aquarius–Pisces Cusp' },
    ];
    
    // Helper function to check if date falls in cusp range
    function isDateInCuspRange(day, month, startDate, endDate) {
      const [startDay, startMonth] = startDate.split('/').map(Number);
      const [endDay, endMonth] = endDate.split('/').map(Number);
      
      if (startMonth > endMonth) {
        // Crosses year boundary (like Dec-Jan)
        return (month === startMonth && day >= startDay) || (month === endMonth && day <= endDay);
      } else {
        // Same month range
        if (month === startMonth && month === endMonth) return day >= startDay && day <= endDay;
        if (month === startMonth) return day >= startDay;
        if (month === endMonth) return day <= endDay;
        return false;
      }
    }
    
    // Check all cusp dates
    for (const cusp of CUSP_DATES) {
      if (isDateInCuspRange(day, month, cusp.startDate, cusp.endDate)) {
        console.log('✅ [computeCuspFallback] PRODUCTION: Detected cusp:', cusp.name);
        return {
          isOnCusp: true,
          primarySign: cusp.signs[0],
          secondarySign: cusp.signs[1],
          cuspName: cusp.name,
          sunDegree: 28.5 + Math.random() * 2,
          description: `You are born on the ${cusp.name}. This unique position gives you traits from both ${cusp.signs[0]} and ${cusp.signs[1]}.`,
        };
      }
    }
    
    const { calculateSunSign } = require('./astrology');
    const primarySign = calculateSunSign(birthDate);
    console.log('✅ [computeCuspFallback] PRODUCTION: Calculated sign:', primarySign, 'for date:', birthDate);
    console.log('🔍 [computeCuspFallback] PRODUCTION: Date details:', {
      year,
      month,
      day,
      originalString: birthDate
    });
    return {
      isOnCusp: false,
      primarySign,
      sunDegree: 15,
      description: `You are a ${primarySign} with strong ${primarySign} energy.`,
    };
  } catch (error) {
    console.error('❌ [computeCuspFallback] PRODUCTION: Error computing fallback:', error);
    return null;
  }
}

// Clean up any incomplete/corrupted cache
export async function healUserCache(): Promise<void> {
  try {
    // Clear any stale auth data that might cause token errors
    await clearLocalAuthData();
    
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    if (!raw) return;
    const profile = JSON.parse(raw);
    if (!profile?.cuspResult) {
      console.log('🔧 [userData] Removing incomplete cached profile');
      await AsyncStorage.removeItem(USER_DATA_KEY);
    }
  } catch {
    console.log('🔧 [userData] Clearing corrupted cache');
    await AsyncStorage.removeItem(USER_DATA_KEY);
  }
}

// ---------------- Save / Update ----------------
export async function saveUserData(userData: UserProfile): Promise<void> {
  try {
    // Clear the session promise to force refresh on next getUserData call
    _userDataPromise = null;
    
    // Force cache refresh flag to ensure fresh data on next fetch
    _forceCacheRefresh = true;

    // PETER DEBUG: Enhanced logging for petermaricar@bigpond.com
    const isPeter = userData.email?.toLowerCase() === 'petermaricar@bigpond.com';
    if (isPeter) {
      console.log('🔍 [PETER DEBUG] Starting saveUserData for Peter:', {
        email: userData.email,
        name: userData.name,
        birthDate: userData.birthDate,
        birthTime: userData.birthTime,
        birthLocation: userData.birthLocation,
        hemisphere: userData.hemisphere,
        hasCuspResult: !!userData.cuspResult,
        cuspResultDetails: userData.cuspResult
      });
    }

    console.log('💾 [userData] saveUserData:', {
      email: userData.email,
      isOnCusp: userData.cuspResult?.isOnCusp,
      cuspName: userData.cuspResult?.cuspName,
      primarySign: userData.cuspResult?.primarySign,
      hemisphere: userData.hemisphere,
    });

    if (!userData.email || !userData.cuspResult) {
      throw new Error('Missing required profile data: email and cuspResult are required');
    }
    if (userData.cuspResult.isOnCusp && !userData.cuspResult.cuspName) {
      console.error('❌ [userData] Cusp user missing cuspName in save payload!');
      throw new Error('Cusp result is incomplete - missing cuspName');
    }

    const dataToSave: UserProfile = {
      ...userData,
      lastLoginAt: new Date().toISOString(),
    };

    // Get current user to ensure we're saving to the right cache
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (isPeter) {
        console.log('🔍 [PETER DEBUG] Auth user found:', {
          userId: user.id,
          email: user.email,
          userCacheKey: `${USER_DATA_KEY}:${user.id}`
        });
      }
      
      // Save to user-specific cache
      const userCacheKey = `${USER_DATA_KEY}:${user.id}`;
      await storage.setItem(userCacheKey, JSON.stringify(dataToSave));
      
      if (isPeter) {
        // Verify the save worked
        const verification = await storage.getItem(userCacheKey);
        console.log('🔍 [PETER DEBUG] Cache save verification:', {
          saved: !!verification,
          dataLength: verification?.length,
          canParse: verification ? (() => {
            try { JSON.parse(verification); return true; } catch { return false; }
          })() : false
        });
      }
    } else {
      // Fallback for anonymous users
      await storage.setItem(USER_DATA_KEY, JSON.stringify(dataToSave));
    }
    console.log('✅ [userData] Saved to AsyncStorage');

    // 🔧 clear any legacy email-scoped caches
    if (userData.email) {
      await purgeUserCache(userData.email);
      console.log('🧹 [userData] Purged monthly caches for', userData.email);
    }
    
    console.log('✅ [userData] saveUserData completed - cache will refresh on next fetch');
  } catch (err) {
    console.error('❌ [userData] Error saving user data:', err);
    
    // PETER DEBUG: Extra error details
    if (userData.email?.toLowerCase() === 'petermaricar@bigpond.com') {
      console.error('🔍 [PETER DEBUG] Save failed with details:', {
        errorMessage: err?.message,
        errorStack: err?.stack,
        userData: userData,
        timestamp: new Date().toISOString()
      });
    }
    
    throw new Error('Failed to save user data');
  }
}

// ---------------- Read (cache → DB) ----------------
export async function getUserData(forceFresh = false): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const userCacheKey = `${USER_DATA_KEY}:${user.id}`;

  // Check cache first (unless forcing fresh)
  if (!forceFresh) {
    try {
      const cached = await storage.getItem(userCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.cuspResult && parsed.email === user.email) {
          console.log('💾 [userData] Using cached profile for', user.email);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ [userData] Invalid cached data, will fetch fresh');
    }
  }

  console.log('🔍 [userData] Fetching fresh profile from Supabase for', user.email);

  // Fetch from Supabase
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ [userData] Supabase fetch error:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  if (!profile) {
    console.log('ℹ️ [userData] No profile found for user:', user.email);
    return null;
  }

  // SECURITY: Verify this profile belongs to the current user
  if (profile.email?.toLowerCase() !== user.email?.toLowerCase()) {
    console.error('❌ [userData] SECURITY: Profile email mismatch!', {
      profileEmail: profile.email,
      authEmail: user.email,
      userId: user.id
    });
    return null;
  }

  // Parse cusp_result from database
  let cuspResult: CuspResult | undefined;
  try {
    cuspResult = typeof profile.cusp_result === 'string' 
      ? JSON.parse(profile.cusp_result) 
      : profile.cusp_result;
    
    // Validate minimal shape
    const valid =
      !!cuspResult &&
      (
        (cuspResult.isOnCusp && !!cuspResult.cuspName && !!cuspResult.primarySign) ||
        (!cuspResult.isOnCusp && !!cuspResult.primarySign)
      );

    if (!valid) {
      console.warn('⚠️ [userData] Invalid cusp_result, flagging for recalc', { email: profile.email, cuspResult });
      const userProfile: UserProfile = {
        email: profile.email,
        name: profile.name ?? '',
        birthDate: profile.birth_date ?? '',
        birthTime: profile.birth_time ?? '',
        birthLocation: profile.birth_location ?? '',
        hemisphere: (profile.hemisphere === 'Southern' ? 'Southern' : 'Northern'),
        cuspResult: undefined as any,
        createdAt: profile.created_at,
        lastLoginAt: profile.last_login_at ?? undefined,
        needsRecalc: true,
      };
      
      // Don't cache invalid profile
      return userProfile;
    }
  } catch (e) {
    console.error('❌ [userData] Error parsing cusp_result:', e);
    const userProfile: UserProfile = {
      email: profile.email,
      name: profile.name ?? '',
      birthDate: profile.birth_date ?? '',
      birthTime: profile.birth_time ?? '',
      birthLocation: profile.birth_location ?? '',
      hemisphere: (profile.hemisphere === 'Southern' ? 'Southern' : 'Northern'),
      cuspResult: undefined as any,
      createdAt: profile.created_at,
      lastLoginAt: profile.last_login_at ?? undefined,
      needsRecalc: true,
    };
    
    return userProfile;
  }

  console.log('✅ [userData] Valid profile loaded:', {
    email: profile.email,
    isOnCusp: cuspResult.isOnCusp,
    cuspName: cuspResult.cuspName,
    primarySign: cuspResult.primarySign,
    hemisphere: profile.hemisphere
  });

  const userProfile: UserProfile = {
    email: profile.email,
    name: profile.name ?? '',
    birthDate: profile.birth_date ?? '',
    birthTime: profile.birth_time ?? '',
    birthLocation: profile.birth_location ?? '',
    hemisphere: (profile.hemisphere === 'Southern' ? 'Southern' : 'Northern'),
    cuspResult,
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at ?? undefined,
    needsRecalc: false,
  };

  // Cache the valid profile
  await storage.setItem(userCacheKey, JSON.stringify(userProfile));
  console.log('✅ [userData] Cached fresh profile for', userProfile.email);
  
  return userProfile;
}

// ---------------- Misc helpers ----------------
export async function updateLastLogin(): Promise<void> {
  try {
    const profile = await getUserData();
    if (!profile) return;
    profile.lastLoginAt = new Date().toISOString();
    await saveUserData(profile);
    console.log('🕒 [userData] Last login updated');
  } catch (e) {
    console.error('❌ [userData] updateLastLogin error:', e);
  }
}

export async function clearUserData(): Promise<void> {
  try {
    console.log('🧹 [clearUserData] Clearing user data caches...');
    
    // Clear the session-level promise cache
    _userDataPromise = null;
    
    // Clear user-specific cache only
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userCacheKey = `${USER_DATA_KEY}:${user.id}`;
        await storage.removeItem(userCacheKey);
        console.log('🧹 [clearUserData] Cleared user-specific cache for:', user.email);
      }
    } catch (authError: any) {
      // Only clear all caches if it's a critical auth error, not session refresh
      console.log('🧹 [clearUserData] Auth check failed, clearing legacy cache only');
      await storage.removeItem(USER_DATA_KEY);
    }
    
    // Clear legacy cache
    await storage.removeItem(USER_DATA_KEY);
    
    console.log('🧹 [userData] Local user cache cleared');
  } catch (e) {
    console.error('❌ [userData] clearUserData error:', e);
    throw new Error('Failed to clear user data');
  }
}

export async function isUserLoggedIn(): Promise<boolean> {
  try {
    const profile = await getUserData();
    return profile !== null;
  } catch {
    return false;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  const current = await getUserData();
  if (!current) throw new Error('No user data found');
  const merged = { ...current, ...updates };
  await saveUserData(merged);
  console.log('✅ [userData] Profile updated locally');
}

export async function debugStorage(): Promise<void> {
  try {
    console.log('🔍 [userData] === DEBUG STORAGE ===');
    const keys = await storage.getAllKeys();
    console.log('🔍 keys:', keys);
    const raw = await storage.getItem(USER_DATA_KEY);
    console.log('🔍 userData length:', raw?.length ?? 0);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        console.log('🔍 parsed:', {
          email: parsed.email,
          hasCuspResult: !!parsed.cuspResult,
          hemisphere: parsed.hemisphere,
          createdAt: parsed.createdAt,
          lastLoginAt: parsed.lastLoginAt,
        });
      } catch (e) {
        console.error('❌ parse stored data:', e);
      }
    }
  } catch (e) {
    console.error('❌ [userData] debugStorage error:', e);
  }
}