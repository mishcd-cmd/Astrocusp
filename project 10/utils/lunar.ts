// utils/lunar.ts
import SunCalc from 'suncalc';

export type HemLabel = 'Northern' | 'Southern';

function nowInSydney(): Date {
  // Create a Date representing *Sydney's* current local time
  // (JS Date stores UTC internally; this trick shifts to the target TZ)
  const sydneyNowStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  return new Date(sydneyNowStr);
}

function phaseName(phase: number): { name: string; key: 'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter'|'Waxing Crescent'|'Waxing Gibbous'|'Waning Gibbous'|'Waning Crescent' } {
  // phase in [0..1): 0 New, 0.25 First Quarter, 0.5 Full, 0.75 Last Quarter
  if (phase === 0) return { name: 'New Moon', key: 'New Moon' };
  if (Math.abs(phase - 0.25) < 0.0125) return { name: 'First Quarter', key: 'First Quarter' };
  if (Math.abs(phase - 0.5) < 0.0125) return { name: 'Full Moon', key: 'Full Moon' };
  if (Math.abs(phase - 0.75) < 0.0125) return { name: 'Last Quarter', key: 'Last Quarter' };

  if (phase > 0 && phase < 0.25) return { name: 'Waxing Crescent', key: 'Waxing Crescent' };
  if (phase > 0.25 && phase < 0.5) return { name: 'Waxing Gibbous', key: 'Waxing Gibbous' };
  if (phase > 0.5 && phase < 0.75) return { name: 'Waning Gibbous', key: 'Waning Gibbous' };
  // phase >= 0.75 && < 1
  return { name: 'Waning Crescent', key: 'Waning Crescent' };
}

function fmtDateAU(d: Date): string {
  // dd/mm/yyyy for your UI (“20/08/2025”)
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function findNextMajorPhase(start: Date): { nextPhase: 'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter'; date: Date } {
  // March forward to the next quarter within ~30 days
  // We look for phase crossing near 0, 0.25, 0.5, 0.75
  const targets: Array<{label:'New Moon'|'First Quarter'|'Full Moon'|'Last Quarter', value:number}> = [
    { label: 'New Moon', value: 0 },
    { label: 'First Quarter', value: 0.25 },
    { label: 'Full Moon', value: 0.5 },
    { label: 'Last Quarter', value: 0.75 },
  ];

  const startIll = SunCalc.getMoonIllumination(start);
  const currentPhase = startIll.phase; // 0..1

  // try hourly steps to catch exact day/time more precisely
  const maxHours = 24 * 35; // safety
  for (let h = 1; h <= maxHours; h++) {
    const d = new Date(start.getTime() + h * 3600 * 1000);
    const p = SunCalc.getMoonIllumination(d).phase;

    for (const t of targets) {
      // detect when we cross a target from below to close match
      const crossed =
        (currentPhase <= t.value && p >= t.value) ||
        (t.value === 0 && currentPhase > 0.95 && p < 0.05); // wrap-around near new moon

      if (crossed || Math.abs(p - t.value) < 0.005) {
        return { nextPhase: t.label, date: d };
      }
    }
  }
  // fallback: Full Moon in ~2 weeks (rarely used)
  return { nextPhase: 'Full Moon', date: new Date(start.getTime() + 14 * 86400 * 1000) };
}

/**
 * Returns robust lunar data using Sydney local time.
 * Illumination is global; hemisphere only affects icon/orientation, not %.
 */
export function getLunarNow(hemisphere: HemLabel) {
  const now = nowInSydney();
  const { fraction, phase } = SunCalc.getMoonIllumination(now);
  const name = phaseName(phase);

  // Percent illumination (rounded to nearest whole)
  const illuminationPct = Math.round(fraction * 100);

  const { nextPhase, date } = findNextMajorPhase(now);

  return {
    phase: name.name,                  // e.g., "Waning Gibbous"
    illumination: illuminationPct,     // e.g., 86
    nextPhase,
    nextPhaseDate: fmtDateAU(date),    // e.g., "20/08/2025"
    hemisphere,                        // keep for UI orientation
    timestampSydneyISO: now.toISOString(),
  };
}