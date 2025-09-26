// utils/userProfile.ts
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Hemisphere = 'Northern' | 'Southern';

export type EditableProfile = {
  name?: string;
  hemisphere?: Hemisphere;
  birthDateISO?: string | null;   // 'YYYY-MM-DD' or null
  birthTime?: string | null;      // 'HH:mm' or null
  birthLocation?: string | null;  // 'City, Country' or null
  cuspResult?: any | null;        // JSON
};

const LS_KEYS_TO_PURGE = [
  'user_profile',           // if you cached this
  'user_data_cache',        // if you cached a wrapper object
  'monthly_',               // prefix
  'forecast_',              // prefix
  '@astro_cusp_user_data',  // existing cache key
];

function ymdOrNull(s?: string | null) {
  if (!s) return null;
  // Accept 'YYYY-MM-DD' only; reject anything else to avoid tz shifts
  const m = s.match(/^\d{4}-\d{2}-\d{2}$/);
  return m ? s : null;
}

export async function saveCosmicProfileEdits(edits: EditableProfile) {
  // 1) Auth guard
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  console.log('🔍 [saveCosmicProfileEdits] Starting save for user:', user.email);

  // 2) Load existing row (if any)
  const { data: existing, error: readErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (readErr) throw new Error(`Failed to read profile: ${readErr.message}`);

  console.log('🔍 [saveCosmicProfileEdits] Existing profile:', {
    exists: !!existing,
    email: existing?.email,
    hemisphere: existing?.hemisphere
  });

  // 3) Build patch only with meaningful values
  const patch: any = {};

  if (typeof edits.name === 'string') patch.name = edits.name.trim();
  if (edits.hemisphere === 'Northern' || edits.hemisphere === 'Southern') {
    patch.hemisphere = edits.hemisphere;
  }
  if (edits.birthDateISO !== undefined) {
    patch.birth_date = ymdOrNull(edits.birthDateISO);
  }
  if (edits.birthTime !== undefined) {
    patch.birth_time = edits.birthTime || null; // keep text, e.g., "14:30"
  }
  if (edits.birthLocation !== undefined) {
    patch.birth_location = edits.birthLocation || null;
  }
  if (edits.cuspResult !== undefined) {
    patch.cusp_result = edits.cuspResult ?? null;
  }

  // 4) Required identity fields
  patch.user_id = user.id;
  patch.email = user.email ?? null;
  patch.updated_at = new Date().toISOString();

  console.log('🔍 [saveCosmicProfileEdits] Patch to apply:', {
    hemisphere: patch.hemisphere,
    birth_date: patch.birth_date,
    birth_time: patch.birth_time,
    birth_location: patch.birth_location,
    hasCuspResult: !!patch.cusp_result
  });

  // 5) Upsert on user_id (NOT id)
  const { data: upserted, error: upErr } = await supabase
    .from('user_profiles')
    .upsert(patch, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (upErr) throw new Error(`Save failed: ${upErr.message}`);

  console.log('✅ [saveCosmicProfileEdits] Successfully saved to Supabase');

  // 6) Purge caches
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(k => LS_KEYS_TO_PURGE.some(prefix => k.startsWith(prefix)));
    if (toRemove.length) {
      await AsyncStorage.multiRemove(toRemove);
      console.log('🧹 [saveCosmicProfileEdits] Purged', toRemove.length, 'cache keys');
    }

    // Also clear user-specific cache
    const userCacheKey = `@astro_cusp_user_data:${user.id}`;
    await AsyncStorage.removeItem(userCacheKey);
    console.log('🧹 [saveCosmicProfileEdits] Cleared user-specific cache');
  } catch (e) {
    // non-fatal
    console.warn('[saveCosmicProfileEdits] cache purge warn:', e);
  }

  // 7) Force fresh fetch to update app state immediately
  try {
    const { getUserData } = await import('./userData');
    const freshProfile = await getUserData(true); // Force fresh from Supabase
    console.log('✅ [saveCosmicProfileEdits] Fresh profile loaded:', {
      email: freshProfile?.email,
      hemisphere: freshProfile?.hemisphere,
      primarySign: freshProfile?.cuspResult?.primarySign
    });
  } catch (e) {
    console.warn('[saveCosmicProfileEdits] Fresh fetch warn:', e);
  }

  console.log('✅ [saveCosmicProfileEdits] Profile update complete');
  return upserted;
}

// Legacy function for backward compatibility
export async function saveCosmicProfile(input: any) {
  console.log('⚠️ [saveCosmicProfile] Using legacy function - consider migrating to saveCosmicProfileEdits');
  
  const edits: EditableProfile = {
    hemisphere: input.zodiacResult?.hemisphere || input.hemisphere,
    birthDateISO: input.birthDate,
    birthTime: input.birthTime,
    birthLocation: input.birthCity || input.birthLocation,
    cuspResult: input.zodiacResult || input.cuspResult,
  };

  return saveCosmicProfileEdits(edits);
}

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
function toISODate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper to convert time to 24-hour format
function to24HourTime(timeStr: string): string {
  if (!timeStr) return '12:00';
  
  // If already in 24-hour format, return as-is
  if (!/AM|PM/i.test(timeStr)) {
    return timeStr.trim();
  }
  
  const [time, period] = timeStr.split(/\s+/);
  const [hours, minutes] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper to clean placeholder values
function cleanPlaceholder(value: any): any {
  if (!value) return null;
  const str = String(value).trim();
  
  // Convert placeholder values to null
  if (str === '' || 
      str === 'Unknown' || 
      str === '1 January 1900' ||
      str === '1900-01-01' ||
      str === '12:00' ||
      str === 'Not calculated yet') {
    return null;
  }
  
  return value;
}

type SafeCuspResult = {
  isOnCusp: boolean;
  primarySign: string;
  secondarySign?: string;
  cuspName?: string;
  sunDegree?: number;
  hemisphere?: 'Northern' | 'Southern';
  description?: string;
};

type SafePayload = {
  birthDate: string;        // YYYY-MM-DD
  birthTime: string;        // HH:mm
  birthCity: string;        // "City, Country"
  timezone?: string;        // "Australia/Sydney"
  zodiacResult: SafeCuspResult;
};

export type ZodiacResult = SafeCuspResult;
export type CosmicProfile = {
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  timezone?: string;
  zodiacResult?: SafeCuspResult;
};

export async function getCosmicProfile(): Promise<CosmicProfile> {
  try {
    console.log('🔍 [getCosmicProfile] Using userData.ts for consistency...');
    
    // Use the working userData system instead of duplicate logic
    const { getUserData } = await import('./userData');
    const userData = await getUserData();
    
    if (!userData) {
      console.log('ℹ️ [getCosmicProfile] No user data found');
      return {};
    }
    
    console.log('✅ [getCosmicProfile] Converting userData to CosmicProfile format:', {
      email: userData.email,
      birthDateRaw: userData.birthDate,
      birthDateType: typeof userData.birthDate,
      birthDateLength: userData.birthDate?.length,
      birthDate: userData.birthDate,
      birthTime: userData.birthTime,
      birthLocation: userData.birthLocation,
      hemisphere: userData.hemisphere,
      hasSign: !!userData.cuspResult?.primarySign
    });
    
    // Convert userData format to CosmicProfile format
    const profile: CosmicProfile = {
      birthDate: userData.birthDate || undefined,
      birthTime: userData.birthTime || undefined,
      birthCity: userData.birthLocation || undefined,
      zodiacResult: userData.cuspResult ? {
        ...userData.cuspResult,
        hemisphere: userData.hemisphere
      } : undefined,
    };
    
    console.log('🔍 [getCosmicProfile] Final profile object:', profile);
    
    return profile;
  } catch (e) {
    console.error('❌ [getCosmicProfile] Exception:', e);
    return {};
  }
}

// Ensure user profile exists after signup/login
export async function ensureUserProfile(userId: string, email: string, profileData?: {
  name?: string;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_location?: string | null;
  hemisphere?: string;
  cusp_result?: any;
}): Promise<any> {
  try {
    console.log('🔍 [ensureUserProfile] Ensuring user profile exists for:', email);
    console.log('🔍 [ensureUserProfile] Profile data:', profileData);
    
    // Check if profile already exists
    const { data: existing, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[ensureUserProfile] Error checking existing profile:', fetchError);
      return null;
    }

    if (existing) {
      console.log('✅ [ensureUserProfile] Profile already exists for:', email);
      
      // Update existing profile with any new data provided (only if fields are empty)
      if (profileData && Object.keys(profileData).length > 0) {
        const updateData: any = {};
        if (profileData.name && !existing.name) updateData.name = profileData.name;
        if (profileData.birth_date && !existing.birth_date) updateData.birth_date = profileData.birth_date;
        if (profileData.birth_time && !existing.birth_time) updateData.birth_time = profileData.birth_time;
        if (profileData.birth_location && !existing.birth_location) updateData.birth_location = profileData.birth_location;
        if (profileData.hemisphere && !existing.hemisphere) updateData.hemisphere = profileData.hemisphere;
        if (profileData.cusp_result && !existing.cusp_result) updateData.cusp_result = profileData.cusp_result;
        
        // Always update last_login_at
        updateData.last_login_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId);
          
        if (updateError) {
          console.error('[ensureUserProfile] Error updating existing profile:', updateError);
        } else {
          console.log('✅ [ensureUserProfile] Updated existing profile with new data:', Object.keys(updateData));
        }
      }
      
      return existing;
    }

    // Create new profile
    console.log('📝 [ensureUserProfile] Creating new profile for:', email);
    const defaultProfileData = {
      user_id: userId,
      email: email,
      name: profileData?.name || email.split('@')[0],
      birth_date: profileData?.birth_date || null, // Only real birth dates
      birth_time: profileData?.birth_time || null, // Only real birth times  
      birth_location: profileData?.birth_location || null, // Only real birth locations
      hemisphere: profileData?.hemisphere || 'Northern',
      cusp_result: profileData?.cusp_result || null, // Only calculated cusp results
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    
    // PRODUCTION CRITICAL: Don't create profiles without real birth data
    if (!profileData?.birth_date || !profileData?.cusp_result) {
      console.log('📝 [ensureUserProfile] PRODUCTION: Not creating profile without real birth data for:', email);
      console.log('📝 [ensureUserProfile] PRODUCTION: User will be prompted to complete profile in calculator');
      return null; // Don't create incomplete profiles
    }
    
    console.log('📝 [ensureUserProfile] Creating profile with data:', defaultProfileData);
    
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert(defaultProfileData)
      .select()
      .single();

    if (createError) {
      console.error('[ensureUserProfile] Error creating profile:', createError);
      console.error('[ensureUserProfile] Failed payload:', defaultProfileData);
      return null;
    }

    console.log('✅ [ensureUserProfile] New profile created for:', email);
    return newProfile;
  } catch (error) {
    console.error('[ensureUserProfile] Error ensuring user profile:', error);
    return null;
  }
}