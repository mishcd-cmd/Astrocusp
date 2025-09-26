// Centralized Stripe configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
export const STRIPE_PRICE_MONTHLY = process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY ?? '';
export const STRIPE_PRICE_YEARLY = process.env.EXPO_PUBLIC_STRIPE_PRICE_YEARLY ?? '';
export const STRIPE_PRICE_CUSP_ONEOFF = process.env.EXPO_PUBLIC_STRIPE_PRICE_CUSP_ONEOFF ?? '';
export const STRIPE_MODE = process.env.EXPO_PUBLIC_STRIPE_MODE ?? 'test';

// Site URL for production
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.astrocusp.com.au';

// Helper to safely mask keys for logging
const mask = (v: string) => v ? `${v.slice(0,7)}…${v.slice(-4)}` : 'MISSING';

export const isStripeConfigured = (): boolean => {
  const configured = Boolean(
    STRIPE_PUBLISHABLE_KEY && 
    STRIPE_PRICE_MONTHLY && 
    STRIPE_PRICE_YEARLY &&
    STRIPE_PUBLISHABLE_KEY.startsWith('pk_') &&
    STRIPE_PRICE_MONTHLY.startsWith('price_') &&
    STRIPE_PRICE_YEARLY.startsWith('price_')
  );
  
  console.log('[Stripe] Configuration check result:', {
    hasPublishableKey: !!STRIPE_PUBLISHABLE_KEY,
    publishableKeyPrefix: STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
    hasMonthlyPrice: !!STRIPE_PRICE_MONTHLY,
    monthlyPricePrefix: STRIPE_PRICE_MONTHLY?.substring(0, 10),
    hasYearlyPrice: !!STRIPE_PRICE_YEARLY,
    yearlyPricePrefix: STRIPE_PRICE_YEARLY?.substring(0, 10),
    hasOneOffPrice: !!STRIPE_PRICE_CUSP_ONEOFF,
    mode: STRIPE_MODE,
    configured
  });
  
  if (!configured) {
    console.error('[Stripe] Configuration missing:', {
      missingPublishableKey: !STRIPE_PUBLISHABLE_KEY,
      missingMonthlyPrice: !STRIPE_PRICE_MONTHLY,
      missingYearlyPrice: !STRIPE_PRICE_YEARLY,
      invalidPublishableKey: STRIPE_PUBLISHABLE_KEY && !STRIPE_PUBLISHABLE_KEY.startsWith('pk_'),
      invalidMonthlyPrice: STRIPE_PRICE_MONTHLY && !STRIPE_PRICE_MONTHLY.startsWith('price_'),
      invalidYearlyPrice: STRIPE_PRICE_YEARLY && !STRIPE_PRICE_YEARLY.startsWith('price_'),
    });
  }
  
  return configured;
};

// Debug logging (only shows presence, not actual values)
if (typeof window !== 'undefined') {
  console.log('[Stripe config]', {
    mode: STRIPE_MODE,
    pk_prefix: STRIPE_PUBLISHABLE_KEY?.slice(0, 7),
    pk_masked: mask(STRIPE_PUBLISHABLE_KEY),
    isLive: STRIPE_MODE === 'live',
    price_ids: {
      monthly: STRIPE_PRICE_MONTHLY ? `${STRIPE_PRICE_MONTHLY.substring(0, 15)}...` : 'missing',
      yearly: STRIPE_PRICE_YEARLY ? `${STRIPE_PRICE_YEARLY.substring(0, 15)}...` : 'missing',
      oneOff: STRIPE_PRICE_CUSP_ONEOFF ? `${STRIPE_PRICE_CUSP_ONEOFF.substring(0, 15)}...` : 'missing',
    },
    siteUrl: SITE_URL,
  });
}

export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: string;
}

// Dynamic products based on environment variables
export const getSubscriptionProducts = (): StripeProduct[] => {
  if (!isStripeConfigured()) return [];
  
  return [
    {
      id: 'monthly-subscription',
      priceId: STRIPE_PRICE_MONTHLY,
      name: 'Astral Plane Monthly Subscription',
      description: 'Monthly access to premium horoscope features',
      mode: 'subscription',
      price: '$8.00 AUD'
    },
    {
      id: 'yearly-subscription', 
      priceId: STRIPE_PRICE_YEARLY,
      name: 'Astral Plane Subscription Yearly',
      description: 'Yearly access to premium horoscope features',
      mode: 'subscription',
      price: '$88.00 AUD'
    }
  ];
};

// One-time products
export const getOneTimeProducts = (): StripeProduct[] => {
  if (!STRIPE_PRICE_CUSP_ONEOFF) return [];
  
  return [
    {
      id: 'cusp-oneoff',
      priceId: STRIPE_PRICE_CUSP_ONEOFF,
      name: 'In Depth Cusp Horoscope Reading',
      description: 'One-time purchase for a comprehensive cusp analysis',
      mode: 'payment',
      price: '$360.00 AUD'
    }
  ];
};