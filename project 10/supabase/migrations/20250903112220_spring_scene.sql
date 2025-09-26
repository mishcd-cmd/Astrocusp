/*
  # Sync Missing User Profiles

  This migration creates user_profiles records for authenticated users who have Stripe records but no Supabase profile.
  This fixes the disconnect where users can pay through Stripe but have no profile in our system.

  ## What this fixes:
  1. Users like petermaricar@bigpond.com who have Stripe records but no user_profiles
  2. Prevents the "hyphen symbol" error when users try to access horoscopes
  3. Ensures all authenticated users have the required profile structure

  ## Safety:
  - Only creates profiles for users who don't already have them
  - Uses safe defaults for required fields
  - Detects hemisphere from email domain (.au = Southern)
  - Sets needs_recalc=true so users complete their birth details
*/

-- Create user_profiles for authenticated users who don't have them
INSERT INTO user_profiles (
  id,
  user_id, 
  email, 
  name,
  birth_date,
  birth_time,
  birth_location,
  hemisphere,
  cusp_result,
  needs_recalc,
  created_at, 
  updated_at,
  last_login_at
)
SELECT 
  au.id,
  au.id as user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  '1900-01-01' as birth_date,  -- Safe placeholder
  '12:00' as birth_time,       -- Safe placeholder  
  'Unknown' as birth_location, -- Safe placeholder
  CASE 
    WHEN au.email LIKE '%.au' OR au.email LIKE '%bigpond%' THEN 'Southern'
    ELSE 'Northern'
  END as hemisphere,
  '{"isOnCusp": false, "primarySign": "Aries", "sunDegree": 15, "description": "Please complete your birth details to calculate your accurate cosmic position."}' as cusp_result,
  true as needs_recalc,        -- Flag to prompt user to complete profile
  NOW() as created_at,
  NOW() as updated_at,
  NOW() as last_login_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
  );

-- Log the results
DO $$
DECLARE
  sync_count INTEGER;
BEGIN
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  RAISE NOTICE 'Created % missing user profiles', sync_count;
END $$;

-- Specifically check for Peter's email
DO $$
DECLARE
  peter_profile user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO peter_profile 
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE au.email = 'petermaricar@bigpond.com';
  
  IF FOUND THEN
    RAISE NOTICE 'Peter profile exists: email=%, hemisphere=%, needs_recalc=%', 
      peter_profile.email, peter_profile.hemisphere, peter_profile.needs_recalc;
  ELSE
    RAISE NOTICE 'Peter profile still missing - check auth.users table';
  END IF;
END $$;