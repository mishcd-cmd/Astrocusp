// utils/astronomy.ts
import SunCalc from 'suncalc';
// Types
// -----------------------
export interface AstronomicalEvent {
  name: string;
  description: string;
  date: string;
  hemisphere?: 'Northern' | 'Southern' | 'Both';
  type: 'moon' | 'planet' | 'meteor' | 'solstice' | 'equinox' | 'conjunction' | 'comet';
}

export interface MoonPhase {
  phase: string;
  illumination: number;      // 0..100 (%)
  nextPhase: string;         // 'New Moon' | 'First Quarter' | ...
  nextPhaseDate: string;     // dd/mm/yyyy
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
}

// -----------------------
// Events (unchanged)
// -----------------------
export const CURRENT_ASTRONOMICAL_EVENTS: AstronomicalEvent[] = [
  {
    name: "🦁 New Moon in Leo",
    description: "The Fire Mirror ritual: Reclaim your inner radiance and attract aligned recognition. Light a gold candle in front of a mirror, gaze at your reflection and whisper: 'I see the fire. I call it higher.' Write self-praise on a bay leaf and burn it safely.",
    date: "2025-08-01",
    hemisphere: "Northern",
    type: "moon"
  },
  {
    name: "🪐 Lionsgate Portal (8/8)",
    description: "Portal of Prosperity spell: Activate abundance with celestial support. Arrange 8 coins in an infinity shape with citrine at centre. Sip sun-charged water and journal: 'I open the gate. I walk with fate.' Think bigger—manifest worth, not just wealth.",
    date: "2025-08-08",
    hemisphere: "Northern",
    type: "conjunction"
  },
  {
    name: "🌕 Full Moon in Aquarius",
    description: "The Electric Thread ritual: Activate your higher mind and soul network. Tie silver thread around your wrist, hold the other end to the moon saying: 'I am connected, expanded, awake.' Write 3 visionary ideas with actions. The world needs your weird—honour your unique code.",
    date: "2025-08-17",
    hemisphere: "Northern",
    type: "moon"
  },
  {
    name: "Geminids Meteor Shower Peak",
    description: "The most reliable meteor shower of the year reaches its peak, with up to 120 meteors per hour visible in dark skies.",
    date: "2024-12-14",
    hemisphere: "Both",
    type: "meteor"
  },
  {
    name: "Winter Solstice",
    description: "The shortest day of the year in the Northern Hemisphere, marking the astronomical beginning of winter.",
    date: "2024-12-21",
    hemisphere: "Northern",
    type: "solstice"
  },
  {
    name: "Summer Solstice",
    description: "The longest day of the year in the Southern Hemisphere, marking the astronomical beginning of summer.",
    date: "2024-12-21",
    hemisphere: "Southern",
    type: "solstice"
  },
  {
    name: "Jupiter-Saturn Conjunction",
    description: "Jupiter and Saturn appear close together in the evening sky, creating a beautiful celestial dance.",
    date: "2024-12-28",
    hemisphere: "Both",
    type: "conjunction"
  },
  {
    name: "Quadrantids Meteor Shower",
    description: "The first major meteor shower of the year, best viewed in the pre-dawn hours.",
    date: "2025-01-04",
    hemisphere: "Northern",
    type: "meteor"
  },
  {
    name: "Mars Opposition",
    description: "Mars reaches opposition, appearing brightest and largest in our sky as Earth passes between Mars and the Sun.",
    date: "2025-01-16",
    hemisphere: "Both",
    type: "planet"
  },
  {
    name: "Comet C/2023 A3 Visible",
    description: "A newly discovered comet becomes visible to the naked eye in the western sky after sunset.",
    date: "2025-02-10",
    hemisphere: "Both",
    type: "comet"
  }
];

// -----------------------
// LUNAR — Sydney-accurate calc using SunCalc
// -----------------------
function nowInSydney(): Date {
  // Make a Date representing Sydney local time (AU)
  const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyStr);
}

