// utils/liveSky.ts
//
// Live sky events normalized for the Astrology screen.
// - ISS flyovers via N2YO (if EXPO_PUBLIC_N2YO_API_KEY + coords available)
// - Meteor showers from a small built-in calendar
//
// Usage (both work):
//   getLiveSkyEvents({ hemisphere: 'Northern' })
//   getLiveSkyEvents({ hemisphere: 'Southern', lat: -33.87, lon: 151.21, city: 'Sydney', country: 'AU' })
//
// Env:
//   EXPO_PUBLIC_N2YO_API_KEY=<your key>

import { Platform } from 'react-native';

export type LiveSkyEvent = {
  kind: 'iss' | 'meteor' | 'planet' | 'other';
  title: string;
  time?: string;        // "Sat 08:11 → Sat 08:17"
  direction?: string;   // "NW → SE"
  magnitude?: number;   // -3.2 (lower is brighter)
  notes?: string;       // freeform
};

export type GetLiveSkyArgs = {
  hemisphere: 'Northern' | 'Southern';
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
};

const N2YO_SAT_ID_ISS = 25544;
const N2YO_BASE = 'https://api.n2yo.com/rest/v1/satellite';
const N2YO_TIMEOUT_MS = 8000;

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      v => { clearTimeout(id); resolve(v); },
      e => { clearTimeout(id); reject(e); }
    );
  });
}

function fmtLocal(dt: Date) {
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
  });
}
function jsDateFromEpochSec(sec: number) {
  return new Date(sec * 1000);
}

/* ---------------- ISS (N2YO) ---------------- */

async function getISSVisualPasses(args: {
  lat: number;
  lon: number;
  alt?: number;          // meters
  days?: number;         // 1–10
  minVisibility?: number;// seconds (duration >=)
}): Promise<LiveSkyEvent[]> {
  const key = process.env.EXPO_PUBLIC_N2YO_API_KEY || '';
  if (!key) {
    return [{
      kind: 'iss',
      title: 'ISS: enable live predictions',
      notes: 'Add EXPO_PUBLIC_N2YO_API_KEY to use live ISS flyovers. Until then, try spotthestation.nasa.gov.',
    }];
  }

  const lat = args.lat;
  const lon = args.lon;
  const alt = Math.max(0, Math.min(Math.round(args.alt ?? 50), 3000));
  const days = Math.max(1, Math.min(args.days ?? 1, 10));
  const minVis = Math.max(0, Math.min(args.minVisibility ?? 60, 600));

  const url = `${N2YO_BASE}/visualpasses/${N2YO_SAT_ID_ISS}/${lat}/${lon}/${alt}/${days}/${minVis}/&apiKey=${encodeURIComponent(key)}`;

  try {
    const r = await timeout(fetch(url), N2YO_TIMEOUT_MS);
    if (!r.ok) throw new Error(`N2YO HTTP ${r.status}`);
    const json = await r.json();

    const passes: any[] = Array.isArray(json.passes) ? json.passes : [];
    if (!passes.length) {
      return [{
        kind: 'iss',
        title: 'No ISS passes soon',
        notes: 'No bright ISS flyovers predicted in the next day for your sky.',
      }];
    }

    return passes.slice(0, 2).map((p: any) => {
      const start = jsDateFromEpochSec(p.startUTC ?? p.startUTCtime ?? p.startUTCtimeStamp ?? p.startUTCDate ?? p.startUTC);
      const end   = jsDateFromEpochSec(p.endUTC   ?? p.endUTCtime   ?? p.endUTCtimeStamp   ?? p.endUTCDate   ?? p.endUTC);
      const time  = `${fmtLocal(start)} → ${fmtLocal(end)}`;
      const mag   = typeof p.mag === 'number' ? p.mag : undefined;

      // N2YO sometimes gives azimuths; if present map to a rough direction label
      let direction: string | undefined;
      const azStart = p.startAz ?? p.startAzimuth;
      const azEnd   = p.endAz ?? p.endAzimuth;
      if (typeof azStart === 'number' && typeof azEnd === 'number') {
        direction = `${azToCardinal(azStart)} → ${azToCardinal(azEnd)}`;
      }

      const dur = typeof p.duration === 'number' ? ` (~${Math.round(p.duration)}s)` : '';
      return {
        kind: 'iss',
        title: 'ISS pass',
        time,
        direction,
        magnitude: mag,
        notes: `Steady bright “star” drifting across the sky${dur}.`,
      };
    });
  } catch (e: any) {
    const why = e?.message || 'network';
    const tip = Platform.OS === 'web'
      ? 'Preview browsers may block this API; consider a small proxy function.'
      : 'Network problem fetching ISS.';
    return [{
      kind: 'iss',
      title: 'ISS data unavailable',
      notes: `Couldn’t fetch ISS passes (${why}). ${tip}`,
    }];
  }
}

function azToCardinal(az: number) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.round(((az % 360) / 22.5)) % 16;
  return dirs[idx];
}

/* --------------- Meteor showers (static calendar) --------------- */

