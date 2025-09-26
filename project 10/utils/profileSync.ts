import { supabase } from '@/utils/supabase';
import { getCurrentUser } from '@/utils/auth';

export async function syncStripeToSupabase(userId: string, email: string) {
  try {
    console.log('🔄 [profileSync] Syncing Stripe user to Supabase:', email);
    
    // Check if profile already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [profileSync] Error checking existing profile:', checkError);
      throw checkError;
    }

    if (existing) {
      console.log('✅ [profileSync] Profile already exists for:', email);
      return existing;
    }

    console.log('📝 [profileSync] Creating new profile for Stripe user:', email);

    // Detect hemisphere from email domain or default to Southern for .au domains
    let hemisphere: 'Northern' | 'Southern' = 'Northern';
    if (email.includes('.au') || email.includes('bigpond')) {
      hemisphere = 'Southern';
    }

    // Create minimal profile from auth data
    const profileData = {
      user_id: userId,
      email: email,
      name: email.split('@')[0], // Use email prefix as name
      birth_date: null, // Will be filled when user completes profile
      birth_time: null,
      birth_location: null,
      hemisphere: hemisphere,
      cusp_result: {}, // Empty object for JSONB field
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      needs_recalc: false,
    };

    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ [profileSync] Failed to create profile:', error);
      throw error;
    }
    
    console.log('✅ [profileSync] Created new profile for Stripe user:', email);
    return newProfile;
    
  } catch (error) {
    console.error('❌ [profileSync] Failed to sync profile:', error);
    throw error;
  }
}

// Sync all Stripe customers who don't have Supabase profiles
export async function syncAllStripeCustomers() {
  try {
    console.log('🔄 [profileSync] Starting bulk sync of Stripe customers...');
    
    // Get all Stripe customers
    const { data: stripeCustomers, error: stripeError } = await supabase
      .from('stripe_customers')
      .select('user_id, customer_id');

    if (stripeError) {
      console.error('❌ [profileSync] Error fetching Stripe customers:', stripeError);
      throw stripeError;
    }

    console.log(`📊 [profileSync] Found ${stripeCustomers?.length || 0} Stripe customers`);

    // Get all existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id');

    if (profileError) {
      console.error('❌ [profileSync] Error fetching existing profiles:', profileError);
      throw profileError;
    }

    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    console.log(`📊 [profileSync] Found ${existingProfiles?.length || 0} existing profiles`);

    // Find Stripe customers without profiles
    const missingProfiles = stripeCustomers?.filter(customer => 
      !existingUserIds.has(customer.user_id)
    ) || [];

    console.log(`🔍 [profileSync] Found ${missingProfiles.length} Stripe customers without profiles`);

    if (missingProfiles.length === 0) {
      console.log('✅ [profileSync] All Stripe customers already have profiles');
      return { synced: 0, errors: [] };
    }

    // Get auth user details for missing profiles
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ [profileSync] Error fetching auth users:', authError);
      throw authError;
    }

    let synced = 0;
    const errors: string[] = [];

    // Create profiles for missing users
    for (const customer of missingProfiles) {
      try {
        const authUser = authUsers?.find(u => u.id === customer.user_id);
        if (!authUser?.email) {
          errors.push(`No auth user found for user_id: ${customer.user_id}`);
          continue;
        }

        await syncStripeToSupabase(customer.user_id, authUser.email);
        synced++;
        console.log(`✅ [profileSync] Synced: ${authUser.email}`);
      } catch (error: any) {
        const errorMsg = `Failed to sync ${customer.user_id}: ${error.message}`;
        errors.push(errorMsg);
        console.error('❌ [profileSync]', errorMsg);
      }
    }

    console.log(`✅ [profileSync] Bulk sync complete: ${synced} synced, ${errors.length} errors`);
    return { synced, errors };
    
  } catch (error) {
    console.error('❌ [profileSync] Bulk sync failed:', error);
    throw error;
  }
}