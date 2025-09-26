const isBrowser = typeof window !== 'undefined';

// Prefer env (set this in prod), fallback to window on dev only
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
  (isBrowser ? window.location.origin : '');

// Build absolute redirects
export function absoluteRedirect(path = '/auth/callback') {
  const base = SITE_URL || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

// Helper to check if we're in a sandbox environment
export function isSandboxEnvironment(): boolean {
  return isBrowser && (
    window.location.hostname.includes('webcontainer-api.io') ||
    window.location.hostname.includes('stackblitz.io') ||
    window.location.hostname.includes('bolt.host')
  );
}

// Safe navigation helper that prevents sandbox URL issues
export function safeNavigate(url: string): void {
  if (isSandboxEnvironment() && url.includes('webcontainer-api.io')) {
    console.warn('Prevented navigation to sandbox URL:', url);
    return;
  }
  
  if (isBrowser) {
    window.location.href = url;
  }
}