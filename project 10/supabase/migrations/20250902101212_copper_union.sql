/*
  # Add birth timezone column

  1. Schema Changes
    - Add `birth_tz` column to `user_profiles` table for storing timezone information
    - This enables proper timezone-aware birth time calculations

  2. Data Migration
    - Existing records will have NULL timezone initially
    - Applications can detect and populate timezone from birth_location

  3. Benefits
    - Accurate astrological calculations using proper local time
    - No more timezone drift issues with birth dates/times
    - Support for users born in different timezones
*/

-- Add timezone column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'birth_tz'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN birth_tz text;
    COMMENT ON COLUMN user_profiles.birth_tz IS 'Birth timezone (e.g., Australia/Sydney, America/New_York)';
  END IF;
END $$;