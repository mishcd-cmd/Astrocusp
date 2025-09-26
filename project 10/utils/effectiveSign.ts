import { UserProfile } from './userData';

export function normalizeSignLabel(label?: string): string | undefined {
  if (!label) return undefined;
  return label
    .replace(/\s*V\d+\s*$/i, '')      // drop " V3" suffixes
    .replace(/[–—]/g, '-')            // normalize dashes
    .trim();
}

/** Highest-priority: route param (if passed separately).
 * Otherwise: cuspName (if on cusp) → primarySign → undefined (NO Aries fallback) */
export function getEffectiveSign(user?: UserProfile | null, routeSign?: string): string | undefined {
  const fromRoute = normalizeSignLabel(routeSign);
  if (fromRoute) return fromRoute;

  const cr = user?.cuspResult;
  if (!cr) return undefined;

  if (cr.isOnCusp && cr.cuspName) return normalizeSignLabel(cr.cuspName);
  if (cr.primarySign) return normalizeSignLabel(cr.primarySign);
  return undefined;
}