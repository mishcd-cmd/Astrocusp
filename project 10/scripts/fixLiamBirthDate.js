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
  console.error('5. Run: node scripts/fixLiamBirthDate.js');
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

async function fixLiamBirthDate() {
  try {
    console.log('🔍 Looking for user with birth date 1997-06-17...');
    
    // Find user with the incorrect birth date
    const { data: users, error: findError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('birth_date', '1997-06-17');
    
    if (findError) {
      console.error('❌ Error finding user:', findError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️ No users found with birth date 1997-06-17');
      return;
    }
    
    console.log(`📋 Found ${users.length} user(s) with birth date 1997-06-17:`);
    users.forEach(user => {
      console.log(`  • ${user.email} (ID: ${user.id})`);
      console.log(`    Current birth_date: ${user.birth_date}`);
      console.log(`    Birth time: ${user.birth_time}`);
      console.log(`    Birth location: ${user.birth_location}`);
    });
    
    // Update each user's birth date to June 18th
    for (const user of users) {
      console.log(`\n🔧 Updating birth date for ${user.email}...`);
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          birth_date: '1997-06-18',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${user.email}:`, updateError);
      } else {
        console.log(`✅ Successfully updated ${user.email} birth date to 1997-06-18`);
      }
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('user_profiles')
      .select('email, birth_date')
      .eq('birth_date', '1997-06-18');
    
    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
    } else {
      console.log('✅ Verification complete:');
      updatedUsers?.forEach(user => {
        console.log(`  • ${user.email}: ${user.birth_date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixLiamBirthDate().catch(console.error);
}

module.exports = { fixLiamBirthDate };