// utils/astronomy.ts
// Works with Vite + React. No process.env; uses import.meta.env.VITE_NASA_API_KEY.

import SunCalc from 'suncalc';

// ───────────────────────────────────────────────────────────────────────────────
// ENV (public) — set VITE_NASA_API_KEY in your host/build environment
// ───────────────────────────────────────────────────────────────────────────────
const NASA_KEY = import.meta.env?.VITE_NASA_API_KEY ?? '';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface AstronomicalEvent {
  name: string;
  description: string;
  date: string; // ISO YYYY-MM-DD
  hemisphere?: 'Northern' | 'Southern' | 'Both';
  type: 'moon' | 'planet' | 'meteor' | 'solstice' | 'equinox' | 'conjunction' | 'comet';
}

export interface MoonPhase {
  phase: string;
  illumination: number; // 0..100 (%)
  nextPhase: string; // Next named phase
  nextPhaseDate: string; // dd/mm/yyyy (AU style for your app)
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number; // 0..29.xx
  retrograde: boolean;
}

export interface ApodResult {
  title: string;
  date: string; // YYYY-MM-DD
  mediaType: 'image' | 'video' | 'other';
  url: string;
  hdurl?: string;
  thumbnailUrl?: string;
  copyright?: string;
  explanation?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers (generic)
// ───────────────────────────────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);
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

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ───────────────────────────────────────────────────────────────────────────────
// NASA — Astronomy Picture of the Day (APOD)
// ───────────────────────────────────────────────────────────────────────────────
export async function getApod(date?: string): Promise<ApodResult | null> {
  try {
    if (!isNonEmptyString(NASA_KEY)) {
      console.warn('[APOD] Missing VITE_NASA_API_KEY — returning null.');
      return null;
    }

    const qs = new URLSearchParams({
      api_key: NASA_KEY,
      thumbs: 'true',
    });
    if (isNonEmptyString(date)) qs.set('date', date); // YYYY-MM-DD

    const data = await fetchJSON<any>(`https://api.nasa.gov/planetary/apod?${qs.toString()}`);

    const mediaType: ApodResult['mediaType'] =
      data.media_type === 'image' ? 'image' :
      data.media_type === 'video' ? 'video' : 'other';

    const result: ApodResult = {
      title: isNonEmptyString(data.title) ? data.title : 'Astronomy Picture of the Day',
      date: isNonEmptyString(data.date) ? data.date : todayISO(),
      mediaType,
      url: isNonEmptyString(data.url) ? data.url : '',
      hdurl: isNonEmptyString(data.hdurl) ? data.hdurl : undefined,
      thumbnailUrl: isNonEmptyString(data.thumbnail_url) ? data.thumbnail_url : undefined,
      copyright: isNonEmptyString(data.copyright) ? data.copyright : undefined,
      explanation: isNonEmptyString(data.explanation) ? data.explanation : undefined,
    };

    if (mediaType === 'video' && !result.thumbnailUrl) {
      result.thumbnailUrl = result.url;
    }

    return result;
  } catch (err) {
    console.error('[APOD] Failed to fetch:', err);
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Curated events (you can adjust dates/descriptions as needed)
// ───────────────────────────────────────────────────────────────────────────────
export const CURRENT_ASTRONOMICAL_EVENTS: AstronomicalEvent[] = [
  {
    name: '🦁 New Moon in Leo',
    description:
      "The Fire Mirror ritual: Reclaim your inner radiance and attract aligned recognition. Light a gold candle, gaze in a mirror and whisper: 'I see the fire. I call it higher.'",
    date: '2025-08-01',
    hemisphere: 'Northern',
    type: 'moon',
  },
  {
    name: '🪐 Lionsgate Portal (8/8)',
    description:
      "Portal of Prosperity spell: Arrange 8 coins in an infinity shape with citrine at centre. Say: 'I open the gate. I walk with fate.'",
    date: '2025-08-08',
    hemisphere: 'Northern',
    type: 'conjunction',
  },
  {
    name: '🌕 Full Moon in Aquarius',
    description:
      "The Electric Thread ritual: Tie silver thread around your wrist and declare: 'I am connected, expanded, awake.' Write 3 visionary actions.",
    date: '2025-08-17',
    hemisphere: 'Northern',
    type: 'moon',
  },
  {
    name: 'Geminids Meteor Shower Peak',
    description:
      'The most reliable meteor shower of the year, with up to 120 meteors/hour in dark skies.',
    date: '2024-12-14',
    hemisphere: 'Both',
    type: 'meteor',
  },
  {
    name: 'Winter Solstice',
    description:
      'The shortest day in the Northern Hemisphere, marking the start of winter.',
    date: '2024-12-21',
    hemisphere: 'Northern',
    type: 'solstice',
  },
  {
    name: 'Summer Solstice',
    description:
      'The longest day in the Southern Hemisphere, marking the start of summer.',
    date: '2024-12-21',
    hemisphere: 'Southern',
    type: 'solstice',
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Lunar phase (Sydney-anchored calc using SunCalc)
// ───────────────────────────────────────────────────────────────────────────────
function nowInSydney(): Date {
  // Avoids timezone math issues on client devices
  const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyStr);
}

function phaseNameFromFraction(
  phase: number
):
  | 'New Moon'
  | 'First Quarter'
  | 'Full Moon'
  | 'Last Quarter'
  | 'Waxing Crescent'
  | 'Waxing Gibbous'
  | 'Waning Gibbous'
  | 'Waning Crescent' {
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

function findNextQuarter(start: Date): { nextPhase: MoonPhase['nextPhase']; date: Date } {
  const targets: Array<{ label: MoonPhase['nextPhase']; value: number }> = [
    { label: 'New Moon', value: 0 },
    { label: 'First Quarter', value: 0.25 },
    { label: 'Full Moon', value: 0.5 },
    { label: 'Last Quarter', value: 0.75 },
  ];

  const startPhase = SunCalc.getMoonIllumination(start).phase;

  // Step hour by hour up to ~35 days
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
  // Fail-safe
  return { nextPhase: 'Full Moon', date: new Date(start.getTime() + 14 * 86400 * 1000) };
}

export function getCurrentMoonPhase(): MoonPhase {
  const now = nowInSydney();
  const { fraction, phase } = SunCalc.getMoonIllumination(now);
  const name = phaseNameFromFraction(phase);
  const illumination = Math.round(fraction * 100);
  const { nextPhase, date } = findNextQuarter(now);

  // Optional debug:
  // console.log('[lunar:accurate]', { now: now.toISOString(), name, illumination, nextPhase, next: fmtAU(date) });

  return { phase: name, illumination, nextPhase, nextPhaseDate: fmtAU(date) };
}

// ───────────────────────────────────────────────────────────────────────────────
// Planetary positions — fallback/approx (safe for UI; replace when you add a live feed)
// ───────────────────────────────────────────────────────────────────────────────
type RawPlanet = {
  name?: string;
  planet?: string;
  sign?: string;
  degree?: number;
  lon?: number;
  longitude?: number;
  ecliptic_longitude?: number;
  retrograde?: boolean;
  speed?: number;
  velocity?: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  source?: string;
};

const ZODIAC_SIGNS_ARRAY = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function lonToSignAndDegree(lon: number) {
  const L = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(L / 30);
  const degree = Math.round((L - signIndex * 30) * 100) / 100;
  return { sign: ZODIAC_SIGNS_ARRAY[signIndex], degree };
}

function normalizePlanetName(n?: string) {
  if (!n) return '';
  return n.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function getLon(raw: RawPlanet): number | null {
  if (typeof raw.ecliptic_longitude === 'number') return raw.ecliptic_longitude;
  if (typeof raw.longitude === 'number') return raw.longitude;
  if (typeof raw.lon === 'number') return raw.lon;
  // @ts-ignore
  if (typeof (raw as any).lng === 'number') return (raw as any).lng;
  return null;
}

const lastGoodPositions = new Map<string, PlanetaryPosition>();

function normalizePlanetaryPositions(rawList: RawPlanet[]): PlanetaryPosition[] {
  const result: PlanetaryPosition[] = [];

  for (const raw of rawList) {
    const name = normalizePlanetName(raw.name || raw.planet) || 'Planet';
    const retro =
      Boolean(raw.retrograde) ||
      (typeof raw.speed === 'number' ? raw.speed < 0 : false) ||
      (typeof raw.velocity === 'number' ? raw.velocity < 0 : false);

    const lon = getLon(raw);

    // Prefer explicit sign+degree
    if (raw.sign && typeof raw.degree === 'number' && raw.degree !== 0) {
      const pos: PlanetaryPosition = { planet: name, sign: raw.sign, degree: raw.degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    // If sign provided but degree 0 and we have longitude, compute degree
    if (raw.sign && typeof raw.degree === 'number' && raw.degree === 0 && lon !== null) {
      const { sign, degree } = lonToSignAndDegree(lon);
      const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    // If longitude only
    if (lon !== null) {
      const { sign, degree } = lonToSignAndDegree(lon);
      const pos: PlanetaryPosition = { planet: name, sign, degree, retrograde: retro };
      lastGoodPositions.set(name, pos);
      result.push(pos);
      continue;
    }

    // Fallback to last known
    const cached = lastGoodPositions.get(name);
    if (cached) {
      result.push(cached);
      continue;
    }
  }

  return result;
}

// Placeholder live-positions hook (currently falls back)
export async function getCurrentPlanetaryPositionsEnhanced(
  hemisphere: 'Northern' | 'Southern' = 'Northern'
): Promise<PlanetaryPosition[]> {
  // When you wire a live source like TheSkyLive (server-side proxy), transform it with normalizePlanetaryPositions()
  // For now, return fallback:
  return getCurrentPlanetaryPositions();
}

// Simple, deterministic fallback (keeps UI happy)
export function getCurrentPlanetaryPositions(): PlanetaryPosition[] {
  const today = nowInSydney();
  const baseDate = new Date('2025-08-13T00:00:00Z');
  const daysSinceBase = Math.max(
    0,
    Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Lightweight linear motion just for display; replace with live data when available.
  return [
    { planet: 'Mercury',  sign: 'Leo',     degree: Math.min(29.99, 28 + daysSinceBase * 1.2),  retrograde: false },
    { planet: 'Venus',    sign: 'Virgo',   degree: Math.min(29.99, 18 + daysSinceBase * 0.8),  retrograde: false },
    { planet: 'Mars',     sign: 'Gemini',  degree: Math.min(29.99, 22 + daysSinceBase * 0.3),  retrograde: false },
    { planet: 'Jupiter',  sign: 'Gemini',  degree: Math.min(29.99, 14 + daysSinceBase * 0.05), retrograde: false },
    { planet: 'Saturn',   sign: 'Pisces',  degree: Math.min(29.99, 19 + daysSinceBase * 0.02), retrograde: true  },
  ];
}

// ───────────────────────────────────────────────────────────────────────────────
// Hemisphere events (fallback lists if curated window is empty)
// ───────────────────────────────────────────────────────────────────────────────
function getSouthernHemisphereEvents(): AstronomicalEvent[] {
  const today = todayISO();
  return [
    {
      name: '🌟 Southern Cross Navigation',
      description:
        "The Southern Cross (Crux) points toward the South Celestial Pole — a classic southern sky guide.",
      date: today,
      hemisphere: 'Southern',
      type: 'planet',
    },
    {
      name: '✨ Magellanic Clouds Viewing',
      description:
        'Look for the Large & Small Magellanic Clouds — satellite galaxies of the Milky Way, visible only from the south.',
      date: today,
      hemisphere: 'Southern',
      type: 'planet',
    },
    {
      name: '🌌 Carina Nebula Region',
      description:
        'Deep-sky showpiece in Carina; rich star fields unique to southern latitudes.',
      date: today,
      hemisphere: 'Southern',
      type: 'planet',
    },
  ];
}

export function getHemisphereEvents(hemisphere: 'Northern' | 'Southern'): AstronomicalEvent[] {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const filtered = CURRENT_ASTRONOMICAL_EVENTS.filter(evt => {
    const d = new Date(evt.date);
    const timeOk = d >= today && d <= thirtyDaysFromNow;
    const hemiOk = evt.hemisphere === 'Both' || evt.hemisphere === hemisphere;
    return timeOk && hemiOk;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filtered.length) return filtered;

  if (hemisphere === 'Northern') {
    return [
      {
        name: 'Polaris Navigation Star',
        description:
          'Polaris (North Star) remains fixed in the north; Ursa Major & Cassiopeia wheel around it.',
        date: todayISO(),
        hemisphere: 'Northern',
        type: 'planet',
      },
      {
        name: 'Orion Winter Viewing',
        description:
          'Orion dominates colder months — bright Betelgeuse & Rigel mark the shoulders and foot.',
        date: todayISO(),
        hemisphere: 'Northern',
        type: 'planet',
      },
    ];
  }
  return getSouthernHemisphereEvents();
}

// ───────────────────────────────────────────────────────────────────────────────
// Constellations (seasonal fallback)
// ───────────────────────────────────────────────────────────────────────────────
export function getVisibleConstellations(hemisphere: 'Northern' | 'Southern'): string[] {
  const month = new Date().getMonth(); // 0..11
  const seasonIndex = Math.floor(month / 3); // 0..3

  const northern = [
    ['Orion', 'Taurus', 'Gemini', 'Auriga', 'Perseus', 'Canis Major', 'Ursa Major', 'Cassiopeia'], // Dec-Feb
    ['Leo', 'Virgo', 'Boötes', 'Corona Borealis', 'Ursa Major', 'Ursa Minor', 'Draco', 'Cassiopeia'], // Mar-May
    ['Cygnus', 'Lyra', 'Aquila', 'Hercules', 'Ophiuchus', 'Ursa Major', 'Cassiopeia', 'Draco'], // Jun-Aug
    ['Pegasus', 'Andromeda', 'Cassiopeia', 'Cepheus', 'Ursa Major', 'Perseus', 'Aries', 'Triangulum'], // Sep-Nov
  ];

  const southern = [
    ['Southern Cross', 'Centaurus', 'Carina', 'Vela', 'Puppis', 'Crux', 'Musca', 'Chamaeleon'], // Dec-Feb
    ['Southern Cross', 'Centaurus', 'Hydra', 'Crater', 'Corvus', 'Carina', 'Chamaeleon', 'Volans'], // Mar-May
    ['Southern Cross', 'Centaurus', 'Carina', 'Sagittarius', 'Scorpius', 'Ara', 'Telescopium', 'Corona Australis'], // Jun-Aug
    ['Southern Cross', 'Centaurus', 'Carina', 'Grus', 'Phoenix', 'Tucana', 'Pavo', 'Indus'], // Sep-Nov
  ];

  return hemisphere === 'Northern' ? northern[seasonIndex] : southern[seasonIndex];
}

export async function getVisibleConstellationsEnhanced(
  hemisphere: 'Northern' | 'Southern'
): Promise<string[]> {
  // Placeholder for a live catalogue — returns fallback for now.
  return getVisibleConstellations(hemisphere);
}

// ───────────────────────────────────────────────────────────────────────────────
// Insight + APOD bundle
// ───────────────────────────────────────────────────────────────────────────────
export function getAstronomicalInsight(hemisphere: 'Northern' | 'Southern'): string {
  const moon = getCurrentMoonPhase();
  const events = getHemisphereEvents(hemisphere);
  const constellations = getVisibleConstellations(hemisphere);

  // Pick one of a few nicely-worded insights
  const pool: string[] =
    hemisphere === 'Southern'
      ? [
          `The ${moon.phase} (${moon.illumination}% illuminated) paints the southern sky ${
            moon.illumination > 75
              ? 'with bright lunar light — perfect for moon-gazing, though faint nebulae may fade'
              : 'dark enough to reveal the Southern Cross and Magellanic Clouds in crisp relief'
          }.`,
          events.length
            ? `Southern sky highlight: ${events[0].name}. ${events[0].description}`
            : 'Look for the Southern Cross (Crux) and the Magellanic Clouds — treasures unique to southern latitudes.',
          `Seasonal constellations on show: ${constellations.join(', ')}.`,
        ]
      : [
          `The ${moon.phase} (${moon.illumination}% illuminated) ${
            moon.illumination > 60 ? 'brightens' : 'deepens'
          } northern skies — ${
            moon.illumination > 75
              ? 'lunar details pop while faint galaxies recede'
              : 'a good window for Orion’s nebulae and the Andromeda Galaxy'
          }.`,
          events.length
            ? `Northern sky highlight: ${events[0].name}. ${events[0].description}`
            : 'Polaris holds steady while Ursa Major and Cassiopeia wheel around it — classic northern sky markers.',
          `Seasonal constellations on show: ${constellations.join(', ')}.`,
        ];

  return pool[Math.floor(Math.random() * pool.length)];
}

export async function getAstronomicalInsightWithApod(
  hemisphere: 'Northern' | 'Southern',
  apodDate?: string
): Promise<{ insight: string; apod: ApodResult | null }> {
  const insight = getAstronomicalInsight(hemisphere);
  const apod = await getApod(apodDate);
  return { insight, apod };
}
