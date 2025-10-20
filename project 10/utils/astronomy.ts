// src/utils/astronomy.ts
import SunCalc from 'suncalc';

// If you want NASA APOD later, set this in your hosting env (optional).
const NASA_KEY = import.meta?.env?.EXPO_PUBLIC_NASA_API_KEY ?? '';

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

export interface ApodResult {
  title: string;
  date: string;
  mediaType: 'image' | 'video' | 'other';
  url: string;
  hdurl?: string;
  thumbnailUrl?: string;
  copyright?: string;
  explanation?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Small helpers
// ───────────────────────────────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 10000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt || 'Request failed'}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function fmtAU(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function nowInSydney(): Date {
  const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyStr);
}

// ───────────────────────────────────────────────────────────────────────────────
// NASA APOD (optional)
// ───────────────────────────────────────────────────────────────────────────────
export async function getApod(date?: string): Promise<ApodResult | null> {
  try {
    if (!NASA_KEY) {
      console.warn('[APOD] Missing EXPO_PUBLIC_NASA_API_KEY — skipping.');
      return null;
    }
    const qs = new URLSearchParams({ api_key: NASA_KEY, thumbs: 'true' });
    if (date) qs.set('date', date);
    const data = await fetchJSON<any>(`https://api.nasa.gov/planetary/apod?${qs.toString()}`, {
      timeoutMs: 12000,
    });
    const mediaType = data.media_type === 'image' ? 'image' : data.media_type === 'video' ? 'video' : 'other';
    const result: ApodResult = {
      title: data.title || 'Astronomy Picture of the Day',
      date: data.date || new Date().toISOString().slice(0, 10),
      mediaType,
      url: data.url || '',
      hdurl: data.hdurl || undefined,
      thumbnailUrl: data.thumbnail_url || data.url || undefined,
      copyright: data.copyright || undefined,
      explanation: data.explanation || undefined,
    };
    return result;
  } catch (err) {
    console.error('[APOD] Failed to fetch:', err);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Events (sample content with sane fallbacks)
// ───────────────────────────────────────────────────────────────────────────────
export const CURRENT_ASTRONOMICAL_EVENTS: AstronomicalEvent[] = [
  {
    name: "Geminids Meteor Shower Peak",
    description: "The most reliable meteor shower of the year peaks under dark skies.",
    date: "2024-12-14",
    hemisphere: "Both",
    type: "meteor"
  },
  {
    name: "Winter Solstice",
    description: "Shortest day (Northern Hemisphere) — astronomical start of winter.",
    date: "2024-12-21",
    hemisphere: "Northern",
    type: "solstice"
  },
  {
    name: "Summer Solstice",
    description: "Longest day (Southern Hemisphere) — astronomical start of summer.",
    date: "2024-12-21",
    hemisphere: "Southern",
    type: "solstice"
  }
];

// ───────────────────────────────────────────────────────────────────────────────
// LUNAR — accurate phase using SunCalc
// ───────────────────────────────────────────────────────────────────────────────
function phaseNameFromFraction(phase: number):
  'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter' |
  'Waxing Crescent' | 'Waxing Gibbous' | 'Waning Gibbous' | 'Waning Crescent' {
  if (Math.abs(phase - 0) < 0.0125 || phase > 0.9875) return 'New Moon';
  if (Math.abs(phase - 0.25) < 0.0125) return 'First Quarter';
  if (Math.abs(phase - 0.5) < 0.0125) return 'Full Moon';
  if (Math.abs(phase - 0.75) < 0.0125) return 'Last Quarter';
  if (phase > 0 && phase < 0.25) return 'Waxing Crescent';
  if (phase > 0.25 && phase < 0.5) return 'Waxing Gibbous';
  if (phase > 0.5 && phase < 0.75) return 'Waning Gibbous';
  return 'Waning Crescent';
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
        (trg.value === 0 && startPhase > 0.95 && p < 0.05);
      if (crossed || Math.abs(p - trg.value) < 0.005) {
        return { nextPhase: trg.label, date: t };
      }
    }
  }
  // fallback: ~2 weeks ahead
  return { nextPhase: 'Full Moon', date: new Date(start.getTime() + 14 * 86400 * 1000) };
}

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

// ───────────────────────────────────────────────────────────────────────────────
// Planetary positions — simple fallback (upgrade later to astronomy-engine)
// ───────────────────────────────────────────────────────────────────────────────
const ZODIAC_SIGNS_ARRAY = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

