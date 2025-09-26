import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders,
      });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('[webhook] Missing required environment variables');
      return new Response('Server misconfigured', { 
        status: 500,
        headers: corsHeaders,
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('[webhook] No stripe-signature header found');
      return new Response('No signature found', { 
        status: 400,
        headers: corsHeaders,
      });
    }

    // CRITICAL: Get the raw body for signature verification
    const rawBody = await req.text();
    console.log(`[webhook] Received ${rawBody.length} bytes`);

    // Verify the webhook signature with raw body
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      console.log(`✅ [webhook] Verified: ${event.type} - ${event.id}`);
    } catch (error: any) {
      console.error(`❌ [webhook] Signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { 
        status: 400,
        headers: corsHeaders,
      });
    }

    // Process the event
    try {
      await handleEvent(event, supabase, stripe);
      console.log(`✅ [webhook] Successfully processed: ${event.type}`);
    } catch (eventError: any) {
      console.error(`❌ [webhook] Error processing ${event.type}:`, eventError);
      // Still return 200 to Stripe - we received the event
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('❌ [webhook] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});

async function handleEvent(event: Stripe.Event, supabase: any, stripe: Stripe) {
  console.log(`🔄 [webhook] Processing: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
      break;
    default:
      console.log(`ℹ️ [webhook] Unhandled event: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    console.log(`🛒 [webhook] Checkout completed: ${session.id}, mode: ${session.mode}`);
    console.log(`🛒 [webhook] Customer: ${session.customer}, Email: ${session.customer_details?.email || session.customer_email}`);

    const customerId = session.customer as string;
    const customerEmail = session.customer_details?.email || session.customer_email;
    
    if (!customerId || !customerEmail) {
      console.error('[webhook] No customer ID or email in checkout session');
      return;
    }

    console.log(`🔍 [webhook] Looking for user with email: ${customerEmail}`);
    
    // Find user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[webhook] Error fetching auth users:', authError);
      return;
    }

    const authUser = authUsers.users.find((u: any) => u.email === customerEmail);
    if (!authUser) {
      console.error(`[webhook] No auth user found for email: ${customerEmail}`);
      return;
    }

    console.log(`✅ [webhook] Found auth user: ${authUser.id} for email: ${customerEmail}`);
    
    // Ensure customer record exists
    await ensureCustomerRecord(customerId, authUser.id, supabase);

    // CRITICAL: Ensure user profile exists in Supabase
    await ensureUserProfileFromWebhook(authUser.id, customerEmail, supabase);

    if (session.mode === 'payment' && session.payment_status === 'paid') {
      // Handle one-time payment
      console.log('💰 [webhook] Processing one-time payment');
      
      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: customerId,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'aud',
        payment_status: session.payment_status,
        status: 'completed',
      });

      if (orderError) {
        console.error('❌ [webhook] Error inserting order:', orderError);
      } else {
        console.log(`✅ [webhook] One-time payment recorded: ${session.id}`);
      }
    } else if (session.mode === 'subscription') {
      // Handle subscription - sync from Stripe
      console.log('🔄 [webhook] Syncing subscription after checkout');
      console.log('🔄 [webhook] Customer ID for sync:', customerId);
      await syncSubscriptionFromStripe(customerId, supabase);
    }
  } catch (error) {
    console.error('❌ [webhook] Error handling checkout completion:', error);
    throw error;
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  try {
    console.log(`🔄 [webhook] Subscription ${subscription.status}: ${subscription.id}`);
    await syncSubscriptionFromStripe(subscription.customer as string, supabase);
  } catch (error) {
    console.error('❌ [webhook] Error handling subscription change:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  try {
    console.log(`🗑️ [webhook] Subscription deleted: ${subscription.id}`);
    
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', subscription.customer as string);

    if (error) {
      console.error('❌ [webhook] Error updating deleted subscription:', error);
    } else {
      console.log('✅ [webhook] Subscription marked as canceled');
    }
  } catch (error) {
    console.error('❌ [webhook] Error handling subscription deletion:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log(`💳 [webhook] Invoice payment succeeded: ${invoice.id}`);
    if (invoice.customer) {
      await syncSubscriptionFromStripe(invoice.customer as string, supabase);
    }
  } catch (error) {
    console.error('❌ [webhook] Error handling invoice payment success:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log(`❌ [webhook] Invoice payment failed: ${invoice.id}`);
    if (invoice.customer) {
      await syncSubscriptionFromStripe(invoice.customer as string, supabase);
    }
  } catch (error) {
    console.error('❌ [webhook] Error handling invoice payment failure:', error);
    throw error;
  }
}

async function ensureUserProfileFromWebhook(userId: string, email: string, supabase: any) {
  try {
    console.log(`👤 [webhook] Ensuring user profile exists: ${email}`);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [webhook] Error checking existing profile:', checkError);
      return;
    }

    if (existingProfile) {
      console.log(`✅ [webhook] User profile already exists: ${email}`);
      return;
    }

    // Detect hemisphere from email domain
    let hemisphere: 'Northern' | 'Southern' = 'Northern';
    if (email.includes('.au') || email.includes('bigpond') || email.includes('.nz')) {
      hemisphere = 'Southern';
    }

    console.log(`📝 [webhook] Creating user profile for: ${email} (${hemisphere})`);

    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: email,
        name: email.split('@')[0],
        birth_date: null, // Will be filled when user completes profile
        birth_time: null,
        birth_location: null,
        hemisphere: hemisphere,
        cusp_result: {}, // Empty object for JSONB field
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        needs_recalc: false,
      });

    if (insertError) {
      console.error('❌ [webhook] Error creating user profile:', insertError);
    } else {
      console.log(`✅ [webhook] User profile created for: ${email}`);
    }
  } catch (error) {
    console.error('❌ [webhook] Error ensuring user profile:', error);
  }
}

async function ensureCustomerRecord(customerId: string, userId: string, supabase: any) {
  try {
    console.log(`👤 [webhook] Ensuring customer record: ${customerId} -> ${userId}`);

    // First check if customer record already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [webhook] Error checking existing customer:', checkError);
    } else if (existingCustomer) {
      console.log(`✅ [webhook] Customer record already exists: ${customerId}`);
      return;
    }

    const { error: customerError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id'
      });

    if (customerError) {
      console.error('❌ [webhook] Error upserting customer:', customerError);
    } else {
      console.log(`✅ [webhook] Customer record ensured: ${customerId} -> ${userId}`);
    }
  } catch (error) {
    console.error('❌ [webhook] Error ensuring customer record:', error);
  }
}

async function syncSubscriptionFromStripe(customerId: string, supabase: any) {
  try {
    console.log(`🔄 [webhook] Syncing subscription for customer: ${customerId}`);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.log(`[webhook] No subscriptions found for customer: ${customerId}`);
      
      // Update to not_started status
      const { error } = await supabase.from('stripe_subscriptions').upsert({
        customer_id: customerId,
        status: 'not_started',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id',
      });

      if (error) {
        console.error('❌ [webhook] Error updating subscription status:', error);
      }
      return;
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];
    console.log(`📋 [webhook] Syncing subscription: ${subscription.id}, status: ${subscription.status}`);

    // Prepare subscription data
    const subscriptionData: any = {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
      updated_at: new Date().toISOString(),
    };

    // Add payment method info if available
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
      subscriptionData.payment_method_brand = paymentMethod.card?.brand || null;
      subscriptionData.payment_method_last4 = paymentMethod.card?.last4 || null;
    }

    // Upsert subscription data
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      subscriptionData,
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('❌ [webhook] Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    console.log(`✅ [webhook] Subscription synced: ${customerId} -> ${subscription.status}`);
  } catch (error) {
    console.error(`❌ [webhook] Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}