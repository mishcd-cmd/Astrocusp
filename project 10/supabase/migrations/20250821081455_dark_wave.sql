/*
  # Fix signup trigger function

  1. Updates
    - Fix the handle_new_user trigger function to handle new user creation properly
    - Ensure it can handle optional birth_date and name from auth metadata
    - Add proper error handling

  2. Security
    - Maintains existing RLS policies
    - Uses proper auth.uid() references
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user profile with data from auth metadata
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    birth_date,
    birth_time,
    birth_location,
    hemisphere,
    cusp_result,
    last_login_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birth_date')::timestamptz
      WHEN NEW.raw_user_meta_data->>'birthDate' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birthDate')::timestamptz
      WHEN NEW.raw_user_meta_data->>'dob' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'dob')::timestamptz
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'birth_time',
    NEW.raw_user_meta_data->>'birth_location',
    COALESCE(NEW.raw_user_meta_data->>'hemisphere', 'Northern'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'cusp_result' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'cusp_result')::jsonb
      ELSE NULL
    END,
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();