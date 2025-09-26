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
  console.error('5. Run: node scripts/fixPeterProfile.js');
  console.error('');
  console.error('See README-DEBUG.md for detailed instructions.');
  process.exit(1);
}

// Check if running in browser environment
if (typeof window !== 'undefined') {
  console.error('❌ This script cannot run in a browser environment.');
  console.error('📋 Please follow these steps to run locally:');
  console.error('');
  console.error('1. Download this project to your local machine');
  console.error('2. Install Node.js if not already installed');
  console.error('3. Run: npm install');
  console.error('4. Create .env.local with your Supabase credentials');
  console.error('5. Run: node scripts/fixPeterProfile.js');
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

// Calculate cusp for a given birth date
function calculateCuspForDate(birthDate) {
  const [year, month, day] = birthDate.split('-').map(Number);
  
  console.log('🔍 Calculating cusp for:', { year, month, day });
  
  // Check if date falls in Sagittarius-Capricorn cusp (Dec 18-24)
  if (month === 12 && day >= 18 && day <= 24) {
    return {
      isOnCusp: true,
      primarySign: 'Sagittarius',
      secondarySign: 'Capricorn',
      cuspName: 'Sagittarius–Capricorn Cusp',
      sunDegree: 28.5 + Math.random() * 2, // 28.5°–30.5°
      description: 'You are born on the Sagittarius–Capricorn Cusp, The Cusp of Prophecy. This unique position gives you traits from both Sagittarius and Capricorn.',
    };
  }
  
  // Calculate standard sun sign for non-cusp dates
  let primarySign = 'Sagittarius'; // Default for December
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) primarySign = 'Aries';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) primarySign = 'Taurus';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) primarySign = 'Gemini';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) primarySign = 'Cancer';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) primarySign = 'Leo';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) primarySign = 'Virgo';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) primarySign = 'Libra';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) primarySign = 'Scorpio';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) primarySign = 'Sagittarius';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) primarySign = 'Capricorn';
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) primarySign = 'Aquarius';
  else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) primarySign = 'Pisces';
  
  return {
    isOnCusp: false,
    primarySign,
    sunDegree: 15,
    description: `You are a pure ${primarySign}, embodying the full essence of this zodiac sign.`,
  };
}

async function fixPeterProfile() {
  try {
    console.log('🔍 Looking for Peter\'s profile...');
    
    // Find Peter's auth user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    const peterUser = users.find(u => u.email === 'petermaricar@bigpond.com');
    
    if (!peterUser) {
      console.log('ℹ️ Peter\'s auth user not found');
      return;
    }
    
    console.log('✅ Found Peter\'s auth user:', peterUser.id);
    
    // Check current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', peterUser.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Error checking current profile:', profileError);
      return;
    }
    
    if (currentProfile) {
      console.log('📋 Current profile found:', {
        email: currentProfile.email,
        birth_date: currentProfile.birth_date,
        hemisphere: currentProfile.hemisphere,
        cusp_result: currentProfile.cusp_result,
        needs_recalc: currentProfile.needs_recalc
      });
      
      // If Peter has a birth date, recalculate his cusp
      if (currentProfile.birth_date && currentProfile.birth_date !== '1900-01-01') {
        console.log('🔧 Recalculating cusp for Peter\'s birth date:', currentProfile.birth_date);
        
        const correctCusp = calculateCuspForDate(currentProfile.birth_date);
        console.log('✅ Calculated correct cusp:', correctCusp);
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            cusp_result: correctCusp,
            hemisphere: 'Southern', // Peter is in Australia
            needs_recalc: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', peterUser.id);
        
        if (updateError) {
          console.error('❌ Error updating Peter\'s cusp:', updateError);
        } else {
          console.log('✅ Successfully updated Peter\'s cusp to:', correctCusp.cuspName || correctCusp.primarySign);
        }
      } else {
        console.log('ℹ️ Peter has placeholder birth date, setting needs_recalc=true');
        
        const { error: flagError } = await supabase
          .from('user_profiles')
          .update({
            needs_recalc: true,
            hemisphere: 'Southern',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', peterUser.id);
        
        if (flagError) {
          console.error('❌ Error flagging for recalc:', flagError);
        } else {
          console.log('✅ Flagged Peter\'s profile for recalculation');
        }
      }
    } else {
      console.log('📝 Creating new profile for Peter...');
      
      // Create new profile with Southern Hemisphere default
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: peterUser.id,
          email: peterUser.email,
          name: peterUser.email.split('@')[0],
          birth_date: '1900-01-01', // Placeholder
          birth_time: '12:00',
          birth_location: 'Unknown',
          hemisphere: 'Southern', // Peter is in Australia
          cusp_result: {
            isOnCusp: false,
            primarySign: 'Sagittarius', // Better default for December
            sunDegree: 15,
            description: 'Please complete your birth details for accurate cusp calculation.'
          },
          needs_recalc: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Error creating Peter\'s profile:', createError);
      } else {
        console.log('✅ Created new profile for Peter with Southern Hemisphere');
      }
    }
    
    // Final verification
    const { data: finalProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', peterUser.id)
      .maybeSingle();
    
    console.log('🔍 Final profile state:', {
      email: finalProfile?.email,
      birth_date: finalProfile?.birth_date,
      hemisphere: finalProfile?.hemisphere,
      primarySign: finalProfile?.cusp_result?.primarySign,
      cuspName: finalProfile?.cusp_result?.cuspName,
      needs_recalc: finalProfile?.needs_recalc
    });
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixPeterProfile().catch(console.error);
}

module.exports = { fixPeterProfile };