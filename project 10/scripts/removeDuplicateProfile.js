require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check if running in browser environment
if (typeof window !== 'undefined') {
  console.error('❌ This script cannot run in a browser environment.');
  console.error('📋 Please follow these steps to run locally:');
  console.error('');
  console.error('1. Download this project to your local machine');
  console.error('2. Install Node.js if not already installed');
  console.error('3. Run: npm install');
  console.error('4. Create .env.local with your Supabase credentials');
  console.error('5. Run: node scripts/removeDuplicateProfile.js');
  console.error('');
  console.error('See README-DEBUG.md for detailed instructions.');
  process.exit(1);
}

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeDuplicateProfile() {
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
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('ℹ️ No profiles found for mish@fpanda.com or mish@fpanda.com.au');
      return;
    }
    
    console.log(`📋 Found ${profiles.length} profile(s):`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.email} (ID: ${profile.id})`);
      console.log(`     User ID: ${profile.user_id}`);
      console.log(`     Created: ${profile.created_at}`);
      console.log(`     Hemisphere: ${profile.hemisphere}`);
      console.log(`     Has cusp result: ${!!profile.cusp_result}`);
      console.log('');
    });
    
    // Find the incorrect profile (without .au)
    const incorrectProfile = profiles.find(p => p.email === 'mish@fpanda.com');
    const correctProfile = profiles.find(p => p.email === 'mish@fpanda.com.au');
    
    if (!incorrectProfile) {
      console.log('ℹ️ No incorrect profile found (mish@fpanda.com)');
      return;
    }
    
    if (!correctProfile) {
      console.log('⚠️ Correct profile not found (mish@fpanda.com.au)');
      console.log('⚠️ This script is designed to remove the duplicate when the correct one exists');
      return;
    }
    
    console.log('🎯 Target for removal:', incorrectProfile.email, '(ID:', incorrectProfile.id, ')');
    console.log('✅ Keeping correct profile:', correctProfile.email, '(ID:', correctProfile.id, ')');
    
    // Check for dependencies that might prevent deletion
    console.log('\n🔍 Checking for dependencies...');
    
    // Check user_subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', incorrectProfile.user_id);
    
    if (subError) {
      console.warn('⚠️ Error checking subscriptions:', subError);
    } else if (subscriptions && subscriptions.length > 0) {
      console.log(`📋 Found ${subscriptions.length} subscription(s) linked to incorrect profile`);
      
      // Delete subscriptions first
      const { error: deleteSubError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', incorrectProfile.user_id);
      
      if (deleteSubError) {
        console.error('❌ Error deleting subscriptions:', deleteSubError);
        return;
      } else {
        console.log('✅ Deleted linked subscriptions');
      }
    }
    
    // Check user_preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', incorrectProfile.user_id);
    
    if (prefError) {
      console.warn('⚠️ Error checking preferences:', prefError);
    } else if (preferences && preferences.length > 0) {
      console.log(`📋 Found ${preferences.length} preference(s) linked to incorrect profile`);
      
      // Delete preferences first
      const { error: deletePrefError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', incorrectProfile.user_id);
      
      if (deletePrefError) {
        console.error('❌ Error deleting preferences:', deletePrefError);
        return;
      } else {
        console.log('✅ Deleted linked preferences');
      }
    }
    
    // Check stripe_customers
    const { data: stripeCustomers, error: stripeError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', incorrectProfile.user_id);
    
    if (stripeError) {
      console.warn('⚠️ Error checking stripe customers:', stripeError);
    } else if (stripeCustomers && stripeCustomers.length > 0) {
      console.log(`📋 Found ${stripeCustomers.length} Stripe customer(s) linked to incorrect profile`);
      
      // Delete stripe customers first
      const { error: deleteStripeError } = await supabase
        .from('stripe_customers')
        .delete()
        .eq('user_id', incorrectProfile.user_id);
      
      if (deleteStripeError) {
        console.error('❌ Error deleting stripe customers:', deleteStripeError);
        return;
      } else {
        console.log('✅ Deleted linked Stripe customers');
      }
    }
    
    // Check customers table
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', incorrectProfile.user_id);
    
    if (custError) {
      console.warn('⚠️ Error checking customers:', custError);
    } else if (customers && customers.length > 0) {
      console.log(`📋 Found ${customers.length} customer(s) linked to incorrect profile`);
      
      // Delete customers first
      const { error: deleteCustError } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', incorrectProfile.user_id);
      
      if (deleteCustError) {
        console.error('❌ Error deleting customers:', deleteCustError);
        return;
      } else {
        console.log('✅ Deleted linked customers');
      }
    }
    
    // Now try to delete the incorrect profile
    console.log('\n🗑️ Attempting to delete incorrect profile...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', incorrectProfile.id);
    
    if (deleteError) {
      console.error('❌ Error deleting profile:', deleteError);
      console.error('❌ Full error details:', JSON.stringify(deleteError, null, 2));
      
      // Try alternative deletion methods
      console.log('\n🔄 Trying alternative deletion by user_id...');
      const { error: deleteError2 } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', incorrectProfile.user_id);
      
      if (deleteError2) {
        console.error('❌ Alternative deletion also failed:', deleteError2);
        
        // Last resort: try to update the email to mark it as deleted
        console.log('\n🔄 Last resort: marking profile as deleted...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            email: `DELETED_${Date.now()}_${incorrectProfile.email}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', incorrectProfile.id);
        
        if (updateError) {
          console.error('❌ Even marking as deleted failed:', updateError);
        } else {
          console.log('✅ Profile marked as deleted (email prefixed with DELETED_)');
        }
      } else {
        console.log('✅ Successfully deleted profile using user_id');
      }
    } else {
      console.log('✅ Successfully deleted incorrect profile');
    }
    
    // Verify the deletion
    console.log('\n🔍 Verifying deletion...');
    const { data: remainingProfiles, error: verifyError } = await supabase
      .from('user_profiles')
      .select('email, id, user_id')
      .or('email.eq.mish@fpanda.com,email.eq.mish@fpanda.com.au,email.like.DELETED_%mish@fpanda.com%');
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
    } else {
      console.log('📋 Remaining profiles:');
      remainingProfiles?.forEach(profile => {
        console.log(`  • ${profile.email} (ID: ${profile.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the removal
if (require.main === module) {
  removeDuplicateProfile().catch(console.error);
}

module.exports = { removeDuplicateProfile };