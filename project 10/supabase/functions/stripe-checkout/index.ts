import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('[checkout] Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)

    if (userError || !user) {
      console.error('[checkout] Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[checkout] Authenticated user:', user.email)

    // Parse request body
    const body = await req.json()
    const { priceId, mode = 'subscription', successUrl, cancelUrl } = body

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[checkout] Creating checkout session:', { priceId, mode, email: user.email })

    // Check if customer already exists
    let customerId: string | null = null
    
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id
      console.log('[checkout] Using existing customer:', customerId)
    } else {
      // Create new Stripe customer
      try {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: {
            user_id: user.id,
          },
        })
        customerId = customer.id
        console.log('[checkout] Created new customer:', customerId)
      } catch (stripeError: any) {
        console.error('[checkout] Error creating Stripe customer:', stripeError)
        return new Response(
          JSON.stringify({ error: `Failed to create customer: ${stripeError.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      

      // Save customer mapping
      const { error: customerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId,
        })

      if (customerError) {
        console.error('[checkout] Error saving customer:', customerError)
        // Continue anyway - webhook will handle this
      }
    }

    // Create checkout session
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: mode as 'subscription' | 'payment',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${Deno.env.get('SITE_URL') || 'https://astrocusp.com.au'}/auth/success?type=${mode}`,
        cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'https://astrocusp.com.au'}/subscription`,
        billing_address_collection: 'auto',
        metadata: {
          user_id: user.id,
          user_email: user.email!,
        },
      })
    } catch (stripeError: any) {
      console.error('[checkout] Error creating checkout session:', stripeError)
      return new Response(
        JSON.stringify({ error: `Failed to create checkout session: ${stripeError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[checkout] Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('[checkout] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Checkout failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})