     import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
     import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
     import Stripe from 'https://esm.sh/stripe@12.16.0';

     const corsHeaders = {
       "Access-Control-Allow-Origin": "*",
       "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
       "Access-Control-Allow-Methods": "POST, OPTIONS",
     };

     serve(async (req) => {
       // Handle CORS
       if (req.method === 'OPTIONS') {
         return new Response(null, { headers: corsHeaders });
       }

       const signature = req.headers.get('stripe-signature');
       if (!signature) {
         return new Response('No signature', { status: 400 });
       }

       try {
         // Initialize Stripe
         const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
         const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

         if (!stripeKey || !webhookSecret) {
           throw new Error('Stripe configuration missing');
         }

         const stripe = new Stripe(stripeKey, {
           apiVersion: '2023-10-16',
         });

         // Initialize Supabase
         const supabaseUrl = Deno.env.get('SUPABASE_URL');
         const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

         if (!supabaseUrl || !supabaseKey) {
           throw new Error('Supabase configuration missing');
         }

         const supabase = createClient(supabaseUrl, supabaseKey);

         // Verify webhook signature
         const body = await req.text();
         const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

         console.log(`Processing webhook event: ${event.type}`);

         // Handle different event types
         switch (event.type) {
           case 'checkout.session.completed': {
             const session = event.data.object as Stripe.Checkout.Session;

             // Hae tilauksen tiedot
             const subscription = await stripe.subscriptions.retrieve(
               session.subscription as string
             );

             let userId = session.metadata?.user_id;

             // Jos ei ole olemassa olevaa käyttäjää, luo uusi
             if (!userId && session.customer_details?.email) {
               // Tarkista onko sähköpostilla jo tili
               const { data: existingUser } = await supabase
                 .from('profiles')
                 .select('id')
                 .eq('email', session.customer_details.email)
                 .single();

               if (existingUser) {
                 userId = existingUser.id;
               } else {
                 // Luo uusi käyttäjä
                 const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                   email: session.customer_details.email,
                   email_confirm: true,
                   user_metadata: {
                     full_name: session.customer_details.name,
                   }
                 });

                 if (createError) {
                   console.error('Error creating user:', createError);
                   throw createError;
                 }

                 userId = newUser.user?.id;

                 // Lähetä salasanan asetusviesti
                 if (userId) {
                   await supabase.auth.admin.generateLink({
                     type: 'recovery',
                     email: session.customer_details.email,
                   });
                 }
               }
             }

             // Tallenna/päivitä stripe_customer
             if (userId) {
               await supabase
                 .from('stripe_customers')
                 .upsert({
                   user_id: userId,
                   stripe_customer_id: session.customer as string,
                   email: session.customer_details?.email,
                   created_at: new Date().toISOString(),
                   updated_at: new Date().toISOString(),
                 });

               // Tallenna tilaus
               await supabase
                 .from('subscriptions')
                 .upsert({
                   user_id: userId,
                   stripe_subscription_id: subscription.id,
                   stripe_customer_id: session.customer as string,
                   status: subscription.status,
                   price_id: subscription.items.data[0].price.id,
                   current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                   current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                   cancel_at_period_end: subscription.cancel_at_period_end,
                   created_at: new Date().toISOString(),
                   updated_at: new Date().toISOString(),
                 });
             }

             console.log('Subscription created/updated successfully');
             break;
           }

           case 'customer.subscription.updated': {
             const subscription = event.data.object as Stripe.Subscription;

             // Update subscription status
             const { error: updateError } = await supabase
               .from('subscriptions')
               .update({
                 status: subscription.status,
                 current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                 current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                 cancel_at_period_end: subscription.cancel_at_period_end,
                 updated_at: new Date().toISOString(),
               })
               .eq('stripe_subscription_id', subscription.id);

             if (updateError) {
               console.error('Error updating subscription:', updateError);
               throw updateError;
             }

             console.log('Subscription updated successfully');
             break;
           }

           case 'customer.subscription.deleted': {
             const subscription = event.data.object as Stripe.Subscription;

             // Update subscription status to canceled
             const { error: cancelError } = await supabase
               .from('subscriptions')
               .update({
                 status: 'canceled',
                 updated_at: new Date().toISOString(),
               })
               .eq('stripe_subscription_id', subscription.id);

             if (cancelError) {
               console.error('Error canceling subscription:', cancelError);
               throw cancelError;
             }

             console.log('Subscription canceled successfully');
             break;
           }

           case 'invoice.payment_succeeded': {
             const invoice = event.data.object as Stripe.Invoice;

             // Log successful payment
             console.log(`Payment succeeded for invoice: ${invoice.id}`);
             break;
           }

           case 'invoice.payment_failed': {
             const invoice = event.data.object as Stripe.Invoice;

             // Log failed payment
             console.error(`Payment failed for invoice: ${invoice.id}`);

             // Could send email notification here
             break;
           }

           default:
             console.log(`Unhandled event type: ${event.type}`);
         }

         return new Response(JSON.stringify({ received: true }), {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });

       } catch (error) {
         console.error('Webhook error:', error);

         return new Response(
           JSON.stringify({ error: error.message }),
           {
             status: 400,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           }
         );
       }
     });
