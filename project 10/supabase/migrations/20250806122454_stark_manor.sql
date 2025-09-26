/*
  # Create cusp gemstones table

  1. New Tables
    - `cusp_gemstones`
      - `id` (uuid, primary key)
      - `cusp_name` (text, unique)
      - `dates` (text)
      - `gemstone` (text)
      - `alignment_detail` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `cusp_gemstones` table
    - Add policy for public read access
    - Add policy for service role management
*/

CREATE TABLE IF NOT EXISTS cusp_gemstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cusp_name text UNIQUE NOT NULL,
  dates text NOT NULL,
  gemstone text NOT NULL,
  alignment_detail text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cusp_gemstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for cusp gemstones"
  ON cusp_gemstones
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage cu sp gemstones"
  ON cusp_gemstones
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert the cusp gemstone data
INSERT INTO cusp_gemstones (cusp_name, dates, gemstone, alignment_detail) VALUES
('Aries–Taurus (Cusp of Power)', 'Apr 16–22', 'Pyr ope Garnet', 'Combines Aries'' fire and Taurus'' grounding with energetic passion and stabilizing strength. Enhances courage while anchoring ambition.'),
('Taurus–Gemini (Cusp of Energy)', 'May 17–23', 'Zircon (Blue or Champagne)', 'Supports Gemini''s quick-thinking mind and Taurus'' desire for harmony. Balances vibrancy with a steady, calming energy.'),
('Gemini–Cancer (Cusp of Magic)', 'Jun 17–23', 'Labradorite', 'Strengthens Cancer''s intuition and Gemini''s mental clarity. A mystical stone that enhances psychic gifts and emotional fluency.'),
('Cancer–Leo (Cusp of Oscillation)', 'Jul 19–25', 'Sunstone', 'Unites Leo''s vibrant confidence with Cancer''s sensitivity. Invites joy, warmth, and balanced emotional expression.'),
('Leo–Virgo (Cusp of Exposure)', 'Aug 19–25', 'Iolite', 'Sharpens Virgo''s vision and tempers Leo''s boldness. A guiding stone for clarity, introsp ection, and wise self-expression.'),
('Virgo–Libra (Cusp of Beauty)', 'Sep 19–25', 'Ametrine', 'A fusion crystal that mirrors this cusp''s union of intellect and aesthetic. Inspires balance between analysis and artistry.'),
('Libra–Scorpio (Cusp of Drama)', 'Oct 19–25', 'Kyan ite', 'Balances Libra''s diplomacy with Scorpio''s emotional intensity. Promotes alignment, honesty, and spiritual courage.'),
('Scorpio–Sagittarius (Cusp of Revolution)', 'Nov 18–24', 'Chrysoberyl (Cat''s Eye)', 'Activates Sagittarius'' vision and Scorpio''s depth. Offers sharp intuition and brave pursuit of truth and freedom.'),
('Sagittarius–Capricorn (Cusp of Prophecy)', 'Dec 18–24', 'Pietersite', 'Combines Sagittarius'' insight with Capricorn''s focus. Known as the ''Tempest Stone'', it stabilizes storms of growth and purpose.'),
('Capricorn–Aquarius (Cusp of Mystery)', '  Jan 16–23', 'Larvikite', 'Grounds Aquarius'' innovation and Capricorn''s discipline. Shields energy while activating psychic and practical vision.'),
('Aquarius–Pisces (Cusp of Sensitivity)', 'Feb 15–21', 'Kunzite', 'Softens Pisces'' emotional depth and uplifts Aquarius'' ethereal ideas.  Encourages gentle boundaries and heart-centered communication.'),
('Pisces–Aries (Cusp of Rebirth)', 'Mar 17–23', 'Fire Agate', 'Ignites Aries'' drive and grounds Pisces'' dreams. A fierce yet gentle stone of passion, protection, and creative awakening.');