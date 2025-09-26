/*
  # Fix birth date timezone conversion issue

  1. Problem
    - Birth dates are stored as timestamps with timezone (e.g., 1997-06-17 14:00:00+00)
    - This causes timezone conversion issues where June 18th becomes June 17th
    - Birth dates should be stored as simple dates without time components

  2. Solution
    - Convert birth_date column from timestamptz to date
    - Extract just the date part from existing timestamps
    - This prevents timezone conversion issues

  3. Changes
    - Update all existing birth_date values to extract date part only
    - Change column type from timestamptz to date
*/

-- First, update existing data to extract just the date part
-- This handles the timezone conversion by taking the date in the original timezone
UPDATE user_profiles 
SET birth_date = (birth_date AT TIME ZONE 'UTC')::date
WHERE birth_date IS NOT NULL;

-- Now change the column type to date to prevent future timezone issues
ALTER TABLE user_profiles 
ALTER COLUMN birth_date TYPE date 
USING birth_date::date;