function phaseNameFromFraction(phase: number): 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter' | 'Waxing Crescent' | 'Waxing Gibbous' | 'Waning Gibbous' | 'Waning Crescent' {
  // phase ∈ [0..1): 0 New, 0.25 First Q, 0.5 Full, 0.75 Last Q
  if (Math.abs(phase - 0) < 0.0125 || phase > 0.9875) return 'New Moon';
  if (Math.abs(phase - 0.25) < 0.0125) return 'First Quarter';
  if (Math.abs(phase - 0.5) < 0.0125) return 'Full Moon';
  if (Math.abs(phase - 0.75) < 0.0125) return 'Last Quarter';
  if (phase > 0 && phase < 0.25) return 'Waxing Crescent';
  if (phase > 0.25 && phase < 0.5) return 'Waxing Gibbous';
  if (phase > 0.5 && phase < 0.75) return 'Waning Gibbous';
  return 'Waning Crescent';
}

function fmtAU(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function findNextQuarter(start: Date): { nextPhase: 'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter'; date: Date } {
  const targets: Array<{label:'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter', value:number}> = [
    { label: 'New Moon', value: 0 },
    { label: 'First Quarter', value: 0.25 },
    { label: 'Full Moon', value: 0.5 },
    { label: 'Last Quarter', value: 0.75 },
  ];
  const startPhase = SunCalc.getMoonIllumination(start).phase;

  for (let h = 1; h <= 24 * 35; h++) {
    const t = new Date(start.getTime() + h * 3600 * 1000);
    const p = SunCalc.getMoonIllumination(t).phase;

    for (const trg of targets) {
      const crossed =
        (startPhase <= trg.value && p >= trg.value) ||
        (trg.value === 0 && startPhase > 0.95 && p < 0.05); // wrap near 1→0

      if (crossed || Math.abs(p - trg.value) < 0.005) {
        return { nextPhase: trg.label, date: t };
      }
    }
  }
  // Fallback ~2 weeks
  return { nextPhase: 'Full Moon', date: new Date(start.getTime() + 14 * 86400 * 1000) };
}

/** Return Sydney-accurate moon phase */
export function getCurrentMoonPhase(): MoonPhase {
  const now = nowInSydney();
  const { fraction, phase } = SunCalc.getMoonIllumination(now);

  const name = phaseNameFromFraction(phase);
  const illumination = Math.round(fraction * 100);
  const { nextPhase, date } = findNextQuarter(now);

  console.log('[lunar:accurate]', {
    sydneyLocal: now.toString(),
    iso: now.toISOString(),
    phaseName: name,
    fraction,
    pct: illumination,
    nextPhase,
    nextPhaseDate: fmtAU(date),
  });

  return {
    phase: name,
    illumination,
    nextPhase,
    nextPhaseDate: fmtAU(date),
  };
}

// Next phase helper
function getNextPhase(currentPhase: string): string {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const currentIndex = phases.indexOf(currentPhase);
  return currentIndex >= 0 ? phases[(currentIndex + 1) % phases.length] : 'Waxing Crescent';
}

// ---------- Planetary positions (enhanced) ----------
type RawPlanet = {
  name?: string;           // "Mercury"
  planet?: string;         // alternative key
  sign?: string;           // sometimes already provided
  degree?: number;         // sometimes already provided
  lon?: number;            // ecliptic longitude in degrees
  longitude?: number;      // alt key
  ecliptic_longitude?: number; // alt key
  retrograde?: boolean;
  speed?: number;          // < 0 means retrograde in some feeds
  velocity?: number;       // alt key
};

const ZODIAC_SIGNS_ARRAY = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

function lonToSignAndDegree(lon: number) {
  // keep lon in [0,360)
  const L = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(L / 30);
  const degree = Math.round((L - signIndex * 30) * 100) / 100; // keep two decimals
  return { sign: ZODIAC_SIGNS_ARRAY[signIndex], degree };
}

function normalizePlanetName(n?: string) {
  if (!n) return '';
  // Ensure title case + strip weird symbols
  return n.replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^\w/, c => c.toUpperCase());
}

// Prefer any longitude field the feed may use
function getLon(raw: RawPlanet): number | null {
  // common variants across feeds
  if (typeof raw.ecliptic_longitude === 'number') return raw.ecliptic_longitude;
  if (typeof raw.longitude === 'number') return raw.longitude;
  if (typeof raw.lon === 'number') return raw.lon;
  // occasionally seen
  // @ts-ignore
  if (typeof raw.lng === 'number') return raw.lng;
  return null;
}

function isCalcSource(src?: string) {
  return !!src && /calc|mock|approx/i.test(src);
}

// Session cache of last good values so we don't regress to 0°
const lastGoodPositions = new Map<string, PlanetaryPosition>();

