/*
  # Import Cusp Gemstones Data

  1. Data Import
    - Imports cusp gemstone data from CSV
    - Includes gemstone names and alignment details
    
  2. Security
    - Uses existing RLS policies on cusp_gemstones table
*/

-- Insert cusp gemstone data
INSERT INTO cusp_gemstones (cusp_name, dates, gemstone, alignment_detail) VALUES
('Aries–Taurus Cusp', 'Apr 16–22', 'Pyrope Garnet', 'Combines Aries'' fire and Taurus'' grounding with energetic passion and stabilizing strength. Enhances courage while anchoring ambition.'),
('Taurus–Gemini Cusp',   'May 17–23', 'Zircon (Blue or Champagne)', 'Supports Gemini''s quick-thinking mind and Taurus'' desire for harmony. Balances vibrancy with a steady, calming energy.'),
('Gemini–Cancer Cusp', 'Jun 17–23', 'Labradorite', 'Strengthens Cancer''s intuition and Gemini''s mental clarity. A mystical stone that enhances psychic gifts and emotional fluency.'),
('Cancer–Leo Cusp', 'Jul 19–25', 'Sunstone', 'Unites Leo''s vibrant confidence with Cancer''s sensitivity. Invites joy, warmth, and balanced emotional expression.'),
('Leo–Virgo Cusp', 'Aug 19–25', 'Iolite',  'Sharpens Virgo''s vision and tempers Leo''s boldness. A guiding stone for clarity, introspection, and wise self-expression.'),
('Virgo–Libra Cusp', 'Sep 19–25', 'Ametrine', 'A fusion crystal that mirrors this cusp''s union of intellect and aesthetic. Inspires balance between analysis and artistry.'),
('Libra–Scorpio Cusp', 'Oct 19–25', 'Kyanite', 'Balances Libra''s diplomacy with Scorpio''s emotional intensity. Promotes alignment, honesty, and spiritual courage.'),
('Scorpio–Sagittarius Cusp', 'Nov 18–24', 'Chrysoberyl (Cat''s Eye)', 'Activates Sagittarius'' vision and Scorpio''s depth. Offers sharp intuition and brave pursuit of truth and freedom.'),
('Sagittarius–Capricorn Cusp', 'Dec 18–24', 'Pietersite', 'Combines Sagittarius'' insight with Capricorn''s focus. Known as the ''Tempest Stone'', it stabilizes storms of growth and purpose.'),
('Capricorn–Aquarius Cusp', 'Jan 16–23', 'Larvikite', 'Grounds Aquarius'' innovation and Capricorn''s discipline. Shields energy while activating psychic and practical vision.'),
('Aquarius–Pisces Cusp', 'Feb 15–21', 'Kunzite', 'Softens Pisces'' emotional depth and uplif ts Aquarius'' ethereal ideas. Encourages gentle boundaries and heart-centered communication.'),
('Pisces–Aries Cusp', 'Mar 17–23', 'Fire Agate', 'Ignites Aries'' drive and grounds Pisces'' dreams. A fierce yet gentle stone of passion, protection, and creative awakening.')
ON CONFLICT (cusp_name) DO UPDATE SET
  dates =  EXCLUDED.dates,
  gemstone = EXCLUDED.gemstone,
  alignment_detail = EXCLUDED.alignment_detail,
  updated_at = now();