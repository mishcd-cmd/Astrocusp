/*
  # Create horoscope cache table

  1. New Tables
    - `horoscope_cache`
      - `id` (uuid, primary key)
      - `date` (date)
      - `sign` (text)
      - `hemisphere` (text)
      - `daily_horoscope` (text)
      - `affirmation` (text)
      - `deeper_insight` (text)
      - `mystic_opening` (text)
      - `celestial_insight` (text)
      - `monthly_forecast` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
  
  2. Security
    - Enable RLS on `horoscope_cache` table
    - Add policy for public read access
    - Add policy for service role to manage cache
*/

CREATE TABLE IF NOT EXISTS horoscope_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  sign text NOT NULL,
  hemisphere text NOT NULL CHECK (hemisphere IN ('Northern', 'Southern')),
  daily_horoscope text NOT NULL,
  affirmation text,
  deeper_insight text,
  mystic_opening text,
  celestial_insight text,
  monthly_forecast text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Create unique constraint for date + sign + hemisphere combination
CREATE UNIQUE INDEX IF NOT EXISTS horoscope_cache_date_sign_hemisphere_idx 
  ON horoscope_cache (date, sign, hemisphere);

-- Create index for efficient cleanup of expired entries
CREATE INDEX IF NOT EXISTS horoscope_cache_expires_at_idx 
  ON horoscope_cache (expires_at);

ALTER TABLE horoscope_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for horoscope cache
CREATE POLICY "Public read access for horoscope cache"
  ON horoscope_cache
  FOR SELECT
  TO public
  USING (expires_at > now());

-- Service role can manage horoscope cache
CREATE POLICY "Service role can manage horoscope cache"
  ON horoscope_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired horoscope entries
CREATE OR REPLACE FUNCTION cleanup_expired_horoscopes()
RETURNS void AS $$
BEGIN
  DELETE FROM horoscope_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (this will need to be set up in Supabase dashboard)
-- SELECT cron.schedule('cleanup-expired-horoscopes', '0 2 * * *', 'SELECT cleanup_expired_horoscopes();');