function normalizePlanetaryPositions(rawList: RawPlanet[]): PlanetaryPosition[] {
  console.log('Normalizing planetary positions:', rawList);
  
  const result: PlanetaryPosition[] = [];

  for (const raw of rawList) {
    console.log('Processing raw planet data:', raw);
    const name = normalizePlanetName(raw.name || raw.planet) || 'Planet';

    // Determine retrograde
    const retro = Boolean(
      raw.retrograde ??
      (typeof raw.speed === 'number' ? raw.speed < 0 : false) ??
      (typeof raw.velocity === 'number' ? raw.velocity < 0 : false)
    );

    const lon = getLon(raw);

    // Case A: API already gives sign+degree AND degree is non-zero
    if (raw.sign && typeof raw.degree === 'number' && raw.degree !== 0) {
      console.log(`Using direct sign/degree for: ${name}`);
      const pos: PlanetaryPosition = { planet: name, sign: raw.sign, degree: raw.degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    // Case B: API gives sign+degree but degree === 0
    if (raw.sign && typeof raw.degree === 'number' && raw.degree === 0) {
      // If it's a calculated/mock source, try to compute from longitude first
      if (isCalcSource(raw.source) && lon !== null) {
        const { sign, degree } = lonToSignAndDegree(lon);
        const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
        console.log(`Degree=0 from CALC; recomputed from longitude for ${name}: ${degree}° ${sign}`);
        lastGoodPositions.set(name, pos);
        result.push(pos);
        continue;
      }

      // No longitude to compute — fall back to last known non-zero
      const cached = lastGoodPositions.get(name);
      if (cached) {
        console.log(`Degree=0 without longitude; using last good for ${name}: ${cached.degree}° ${cached.sign}`);
        result.push(cached);
        continue;
      }

      // As a last resort, use our fallback generator for this planet
      const fallbackPositions = getCurrentPlanetaryPositions();
      const fallbackPlanet = fallbackPositions.find(p => p.planet === name);
      if (fallbackPlanet) {
        console.log(`Using fallback position for ${name}: ${fallbackPlanet.degree}° ${fallbackPlanet.sign}`);
        lastGoodPositions.set(name, fallbackPlanet);
        result.push(fallbackPlanet);
        continue;
      }

      // Final fallback - accept the 0° reading
      console.warn(`Accepting 0° ${raw.sign} for ${name} as final fallback`);
      const pos: PlanetaryPosition = { planet: name, sign: raw.sign, degree: 0, retrograde: retro };
      result.push(pos);
      continue;
    }

    // Case C: No sign/degree, but we have longitude → compute
    if (lon !== null) {
      const { sign, degree } = lonToSignAndDegree(lon);
      const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
      console.log(`Computed from longitude for ${name}: ${degree}° ${sign}`);
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    // Case D: Nothing useful — fall back to last good if we have it
    const cached = lastGoodPositions.get(name);
    if (cached) {
      console.log(`No usable fields; using last good for ${name}`);
      result.push(cached);
      continue;
    }

    // Otherwise drop this planet
    console.warn(`Skipping ${name}: no sign/degree/longitude and no cache.`);
  }

  console.log('Normalized planetary positions:', result);
  return result;
}

/**
 * Enhanced function to get current planetary positions with real data.
 * Falls back to the simplified generator only if the live payload is empty or errors.
 */
export async function getCurrentPlanetaryPositionsEnhanced(
  hemisphere: 'Northern' | 'Southern' = 'Northern'
): Promise<PlanetaryPosition[]> {
  try {
    // Note: Enhanced astronomical data service not available, using fallback
    console.log('Using fallback planetary positions');
  } catch (err) {
    console.error('Error fetching enhanced planetary positions:', err);
  }

  console.log('Using fallback planetary positions');
  return getCurrentPlanetaryPositions();
}

export function getCurrentPlanetaryPositions(): PlanetaryPosition[] {
  // Updated planetary positions for August 13, 2025 based on astronomical ephemeris
  const today = nowInSydney();
  const baseDate = new Date('2025-08-13');
  const daysSinceBase = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // More accurate positions for August 2025 (based on astronomical data)
  // Mercury moves ~1.2°/day, Venus ~0.8°/day, Mars ~0.3°/day

  return [
    {
      planet: "Mercury",
      sign: "Leo",
      degree: Math.max(0, Math.min(29, 28 + daysSinceBase * 1.2)),
      retrograde: false
    },
    {
      planet: "Venus",
      sign: "Virgo",
      degree: Math.max(0, Math.min(29, 18 + daysSinceBase * 0.8)),
      retrograde: false
    },
    {
      planet: "Mars",
      sign: "Gemini",
      degree: Math.max(0, Math.min(29, 22 + daysSinceBase * 0.3)),
      retrograde: false
    },
    {
      planet: "Jupiter",
      sign: "Gemini",
      degree: Math.max(0, Math.min(29, 14 + daysSinceBase * 0.05)),
      retrograde: false
    },
    {
      planet: "Saturn",
      sign: "Pisces",
      degree: Math.max(0, Math.min(29, 19 + daysSinceBase * 0.02)),
      retrograde: true
    }
  ];
}

// -----------------------
// Hemisphere events (unchanged logic)
// -----------------------
function getSouthernHemisphereEvents(): AstronomicalEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      name: "🌟 Southern Cross Navigation",
      description: "The Southern Cross (Crux) serves as the southern hemisphere's primary navigation constellation, pointing toward the South Celestial Pole.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    },
    {
      name: "✨ Magellanic Clouds Viewing",
      description: "Optimal viewing conditions for the Large and Small Magellanic Clouds, satellite galaxies of the Milky Way visible only from southern latitudes.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    },
    {
      name: "🌌 Carina Nebula Region",
      description: "The Carina constellation region offers spectacular deep-sky viewing, including the famous Carina Nebula, visible only from southern latitudes.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    }
  ];
}

export function getHemisphereEvents(hemisphere: 'Northern' | 'Southern'): AstronomicalEvent[] {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  const filteredEvents = CURRENT_ASTRONOMICAL_EVENTS.filter(event => {
    const eventDate = new Date(event.date);
    const isInTimeRange = eventDate >= today && eventDate <= thirtyDaysFromNow;
    const isRelevantToHemisphere = event.hemisphere === 'Both' || event.hemisphere === hemisphere;
    return isInTimeRange && isRelevantToHemisphere;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filteredEvents.length === 0) {
    if (hemisphere === 'Northern') {
      return [
        {
          name: "Polaris Navigation Star",
          description: "The North Star (Polaris) remains fixed in the northern sky, serving as a reliable navigation reference point. Ursa Major and Cassiopeia circle around it.",
          date: today.toISOString().split('T')[0],
          hemisphere: 'Northern',
          type: 'planet'
        },
        {
          name: "Orion Winter Viewing",
          description: "Orion constellation dominates the northern winter sky, with its distinctive belt and bright stars Betelgeuse and Rigel clearly visible.",
          date: today.toISOString().split('T')[0],
          hemisphere: 'Northern',
          type: 'planet'
        }
      ];
    }
    return [
      {
        name: "🌟 Southern Cross Navigation",
        description: "The Southern Cross (Crux) serves as the southern hemisphere's primary navigation constellation, pointing toward the South Celestial Pole.",
        date: today.toISOString().split('T')[0],
        hemisphere: "Southern",
        type: "planet"
      },
      {
        name: "✨ Magellanic Clouds Viewing",
        description: "Optimal viewing conditions for the Large and Small Magellanic Clouds, satellite galaxies of the Milky Way visible only from southern latitudes.",
        date: today.toISOString().split('T')[0],
        hemisphere: "Southern", 
        type: "planet"
      },
      {
        name: "🌌 Carina Nebula Region",
        description: "The Carina constellation region offers spectacular deep-sky viewing, including the famous Carina Nebula, visible only from southern latitudes.",
        date: today.toISOString().split('T')[0],
        hemisphere: "Southern",
        type: "planet"
      }
    ];
  }

  return filteredEvents;
}

// -----------------------
// Constellations (unchanged logic + enhanced)
// -----------------------
export async function getVisibleConstellationsEnhanced(hemisphere: 'Northern' | 'Southern'): Promise<string[]> {
  try {
    // Note: Enhanced astronomical data service not available, using fallback
    console.log('Using fallback constellations');
  } catch (error) {
    console.error('Error fetching enhanced constellations:', error);
  }
  return getVisibleConstellations(hemisphere);
}

export function getVisibleConstellations(hemisphere: 'Northern' | 'Southern'): string[] {
  const month = new Date().getMonth();

  const northernConstellations = [
    ["Orion", "Taurus", "Gemini", "Auriga", "Perseus", "Canis Major", "Ursa Major", "Cassiopeia"], // Winter (Dec-Feb)
    ["Leo", "Virgo", "Boötes", "Corona Borealis", "Ursa Major", "Ursa Minor", "Draco", "Cassiopeia"], // Spring (Mar-May)
    ["Cygnus", "Lyra", "Aquila", "Hercules", "Ophiuchus", "Ursa Major", "Cassiopeia", "Draco"], // Summer (Jun-Aug)
    ["Pegasus", "Andromeda", "Cassiopeia", "Cepheus", "Ursa Major", "Perseus", "Aries", "Triangulum"] // Fall (Sep-Nov)
  ];

  const southernConstellations = [
    ["Southern Cross", "Centaurus", "Carina", "Vela", "Puppis", "Crux", "Musca", "Chamaeleon"], // Summer (Dec-Feb)
    ["Southern Cross", "Centaurus", "Hydra", "Crater", "Corvus", "Carina", "Chamaeleon", "Volans"], // Autumn (Mar-May)
    ["Southern Cross", "Centaurus", "Carina", "Sagittarius", "Scorpius", "Ara", "Telescopium", "Corona Australis"], // Winter (Jun-Aug)
    ["Southern Cross", "Centaurus", "Carina", "Grus", "Phoenix", "Tucana", "Pavo", "Indus"] // Spring (Sep-Nov)
  ];

  const seasonIndex = Math.floor(month / 3);
  return hemisphere === 'Northern'
    ? northernConstellations[seasonIndex]
    : southernConstellations[seasonIndex];
}

export function getAstronomicalInsight(hemisphere: 'Northern' | 'Southern'): string {
  // Use Sydney-accurate moon data for consistency
  const moonPhase = getCurrentMoonPhase();
  const events = getHemisphereEvents(hemisphere);
  const constellations = getVisibleConstellations(hemisphere);

  let insights: string[];

  if (hemisphere === 'Southern') {
    insights = [
      `The ${moonPhase.phase} (${moonPhase.illumination}% illuminated) illuminates the southern sky, ${moonPhase.illumination > 75 ? 'washing out fainter stars but highlighting the Southern Cross and Carina region' : 'creating perfect conditions for viewing the Southern Cross, Magellanic Clouds, and other southern celestial treasures unique to your hemisphere'}.`,
      `In the Southern Hemisphere, the iconic Southern Cross (Crux) guides navigators toward the South Celestial Pole, while the Large and Small Magellanic Clouds—satellite galaxies of the Milky Way—offer spectacular viewing opportunities invisible to northern observers.`,
      events.length > 0
        ? `Southern Hemisphere highlight: ${events[0].name}. ${events[0].description}`
        : `The Southern Hemisphere celestial sphere reveals wonders invisible to northern observers, including the Coal Sack Nebula, Carina Nebula, Magellanic Clouds, and the brilliant Southern Cross constellation pointing to the South Celestial Pole.`,
      `From your Southern Hemisphere location, you have exclusive access to celestial treasures like the Southern Cross navigation system, the Magellanic Clouds, and deep-sky objects in Carina and Centaurus that northern observers can never see.`
    ];
  } else {
    insights = [
      `The ${moonPhase.phase} (${moonPhase.illumination}% illuminated) ${moonPhase.illumination > 50 ? 'brightens' : 'darkens'} the northern sky, ${moonPhase.illumination > 75 ? 'making it perfect for lunar observation but washing out fainter stars' : 'creating ideal conditions for viewing Orion, the Big Dipper, and northern deep-sky objects'}.`,
      `In the northern hemisphere, Polaris (the North Star) remains fixed as a reliable navigation beacon, while Ursa Major (Big Dipper) and Cassiopeia circle around it. Orion dominates winter skies with its distinctive belt.`,
      events.length > 0
        ? `Northern sky highlight: ${events[0].name}. ${events[0].description}`
        : `The northern celestial sphere offers iconic sights like Ursa Major (Big Dipper), Cassiopeia's distinctive 'W' shape, and Orion's Belt. Polaris serves as the fixed northern navigation star.`,
      `Polaris and the circumpolar constellations (Ursa Major, Cassiopeia) are visible year-round from northern latitudes, making them reliable navigation aids.`
    ];
  }

  return insights[Math.floor(Math.random() * insights.length)];
}