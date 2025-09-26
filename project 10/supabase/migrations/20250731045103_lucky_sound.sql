/*
  # Create astronomical data table

  1. New Tables
    - `astronomical_data`
      - `id` (text, primary key)
      - `date` (date)
      - `hemisphere` (text)
      - `moon_phase` (text)
      - `moon_illumination` (integer)
      - `events` (jsonb array)
      - `planetary_positions` (jsonb array)
      - `visible_constellations` (text array)
      - `source` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `astronomical_data` table
    - Add policy for public read access (astronomical data is public)
    - Add policy for service role to insert/update data
*/

CREATE TABLE IF NOT EXISTS astronomical_data (
  id text PRIMARY KEY,
  date date NOT NULL,
  hemisphere text NOT NULL CHECK (hemisphere IN ('Northern', 'Southern')),
  moon_phase text NOT NULL,
  moon_illumination integer NOT NULL CHECK (moon_illumination >= 0 AND moon_illumination <= 100),
  events jsonb DEFAULT '[]'::jsonb,
  planetary_positions jsonb DEFAULT '[]'::jsonb,
  visible_constellations text[] DEFAULT ARRAY[]::text[],
  source text NOT NULL CHECK (source IN ('NASA', 'ESA', 'ASA', 'CACHED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint for date + hemisphere combination
CREATE UNIQUE INDEX IF NOT EXISTS astronomical_data_date_hemisphere_idx 
  ON astronomical_data (date, hemisphere);

ALTER TABLE astronomical_data ENABLE ROW LEVEL SECURITY;

-- Public read access for astronomical data
CREATE POLICY "Public read access for astronomical data"
  ON astronomical_data
  FOR SELECT
  TO public
  USING (true);

-- Service role can insert and update astronomical data
CREATE POLICY "Service role can manage astronomical data"
  ON astronomical_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);