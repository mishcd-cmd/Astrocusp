// utils/billing.ts
import { supabase } from '@/utils/supabase';
import { checkoutSubscription, checkoutOneTime, isStripeConfigured } from './stripe';
import { STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY, STRIPE_PRICE_CUSP_ONEOFF } from './stripeConfig';
import { SITE_URL } from './urls';

export type SubscriptionCheck = {
  active: boolean;
  reason?: string;                // 'no_session', 'edge_error', 'subscription_inactive', etc.
  source?: 'db' | 'stripe' | 'edge' | 'override' | 'none';
  status?: string;                // 'active', 'trialing', 'past_due', 'inactive', 'unknown'
  plan?: 'monthly' | 'yearly';
  price_id?: string;
  current_period_end?: number;
  // allow diagnostics or any extra props from the Edge Function
  [key: string]: any;
};

const SPECIAL_ACCOUNTS = new Set<string>([
  'mish.cd@gmail.com',
  'petermaricar@bigpond.com',
  'tsharna.kecek@gmail.com',
  'james.summerton@outlook.com',
  'xavier.cd@gmail.com',
  'xaviercd96@gmail.com',
  'adam.stead@techweave.co',      // ✅ VIP Account
  'michael.p.r.orourke@gmail.com', // ✅ VIP Account
]);

async function invokeStripeStatus(accessToken: string) {
  return supabase.functions.invoke('stripe-status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`, // ⬅️ STEP 4 (critical)
      'Content-Type': 'application/json',
    },
    body: {}, // no payload needed
  });
}

export async function hasActiveSubscription(): Promise<SubscriptionCheck> {
  try {
    console.log('🔍 [billing] Starting subscription check...');

    // 1) Ensure we have a session/token
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) console.warn('[billing] getSession error:', sessionErr);
    const accessToken = session?.access_token;
    if (!accessToken) {
      console.log('[billing] No session token, treating as not subscribed');
      return { active: false, reason: 'no_session', source: 'none', status: 'unknown' };
    }

    // 1a) Special account override (fast path)
    const userEmail = session.user?.email ?? '';
    if (userEmail && SPECIAL_ACCOUNTS.has(userEmail)) {
      console.log(`✅ [billing] Special account access granted: ${userEmail}`);
      return { active: true, reason: 'special_account', source: 'override', status: 'active' };
    }

    console.log('[billing] Session found, checking subscription status…');

    // 2) Call Edge Function (with a tiny retry if we ever hit a 401)
    let { data, error } = await invokeStripeStatus(accessToken);

    // If the function somehow 401s, try once more after refreshing the session
    if (error && (error as any)?.status === 401) {
      console.warn('[billing] stripe-status 401; retrying after session refresh…');
      await supabase.auth.getSession(); // poke the client to ensure fresh token
      const refreshedToken = (await supabase.auth.getSession()).data.session?.access_token ?? accessToken;
      ({ data, error } = await invokeStripeStatus(refreshedToken));
    }

    if (error) {
      console.warn('[billing] stripe-status error:', error);
      return { active: false, reason: 'edge_error', source: 'edge', status: 'unknown', edge_error: error.message ?? String(error) };
    }

    console.log('🔍 [billing] Stripe status response:', data);

    // 3) Single source of truth
    if (data?.active === true) {
      return { active: true, source: data.source ?? 'edge', status: data.status ?? 'active', ...data };
    }
    return { active: false, source: data?.source ?? 'edge', status: data?.status ?? 'inactive', ...data };
  } catch (e: any) {
    console.error('[billing] Status exception:', e?.message || e);
    return { active: false, reason: 'billing_exception', source: 'none', status: 'unknown' };
  }
}

// Back-compat alias used across the app
export async function getSubscriptionStatus() {
  return hasActiveSubscription();
}

/* ---------- Checkout helpers ---------- */

export async function subscribeMonthly(): Promise<void> {
  console.log('=== SUBSCRIBE MONTHLY ===');
  
  // Check authentication first
  const { getCurrentUser } = await import('./auth');
  const authUser = await getCurrentUser();
  
  if (!authUser) {
    throw new Error('Please sign in to subscribe');
  }
  
  console.log('User authenticated for monthly subscription:', authUser.email);
  
  // Check Stripe configuration first
  if (!isStripeConfigured()) {
    throw new Error('Payment system not configured. Please contact support.');
  }
  
  // Enhanced validation
  if (!STRIPE_PRICE_MONTHLY) throw new Error('Monthly subscription not configured');
  
  console.log('Monthly price ID:', STRIPE_PRICE_MONTHLY);

  const siteUrl = SITE_URL;
  const successUrl = `${siteUrl}/auth/success?type=subscription`;
  const cancelUrl = `${siteUrl}/(tabs)/settings`;
  
  console.log('Checkout URLs:', { successUrl, cancelUrl });

  await checkoutSubscription({
    priceId: STRIPE_PRICE_MONTHLY,
    successUrl,
    cancelUrl,
  });
}

export async function subscribeYearly(): Promise<void> {
  console.log('=== SUBSCRIBE YEARLY ===');
  
  // Check authentication first
  const { getCurrentUser } = await import('./auth');
  const authUser = await getCurrentUser();
  
  if (!authUser) {
    throw new Error('Please sign in to subscribe');
  }
  
  console.log('User authenticated for yearly subscription:', authUser.email);
  
  // Check Stripe configuration first
  if (!isStripeConfigured()) {
    throw new Error('Payment system not configured. Please contact support.');
  }
  
  if (!STRIPE_PRICE_YEARLY) throw new Error('Yearly subscription not configured');

  const siteUrl = SITE_URL;
  await checkoutSubscription({
    priceId: STRIPE_PRICE_YEARLY,
    successUrl: `${siteUrl}/auth/success?type=subscription`,
    cancelUrl: `${siteUrl}/(tabs)/settings`,
  });
}

export async function buyOneOffReading(): Promise<void> {
  console.log('=== BUY ONE-OFF READING ===');
  
  // Check authentication first
  const { getCurrentUser } = await import('./auth');
  const authUser = await getCurrentUser();
  
  if (!authUser) {
    throw new Error('Please sign in to purchase');
  }
  
  console.log('User authenticated for one-off purchase:', authUser.email);
  
  // Check Stripe configuration first
  if (!isStripeConfigured()) {
    throw new Error('Payment system not configured. Please contact support.');
  }
  
  if (!STRIPE_PRICE_CUSP_ONEOFF) throw new Error('One-off reading not configured');

  const siteUrl = SITE_URL;
  await checkoutOneTime({
    priceId: STRIPE_PRICE_CUSP_ONEOFF,
    successUrl: `${siteUrl}/auth/success?type=oneoff`,
    cancelUrl: `${siteUrl}/(tabs)/settings`,
  });
}

export async function upgradeToYearly(): Promise<{ message: string }> {
  console.log('=== UPGRADE TO YEARLY ===');
  await subscribeYearly();
  return { message: 'Redirecting to yearly subscription checkout...' };
}

export async function openStripePortal(): Promise<void> {
  console.log('=== OPEN STRIPE PORTAL ===');
  const siteUrl = SITE_URL;
  const { data, error } = await supabase.functions.invoke('stripe-portal', {
    body: { returnUrl: `${siteUrl}/settings/subscription` },
  });
  if (error) throw new Error(error.message || 'Failed to open billing portal');

  const url: string | undefined = (data as any)?.url;
  if (!url) throw new Error('No portal URL returned');

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    const Linking = await import('expo-linking');
    await Linking.openURL(url);
  }
}