export function getCurrentPlanetaryPositions(): PlanetaryPosition[] {
  // simple deterministic fallback; replace later with astronomy-engine if desired
  const today = nowInSydney();
  const baseDate = new Date('2025-08-13');
  const daysSinceBase = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  const clampDeg = (x: number) => Math.max(0, Math.min(29, x % 30));

  return [
    { planet: "Mercury",  sign: "Leo",        degree: clampDeg(28 + daysSinceBase * 1.2),  retrograde: false },
    { planet: "Venus",    sign: "Virgo",      degree: clampDeg(18 + daysSinceBase * 0.8),  retrograde: false },
    { planet: "Mars",     sign: "Gemini",     degree: clampDeg(22 + daysSinceBase * 0.3),  retrograde: false },
    { planet: "Jupiter",  sign: "Gemini",     degree: clampDeg(14 + daysSinceBase * 0.05), retrograde: false },
    { planet: "Saturn",   sign: "Pisces",     degree: clampDeg(19 + daysSinceBase * 0.02), retrograde: true  },
  ];
}

// ───────────────────────────────────────────────────────────────────────────────
// Hemisphere events/constellations (with fallbacks)
// ───────────────────────────────────────────────────────────────────────────────
function getSouthernHemisphereEvents(): AstronomicalEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      name: "🌟 Southern Cross Navigation",
      description: "Crux points toward the South Celestial Pole — prime southern sky marker.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    },
    {
      name: "✨ Magellanic Clouds Viewing",
      description: "The LMC & SMC are bright dwarf galaxies visible only from the south.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet'
    }
  ];
}

export function getHemisphereEvents(hemisphere: 'Northern' | 'Southern'): AstronomicalEvent[] {
  const today = new Date();
  const thirty = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

  const filtered = CURRENT_ASTRONOMICAL_EVENTS.filter(e => {
    const d = new Date(e.date);
    const inRange = d >= today && d <= thirty;
    const hemiOk = e.hemisphere === 'Both' || e.hemisphere === hemisphere;
    return inRange && hemiOk;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filtered.length === 0) {
    return hemisphere === 'Northern'
      ? [{
          name: "Polaris Navigation Star",
          description: "Polaris stays fixed in the north; Ursa Major & Cassiopeia circle around it.",
          date: today.toISOString().split('T')[0],
          hemisphere: 'Northern',
          type: 'planet'
        }]
      : getSouthernHemisphereEvents();
  }
  return filtered;
}

export function getVisibleConstellations(hemisphere: 'Northern' | 'Southern'): string[] {
  const month = new Date().getMonth();
  const northern = [
    ["Orion","Taurus","Gemini","Auriga","Perseus","Canis Major","Ursa Major","Cassiopeia"],   // Dec-Feb
    ["Leo","Virgo","Boötes","Corona Borealis","Ursa Major","Ursa Minor","Draco","Cassiopeia"],// Mar-May
    ["Cygnus","Lyra","Aquila","Hercules","Ophiuchus","Ursa Major","Cassiopeia","Draco"],      // Jun-Aug
    ["Pegasus","Andromeda","Cassiopeia","Cepheus","Ursa Major","Perseus","Aries","Triangulum"]// Sep-Nov
  ];
  const southern = [
    ["Southern Cross","Centaurus","Carina","Vela","Puppis","Crux","Musca","Chamaeleon"],      // Dec-Feb
    ["Southern Cross","Centaurus","Hydra","Crater","Corvus","Carina","Chamaeleon","Volans"],  // Mar-May
    ["Southern Cross","Centaurus","Carina","Sagittarius","Scorpius","Ara","Telescopium","Corona Australis"], // Jun-Aug
    ["Southern Cross","Centaurus","Carina","Grus","Phoenix","Tucana","Pavo","Indus"]          // Sep-Nov
  ];
  const seasonIndex = Math.floor(month / 3);
  return hemisphere === 'Northern' ? northern[seasonIndex] : southern[seasonIndex];
}

export function getAstronomicalInsight(hemisphere: 'Northern' | 'Southern'): string {
  const moon = getCurrentMoonPhase();
  const events = getHemisphereEvents(hemisphere);
  const constellations = getVisibleConstellations(hemisphere);

  const sample = hemisphere === 'Southern'
    ? [
        `The ${moon.phase} (${moon.illumination}% illuminated) favors views of the Southern Cross and Magellanic Clouds.`,
        events[0] ? `Southern highlight: ${events[0].name}. ${events[0].description}` :
                    `Southern sky treat: Crux points the way; LMC/SMC glow on dark nights.`,
        `Constellations now: ${constellations.slice(0,4).join(', ')}.`
      ]
    : [
        `The ${moon.phase} (${moon.illumination}% illuminated) ${moon.illumination > 50 ? 'brightens' : 'darkens'} the northern sky.`,
        events[0] ? `Northern highlight: ${events[0].name}. ${events[0].description}` :
                    `Polaris stays fixed as a navigation beacon; Orion and the Dipper frame the season.`,
        `Constellations now: ${constellations.slice(0,4).join(', ')}.`
      ];

  return sample[Math.floor(Math.random() * sample.length)];
}

export async function getAstronomicalInsightWithApod(
  hemisphere: 'Northern' | 'Southern',
  apodDate?: string
): Promise<{ insight: string; apod: ApodResult | null }> {
  const insight = getAstronomicalInsight(hemisphere);
  const apod = await getApod(apodDate);
  return { insight, apod };
}