type Shower = {
  id: string;
  name: string;
  start: string; // MM-DD
  peak: string;  // MM-DD
  end: string;   // MM-DD
  radiant: 'N' | 'S' | 'Both';
  zhr: number;
  url?: string;
};

const SHOWERS: Shower[] = [
  { id: 'qua', name: 'Quadrantids',  start: '01-01', peak: '01-03', end: '01-05', radiant: 'N',    zhr: 110, url: 'https://www.imo.net/viewing-the-quadrantids-meteor-shower/' },
  { id: 'lya', name: 'Lyrids',       start: '04-14', peak: '04-22', end: '04-30', radiant: 'N',    zhr: 18,  url: 'https://www.imo.net/viewing-the-lyrids-meteor-shower/' },
  { id: 'eta', name: 'Eta Aquariids',start: '04-19', peak: '05-06', end: '05-28', radiant: 'S',    zhr: 50,  url: 'https://www.imo.net/viewing-the-eta-aquariids-meteor-shower/' },
  { id: 'per', name: 'Perseids',     start: '07-17', peak: '08-12', end: '08-24', radiant: 'N',    zhr: 100, url: 'https://www.imo.net/viewing-the-perseids-meteor-shower/' },
  { id: 'dra', name: 'Draconids',    start: '10-06', peak: '10-08', end: '10-10', radiant: 'N',    zhr: 10,  url: 'https://www.imo.net/viewing-the-draconids-meteor-shower/' },
  { id: 'ori', name: 'Orionids',     start: '10-02', peak: '10-21', end: '11-07', radiant: 'Both', zhr: 20,  url: 'https://www.imo.net/viewing-the-orionids-meteor-shower/' },
  { id: 'lea', name: 'Leonids',      start: '11-06', peak: '11-17', end: '11-30', radiant: 'Both', zhr: 15,  url: 'https://www.imo.net/viewing-the-leonids-meteor-shower/' },
  { id: 'gem', name: 'Geminids',     start: '12-04', peak: '12-14', end: '12-17', radiant: 'Both', zhr: 150, url: 'https://www.imo.net/viewing-the-geminids-meteor-shower/' },
  { id: 'urs', name: 'Ursids',       start: '12-17', peak: '12-22', end: '12-26', radiant: 'N',    zhr: 10,  url: 'https://www.imo.net/viewing-the-ursids-meteor-shower/' },
];

function toThisYear(mmdd: string, year: number) {
  const [m, d] = mmdd.split('-').map(n => parseInt(n, 10));
  return new Date(year, m - 1, d, 2, 0, 0, 0);
}
function inWindow(now: Date, start: Date, end: Date) {
  return now >= start && now <= end;
}
function hemiWeight(h: 'Northern' | 'Southern', s: Shower) {
  if (s.radiant === 'Both') return 1;
  if (s.radiant === 'N') return h === 'Northern' ? 1 : 0.6;
  return h === 'Southern' ? 1 : 0.6;
}

function buildMeteorEvents(h: 'Northern' | 'Southern', city?: string, country?: string): LiveSkyEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const where = city ? ` for ${city}${country ? ', ' + country : ''}` : '';

  const list: LiveSkyEvent[] = [];

  for (const s of SHOWERS) {
    const start = toThisYear(s.start, y);
    const peak  = toThisYear(s.peak, y);
    const end   = toThisYear(s.end, y);
    const soon  = Math.abs(+peak - +now) <= 20 * 24 * 3600 * 1000;

    if (inWindow(now, start, end) || soon) {
      const bias = hemiWeight(h, s) >= 1 ? '' : ' (lower in your sky)';
      list.push({
        kind: 'meteor',
        title: `${s.name}${bias}`,
        time: `Peak: ${peak.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        notes: `Active ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}${where}. Best after midnight; ZHR ~${s.zhr}.`,
      });
    }
  }

  list.sort((a, b) => {
    const sa = SHOWERS.find(x => a.title.startsWith(x.name))!;
    const sb = SHOWERS.find(x => b.title.startsWith(x.name))!;
    return +toThisYear(sa.peak, y) - +toThisYear(sb.peak, y);
  });

  return list.slice(0, 3);
}

/* ---------------- Public API ---------------- */

export async function getLiveSkyEvents(args: GetLiveSkyArgs): Promise<LiveSkyEvent[]> {
  const { hemisphere, lat, lon, city, country } = args;

  const issPromise: Promise<LiveSkyEvent[]> =
    typeof lat === 'number' && typeof lon === 'number'
      ? getISSVisualPasses({ lat, lon, alt: 50, days: 1, minVisibility: 60 })
      : Promise.resolve([{
          kind: 'iss',
          title: 'ISS: add a location to enable passes',
          notes: 'Provide lat/lon to show precise ISS flyovers for your sky.',
        }]);

  const meteors = buildMeteorEvents(hemisphere, city, country);

  const settled = await Promise.allSettled([issPromise, Promise.resolve(meteors)]);
  const out: LiveSkyEvent[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') out.push(...s.value);
  }

  if (!out.length) {
    out.push({
      kind: 'other',
      title: 'Check the night sky',
      notes: 'Live sky data is currently unavailable. Try again later.',
    });
  }
  return out;
}
