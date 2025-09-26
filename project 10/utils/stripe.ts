import { supabase } from './supabase';
import { isStripeConfigured, getSubscriptionProducts, type StripeProduct } from './stripeConfig';
import { Platform } from 'react-native';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

import { SITE_URL, safeNavigate } from './urls';

// Re-export for convenience
export { isStripeConfigured } from './stripeConfig';

export interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface OrderData {
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

// Improved checkout function using Supabase Functions SDK
export async function checkoutSubscription({
  priceId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  console.log('=== START CHECKOUT ===', { priceId, successUrl, cancelUrl });

  // Check if Stripe is configured before attempting checkout
  if (!isStripeConfigured()) {
    console.error('Stripe configuration check failed');
    throw new Error('Stripe is not properly configured. Please check your environment variables.');
  }
  
  console.log('Stripe configuration verified');
  
  // Enhanced session check
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Authentication error. Please sign in again.');
  }
  
  if (!session) {
    console.error('No active session found');
    throw new Error('Please sign in to continue.');
  }
  
  console.log('Session verified for user:', session.user?.email);

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { 
      priceId, 
      successUrl,
      cancelUrl,
      mode: 'subscription'
    },
  });

  if (error) {
    // Enhanced error logging to see what the function returned
    console.error('Stripe checkout function error:', {
      message: error.message,
      name: error.name,
      status: (error as any)?.context?.response?.status,
      body: (error as any)?.context?.response?.error,
      fullError: error,
    });
    
    // More specific error handling
    if (error.message?.includes('Authentication')) {
      throw new Error('Please sign in and try again');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again');
    } else {
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  // Expect function to return { url: "https://checkout.stripe.com/..." }
  const url: string | undefined = (data as any)?.url;
  if (!url) {
    console.error('No checkout URL from function. Full payload:', data);
    throw new Error('No checkout URL returned from payment processor');
  }

  console.log('Opening checkout URL:', url.substring(0, 50) + '...');
  
  // Handle URL opening based on platform
  if (Platform.OS === 'web') {
    console.log('Opening checkout in new window (web)');
    // Use window.open for better compatibility across browsers
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Fallback if popup blocked
      window.location.href = url;
    }
  } else {
    console.log('Opening checkout with Expo Linking (mobile)');
    
    // Add delay before opening URL to ensure UI is ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const Linking = await import('expo-linking');
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      console.log('Mobile: Can open URL?', canOpen);
      
      if (canOpen) {
        await Linking.openURL(url);
        console.log('Mobile: Successfully opened checkout URL');
      } else {
        console.error('Mobile: Cannot open checkout URL');
        throw new Error('Cannot open payment page on this device. Please try again or use a different device.');
      }
    } catch (linkingError: any) {
      console.error('Mobile: Linking error:', linkingError);
      
      throw new Error('Failed to open payment page. Please try again.');
    }
  }
}

// One-time payment checkout
export async function checkoutOneTime({
  priceId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}) {
  console.log('=== START ONE-TIME CHECKOUT ===', { priceId, successUrl, cancelUrl });

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: { 
      priceId, 
      successUrl,
      cancelUrl,
      mode: 'payment' // Specify one-time payment mode
    },
  });

  if (error) {
    // Enhanced error logging to see what the function returned
    console.error('One-time checkout error:', {
      message: error.message,
      name: error.name,
      status: (error as any)?.context?.response?.status,
      body: (error as any)?.context?.response?.error,
      fullError: error,
    });
    throw new Error(error.message || 'Failed to create one-time checkout session');
  }

  // Expect function to return { url: "https://checkout.stripe.com/..." }
  const url: string | undefined = (data as any)?.url;
  if (!url) {
    console.error('No checkout URL from one-time function. Full payload:', data);
    throw new Error('No checkout URL returned from payment processor');
  }

  console.log('Opening one-time checkout URL:', url);
  
  // Handle URL opening based on platform
  if (Platform.OS === 'web') {
    console.log('Opening one-time checkout (web)');
    // Use window.open for better compatibility
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Fallback if popup blocked
      window.location.href = url;
    }
  } else {
    console.log('Opening one-time checkout (mobile)');
    const Linking = await import('expo-linking');
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Cannot open payment page on this device.');
      }
    } catch (linkingError: any) {
      console.error('Mobile: One-time checkout linking error:', linkingError);
      throw new Error('Failed to open payment page. Please try again.');
    }
  }
}

// Legacy function for backward compatibility
export async function createCheckoutSession(
  priceId: string,
  mode: 'payment' | 'subscription',
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId?: string; url?: string; error?: string }> {
  try {
    console.log('=== CREATING CHECKOUT SESSION ===', { priceId, mode });
    
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return { error: 'Stripe is not configured. Please set up your Stripe keys in the environment variables.' };
    }

    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !authSession) {
      return { error: 'Please sign in to continue with your purchase.' };
    }

    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        price_id: priceId,
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
    });

    if (error) {
      console.error('Stripe checkout function error:', error);
      return { error: error.message || 'Failed to create checkout session' };
    }

    console.log('Checkout session response:', data);
    
    const url = (data as any)?.url;
    const sessionId = (data as any)?.sessionId;
    
    if (!url) {
      console.error('No checkout URL returned:', data);
      return { error: 'No checkout URL returned from payment processor' };
    }
    
    return { sessionId, url };
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
}

// Get user's subscription data
export async function getUserSubscription(): Promise<SubscriptionData | null> {
  try {
    // Ensure we have a valid session with proper headers
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session for subscription check');
      return null;
    }

    // Filter by current user to avoid multiple rows error
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .eq('customer_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

// Get user's order history
export async function getUserOrders(): Promise<OrderData[]> {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Check if user has active subscription
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    console.log('🔍 Checking subscription status...');

    // Use the centralized billing service for consistency
    const { getSubscriptionStatus } = await import('./billing');
    const status = await getSubscriptionStatus();
    return status.active;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Get subscription product details
export function getSubscriptionProduct(priceId: string): StripeProduct | null {
  const products = getSubscriptionProducts();
  return products.find(product => 
    product.priceId === priceId && product.mode === 'subscription'
  ) || null;
}

// Get current subscription plan name
export async function getCurrentPlanName(): Promise<string> {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription || !subscription.price_id) {
      return 'Free Plan';
    }

    const products = getSubscriptionProducts();
    const product = products.find(p => p.priceId === subscription.price_id);
    return product?.name || 'Unknown Plan';
  } catch (error) {
    console.error('Error getting plan name:', error);
    return 'Free Plan';
  }
}

// Format currency amount
export function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Check if subscription is cancelled
export async function isSubscriptionCancelled(): Promise<boolean> {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      return false;
    }

    return subscription.cancel_at_period_end || subscription.subscription_status === 'canceled';
  } catch (error) {
    console.error('Error checking cancellation status:', error);
    return false;
  }
}