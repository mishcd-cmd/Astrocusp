/*
  # Create user profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `birth_date` (timestamptz)
      - `birth_time` (text)
      - `birth_location` (text)
      - `hemisphere` (text)
      - `cusp_result` (jsonb)
      - `created_at` (timestamptz)
      - `last_login_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  birth_date timestamptz NOT NULL,
  birth_time text NOT NULL,
  birth_location text NOT NULL,
  hemisphere text NOT NULL CHECK (hemisphere IN ('Northern', 'Southern')),
  cusp_result jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);