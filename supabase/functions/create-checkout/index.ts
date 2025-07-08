import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@12.16.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const { priceId, successUrl, cancelUrl, email } = await req.json();

    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Tarkista onko käyttäjä kirjautunut (optional)
    let userId = null;
    let customerEmail = email;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        customerEmail = user.email || email;
      }
    }

    // Luo Checkout-sessio
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl || `${Deno.env.get('SITE_URL') || ''}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || ''}/?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: customerEmail,
      metadata: {
        ...(userId && { user_id: userId }),
      },
    };

    // Jos käyttäjä on kirjautunut ja hänellä on stripe_customer_id
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (customerData?.stripe_customer_id) {
        sessionConfig.customer = customerData.stripe_customer_id;
        delete sessionConfig.customer_email; // Käytä olemassa olevaa asiakasta
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-checkout function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
