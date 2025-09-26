import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
})

const ok = (data: unknown, origin?: string) =>
  new Response(JSON.stringify(data), { 
    status: 200, 
    headers: { 
      'Content-Type': 'application/json', 
      ...corsHeaders(origin) 
    } 
  })

const bad = (status: number, msg: string, origin?: string) =>
  new Response(JSON.stringify({ error: msg }), { 
    status, 
    headers: { 
      'Content-Type': 'application/json', 
      ...corsHeaders(origin) 
    } 
  })

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? undefined
  
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }
    
    if (req.method !== 'POST') {
      return bad(405, 'Method not allowed', origin)
    }

    const supabaseJwt = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!supabaseJwt) {
      console.log('[stripe-status] No authorization header found')
      return bad(401, 'No auth', origin)
    }

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
      console.log('[stripe-status] Missing STRIPE_SECRET_KEY - using fallback for development')
      // Return a development fallback instead of failing
      return ok({
        active: false,
        reason: 'missing_stripe_key',
        development_mode: true
      }, origin)
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[stripe-status] Missing Supabase credentials - using fallback')
      return ok({
        active: false,
        reason: 'missing_supabase_credentials',
        development_mode: true
      }, origin)
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

    // Add diagnostics for test/prod mode debugging
    const skPrefix = STRIPE_SECRET_KEY?.slice(0, 7);
    console.log('[stripe-status] Server key prefix:', skPrefix);
    console.log('[stripe-status] Client mode from env:', Deno.env.get('EXPO_PUBLIC_STRIPE_MODE'));

    // Get user email for temporary override
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser(supabaseJwt);
    
    if (authUserError) {
      console.error('[stripe-status] Error getting user:', authUserError);
      return ok({
        active: false,
        reason: 'auth_error',
        error: authUserError.message
      }, origin);
    }
    
    if (!authUser) {
      console.log('[stripe-status] No user found from JWT')
      return ok({
        active: false,
        reason: 'no_user_found'
      }, origin);
    }
    
    const userEmail = authUser?.email;
    console.log('[stripe-status] User email:', userEmail);
    
    // Special account overrides
    const specialAccounts = [
      'mish.cd@gmail.com',
      'petermaricar@bigpond.com',
      'tsharna.kecek@gmail.com', 
      'james.summerton@outlook.com',
      'xavier.cd@gmail.com',
      'xaviercd96@gmail.com', // Keep both variants
      'adam.stead@techweave.co',      // ✅ VIP Account
      'michael.p.r.orourke@gmail.com', // ✅ VIP Account
    ];
    
    if (userEmail && specialAccounts.includes(userEmail)) {
      console.log(`[stripe-status] SPECIAL: Granting access to ${userEmail}`);
      return ok({
        active: true,
        plan: 'yearly',
        current_period_end: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
        price_id: Deno.env.get('STRIPE_PRICE_YEARLY'),
        status: 'active',
        diagnostics: {
          override: `special_access_for_${userEmail}`,
          secret_key_prefix: skPrefix,
        }
      }, origin);
    }

    // Enhanced customer lookup with better error handling
    console.log('[stripe-status] Looking up customer record...');
    const { data: customerRows, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    if (customerError) {
      console.error('[stripe-status] Customer lookup failed:', customerError);
      return ok({ active: false, error: 'Customer lookup failed' }, origin);
    }
    
    console.log('[stripe-status] Customer query result:', customerRows);
    const customerId = customerRows?.customer_id;
    
    if (!customerId) {
      console.log('[stripe-status] No customer ID found for user');
      return ok({ active: false, reason: 'no_customer_record', source: 'db', status: 'no_customer' }, origin);
    }

    console.log('[stripe-status] Found customer ID:', customerId);
    
    // Check subscription mirror table first (faster)
    console.log('[stripe-status] Checking subscription mirror table...');
    const { data: subRows, error: subError } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_id, status, price_id, current_period_end, cancel_at_period_end')
      .eq('customer_id', customerId)
      .maybeSingle();
    
    if (!subError && subRows) {
      console.log('[stripe-status] Mirror table subscription:', subRows);
      
      const activeSub = subRows;
      const isActiveStatus = activeSub && ['active', 'trialing', 'past_due'].includes(activeSub.status);
      const notCancelled = activeSub && !activeSub.cancel_at_period_end;
      const isActive = isActiveStatus && notCancelled;
      
      console.log('[stripe-status] Subscription evaluation:', {
        hasSubscription: !!activeSub,
        status: activeSub?.status,
        isActiveStatus,
        cancel_at_period_end: activeSub?.cancel_at_period_end,
        notCancelled,
        finalResult: isActive
      });
      
      if (isActive) {
        console.log('[stripe-status] Found active subscription in mirror table:', activeSub);
        const plan = activeSub.price_id === Deno.env.get('STRIPE_PRICE_YEARLY') ? 'yearly' : 'monthly';
        
        return ok({
          active: true,
          source: 'db',
          plan,
          current_period_end: activeSub.current_period_end,
          price_id: activeSub.price_id,
          status: activeSub.status,
        }, origin);
      } else if (activeSub) {
        console.log('[stripe-status] Found subscription but not active:', {
          status: activeSub.status,
          cancel_at_period_end: activeSub.cancel_at_period_end
        });
        return ok({
          active: false,
          source: 'db',
          reason: 'subscription_inactive',
          status: activeSub.status,
        }, origin);
      }
    }
    
    if (subError) {
      console.log('[stripe-status] Mirror table query error:', subError);
    }
    
    console.log('[stripe-status] No subscription found in mirror table, checking Stripe directly...');
    
    // Ask Stripe directly for subscription status
    console.log('[stripe-status] Querying Stripe for subscriptions...')
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 3,
      expand: ['data.items.data.price'],
    })

    console.log('[stripe-status] Stripe subscriptions:', list.data.map(s => ({
      id: s.id,
      status: s.status,
      price_id: s.items.data[0]?.price?.id,
      livemode: s.livemode
    })))
    
    // Find the latest active, trialing, past_due, or incomplete subscription
    const sub = list.data.find(s => {
      const isActiveStatus = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid'].includes(s.status);
      const notCancelled = !s.cancel_at_period_end;
      const isValid = isActiveStatus && notCancelled;
      
      console.log(`[stripe-status] Evaluating subscription ${s.id}:`, {
        status: s.status,
        isActiveStatus,
        cancel_at_period_end: s.cancel_at_period_end,
        notCancelled,
        isValid
      });
      
      return isValid;
    });
    
    if (!sub) {
      console.log('[stripe-status] No active subscription found. All subscriptions:', list.data.map(s => ({ id: s.id, status: s.status })))
      
      // Enhanced debugging for subscription issues
      if (list.data.length === 0) {
        console.log('[stripe-status] No subscriptions found for customer')
        return ok({ 
          active: false, 
          source: 'stripe',
          reason: 'no_subscriptions_found',
          status: 'no_subscriptions'
        }, origin);
      } else {
        console.log('[stripe-status] Found subscriptions but none are active/trialing/past_due/incomplete')
        console.log('[stripe-status] Subscription details:', list.data.map(s => ({
          id: s.id,
          status: s.status,
          current_period_end: s.current_period_end,
          cancel_at_period_end: s.cancel_at_period_end,
          price_id: s.items.data[0]?.price?.id
        })))
        return ok({ 
          active: false, 
          source: 'stripe',
          reason: 'subscriptions_not_active',
          status: 'inactive',
          debug: {
            customer_id: customerId,
            total_subscriptions: list.data.length,
            subscription_statuses: list.data.map(s => s.status)
          }
        }, origin);
      }
    }

    console.log('[stripe-status] Found qualifying subscription:', {
      id: sub.id,
      status: sub.status,
      current_period_end: sub.current_period_end,
      livemode: sub.livemode,
      cancel_at_period_end: sub.cancel_at_period_end
    })
    
    // Detect plan type
    const priceId = sub.items.data[0]?.price?.id
    const price = sub.items.data[0]?.price
    const plan = priceId
      ? (priceId === Deno.env.get('STRIPE_PRICE_YEARLY') ? 'yearly'
         : priceId === Deno.env.get('STRIPE_PRICE_MONTHLY') ? 'monthly'
         : undefined)
      : undefined

    // Add livemode diagnostics
    const diagnostics = {
      secret_key_prefix: skPrefix,
      subscription_livemode: sub.livemode,
      price_livemode: price?.livemode,
      price_id: priceId,
      expected_monthly: Deno.env.get('STRIPE_PRICE_MONTHLY'),
      expected_yearly: Deno.env.get('STRIPE_PRICE_YEARLY'),
    };

    console.log('[stripe-status] Diagnostics:', diagnostics);

    console.log('[stripe-status] Returning active subscription:', {
      active: true,
      plan,
      price_id: priceId,
      status: sub.status
    })
    
    return ok({
      active: true,
      source: 'stripe',
      plan,
      diagnostics,
      current_period_end: sub.current_period_end,
      price_id: priceId,
      status: sub.status,
    }, origin)
    
  } catch (e) {
    console.error('[stripe-status] Unexpected error:', e)
    return ok({
      active: false,
      reason: 'unexpected_error',
      error: e?.message || 'Unknown error',
      development_mode: true
    }, origin)
  }
})