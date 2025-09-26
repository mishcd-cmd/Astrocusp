/*
  # Fix user profiles placeholder data issue

  1. Database Schema Changes
    - Remove placeholder defaults from birth fields
    - Make birth fields nullable to allow proper NULL values
    - Ensure RLS policies allow updating birth fields

  2. Security
    - Verify insert/update policies for authenticated users
    - Ensure birth fields can be updated by profile owners
*/

-- 1. Remove defaults and make birth fields nullable
ALTER TABLE user_profiles 
  ALTER COLUMN birth_date DROP DEFAULT,
  ALTER COLUMN birth_time DROP DEFAULT,
  ALTER COLUMN birth_location DROP DEFAULT;

ALTER TABLE user_profiles 
  ALTER COLUMN birth_date DROP NOT NULL,
  ALTER COLUMN birth_time DROP NOT NULL,
  ALTER COLUMN birth_location DROP NOT NULL;

-- 2. Drop any triggers that might enforce placeholders
DROP TRIGGER IF EXISTS trg_user_profiles_placeholders ON user_profiles;
DROP FUNCTION IF EXISTS enforce_placeholders();

-- 3. Ensure proper RLS policies exist for birth field updates
DROP POLICY IF EXISTS "profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON user_profiles;

-- Insert own profile policy
CREATE POLICY "profiles_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update own profile policy  
CREATE POLICY "profiles_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Clean up existing placeholder data (optional - uncomment if needed)
-- UPDATE user_profiles 
-- SET 
--   birth_date = NULL,
--   birth_time = NULL, 
--   birth_location = NULL
-- WHERE 
--   birth_date = '1900-01-01' OR
--   birth_time = '12:00' OR
--   birth_location = 'Unknown';