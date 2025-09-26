// utils/signs.ts

/** -------- Slug (for URLs only) -------- */
export function slugifySign(input?: string): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/–|—/g, '-')      // normalize en/em dashes to hyphen
    .replace(/\s+/g, '-')      // spaces -> hyphen
    .replace(/[^a-z-]/g, '');  // strip anything else
}

/** -------- Coercion -------- */
export function coerceSign(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    return (
      value.cuspLabel || // prefer a label like "Aries–Taurus Cusp"
      value.cuspName  ||
      value.label     ||
      value.name      ||
      value.sign      ||
      value.value     ||
      ""
    );
  }
  return String(value);
}

/** -------- Default sign (prefer cusp) -------- */
export function getDefaultSignFromUserData(userData: any): string {
  console.log('🎯 [getDefaultSign] PRODUCTION DEBUG: Full userData object:', JSON.stringify(userData, null, 2));
  console.log('🎯 [getDefaultSign] PRODUCTION: Input userData summary:', {
    email: userData?.email,
    hasCuspResult: !!userData?.cuspResult,
    isOnCusp: userData?.cuspResult?.isOnCusp,
    cuspName: userData?.cuspResult?.cuspName,
    primarySign: userData?.cuspResult?.primarySign,
    secondarySign: userData?.cuspResult?.secondarySign,
    sunDegree: userData?.cuspResult?.sunDegree,
    description: userData?.cuspResult?.description,
  });
  
  console.log('🎯 [getDefaultSign] PRODUCTION DEBUG: Raw cuspResult object:', JSON.stringify(userData?.cuspResult, null, 2));
  
  // Use the new effective sign helper (no fallbacks)
  const { getEffectiveSign } = require('./effectiveSign');
  return getEffectiveSign(userData) || '';
}

/**
 * For DAILY horoscopes, prefer the full cusp identity.
 * For MONTHLY forecasts, you can choose to use primary or cusp.
 */
export function decideMonthlyTargetSign(user?: any, routeSign?: string, preferCusp: boolean = true): string {
  // if a route param explicitly says the sign (e.g. from sign details), trust it
  if (routeSign && typeof routeSign === 'string' && routeSign.trim()) {
    return routeSign.trim();
  }

  // For cusp users, prefer the full cusp identity unless specifically asking for primary
  if (preferCusp && user?.cuspResult?.cuspName) {
    return user.cuspResult.cuspName.trim();
  }
  
  // Otherwise use primary sign
  const primary = user?.cuspResult?.primarySign?.trim();
  if (primary) return primary;

  // final fallback to your existing resolver (may return a cusp label)
  return getDefaultSignFromUserData(user) || '';
}
/** -------- Normalize for DB (keeps cusp intact) -------- */
export function normalizeSignForDatabase(input: any): string {
  let s = coerceSign(input).trim();
  if (!s) return "";
  // unify dashes, trim whitespace
  s = s.replace(/[—–]/g, "-").replace(/\s+/g, " ");
  return s;
}

/** -------- Daily attempts: cusp first, then bases -------- */
export function buildDailySignAttempts(input: any): string[] {
  const s = normalizeSignForDatabase(input);
  if (!s) return [];

  if (s.toLowerCase().includes("cusp")) {
    // split on hyphen; tolerate fancy dashes
    const parts = s.replace(/[—–]/g, "-").split("-").map(p => p.trim());
    if (parts.length >= 2) {
      const a = parts[0];
      const b = parts[1].replace(/\s*cusp/i, "").trim(); // strip trailing "Cusp"
      return [s, `${a}–${b} Cusp`, `${a}-${b} Cusp`, a, b].filter(Boolean);
    }
    return [s];
  }

  return [s];
}

/** =========================================================
 *  HEMISPHERE — single source of truth for the DATABASE
 *  DB uses short codes: "NH" | "SH"
 *  ========================================================= */
export type HemisphereCode = "NH" | "SH";

/** Convert any app/user input to the DB code */
export function toDBHemisphere(input: any): HemisphereCode {
  const raw = String(input || "").toLowerCase();
  if (raw.startsWith("s")) return "SH";
  // default north
  return "NH";
}

/** Optional: pretty label for UI from the DB code */
export function hemisphereLabel(code: HemisphereCode): "Northern" | "Southern" {
  return code === "SH" ? "Southern" : "Northern";
}

/** Normalize hemisphere label the app uses */
export function normalizeHemisphereLabel(h: any): 'Northern' | 'Southern' {
  const v = String(h || '').trim().toLowerCase();
  if (v.startsWith('s')) return 'Southern';
  return 'Northern';
}

/** Try both long and short hemisphere styles, because data may be mixed */
export function hemisphereVariants(h: 'Northern' | 'Southern'): string[] {
  const code = h === 'Northern' ? 'NH' : 'SH';
  return [h, code]; // e.g., ['Southern', 'SH']
}
