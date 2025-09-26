import { supabase } from './supabase';

// Admin function to clean up duplicate Mish profile
export async function removeDuplicateMishProfile(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔍 Looking for duplicate Mish profiles...');
    
    // Find both profiles
    const { data: profiles, error: findError } = await supabase
      .from('user_profiles')
      .select('*')
      .or('email.eq.mish@fpanda.com,email.eq.mish@fpanda.com.au')
      .order('created_at', { ascending: true });
    
    if (findError) {
      console.error('❌ Error finding profiles:', findError);
      return { success: false, message: `Error finding profiles: ${findError.message}` };
    }
    
    if (!profiles || profiles.length === 0) {
      return { success: false, message: 'No profiles found for mish@fpanda.com or mish@fpanda.com.au' };
    }
    
    console.log(`📋 Found ${profiles.length} profile(s)`);
    
    // Find the incorrect profile (without .au)
    const incorrectProfile = profiles.find(p => p.email === 'mish@fpanda.com');
    const correctProfile = profiles.find(p => p.email === 'mish@fpanda.com.au');
    
    if (!incorrectProfile) {
      return { success: false, message: 'No incorrect profile found (mish@fpanda.com)' };
    }
    
    if (!correctProfile) {
      return { success: false, message: 'Correct profile not found (mish@fpanda.com.au)' };
    }
    
    console.log('🎯 Target for removal:', incorrectProfile.email);
    console.log('✅ Keeping correct profile:', correctProfile.email);
    
    // Step 1: Remove dependencies that might prevent deletion
    console.log('🔍 Removing dependencies...');
    
    // Remove user_subscriptions
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', incorrectProfile.user_id);
    
    if (subError) {
      console.warn('⚠️ Error removing subscriptions:', subError);
    }
    
    // Remove user_preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', incorrectProfile.user_id);
    
    if (prefError) {
      console.warn('⚠️ Error removing preferences:', prefError);
    }
    
    // Remove stripe_customers
    const { error: stripeError } = await supabase
      .from('stripe_customers')
      .delete()
      .eq('user_id', incorrectProfile.user_id);
    
    if (stripeError) {
      console.warn('⚠️ Error removing stripe customers:', stripeError);
    }
    
    // Remove customers
    const { error: custError } = await supabase
      .from('customers')
      .delete()
      .eq('user_id', incorrectProfile.user_id);
    
    if (custError) {
      console.warn('⚠️ Error removing customers:', custError);
    }
    
    // Step 2: Try to delete the profile
    console.log('🗑️ Attempting to delete incorrect profile...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', incorrectProfile.id);
    
    if (deleteError) {
      console.error('❌ Direct deletion failed:', deleteError);
      
      // Fallback: Mark as deleted by changing email
      console.log('🔄 Fallback: marking profile as deleted...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email: `DELETED_${Date.now()}_${incorrectProfile.email}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', incorrectProfile.id);
      
      if (updateError) {
        return { success: false, message: `Failed to mark profile as deleted: ${updateError.message}` };
      } else {
        return { success: true, message: 'Profile marked as deleted (email prefixed with DELETED_)' };
      }
    } else {
      return { success: true, message: 'Successfully deleted incorrect profile' };
    }
    
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return { success: false, message: `Cleanup failed: ${error.message}` };
  }
}