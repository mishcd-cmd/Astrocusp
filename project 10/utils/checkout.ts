import { STRIPE_PRICE_CUSP_ONEOFF, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } from './stripeConfig';
import { checkoutSubscription, checkoutOneTime } from './stripe';
import { Platform } from 'react-native';
import { SITE_URL } from './urls';

export async function checkoutSubscriptionPlan(plan: 'monthly' | 'yearly'): Promise<void> {
  try {
    console.log('=== CHECKOUT SUBSCRIPTION PLAN ===', { plan });
    
    // Check Stripe configuration first
    const { isStripeConfigured } = await import('./stripe');
    if (!isStripeConfigured()) {
      throw new Error('Payment system not configured. Please contact support.');
    }
    
    const priceId = plan === 'monthly' ? STRIPE_PRICE_MONTHLY : STRIPE_PRICE_YEARLY;
    
    console.log('Price ID for plan:', { plan, priceId });
    
    if (!priceId) {
      throw new Error(`${plan} plan not configured`);
    }

    // Check if user is authenticated
    const { getCurrentUser } = await import('./auth');
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      throw new Error('Please sign in to subscribe.');
    }

    console.log('User authenticated:', authUser.email);

    const siteUrl = SITE_URL;
    const successUrl = `${siteUrl}/auth/success?type=subscription`;
    const cancelUrl = `${siteUrl}/subscription`;

    console.log('Calling checkoutSubscription with:', { priceId, successUrl, cancelUrl });

    await checkoutSubscription({
      priceId,
      successUrl,
      cancelUrl,
    });
  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    throw error;
  }
}

export async function checkoutOneOffCusp(): Promise<void> {
  try {
    console.log('=== CHECKOUT ONE-OFF CUSP READING ===');
    
    // Check Stripe configuration first
    const { isStripeConfigured } = await import('./stripe');
    if (!isStripeConfigured()) {
      throw new Error('Payment system not configured. Please contact support.');
    }
    
    if (!STRIPE_PRICE_CUSP_ONEOFF) {
      throw new Error('One-off cusp reading not configured');
    }

    // Check if user is authenticated
    const { getCurrentUser } = await import('./auth');
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      throw new Error('Please sign in to purchase.');
    }

    console.log('User authenticated for one-off purchase:', authUser.email);

    const siteUrl = SITE_URL;
    const successUrl = `${siteUrl}/auth/success?type=oneoff`;
    const cancelUrl = `${siteUrl}/subscription`;

    console.log('Calling checkoutOneTime with:', { priceId: STRIPE_PRICE_CUSP_ONEOFF, successUrl, cancelUrl });

    await checkoutOneTime({
      priceId: STRIPE_PRICE_CUSP_ONEOFF,
      successUrl,
      cancelUrl,
    });
  } catch (error: any) {
    console.error('One-off checkout error:', error);
    throw error;
  }
}