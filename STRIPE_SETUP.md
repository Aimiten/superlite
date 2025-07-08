# Stripe-integraation asennus

 ## 1. Ympäristömuuttujat

 ### Frontend (.env):
 ```
 VITE_STRIPE_PRICE_LITE_MONTHLY=price_xxx
 VITE_STRIPE_PRICE_LITE_ANNUAL=price_xxx
 VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxx
 VITE_STRIPE_PRICE_PRO_ANNUAL=price_xxx

 (joo tehty)
 ```

 ### Supabase Edge Functions:
 ```bash
 # Aseta Stripe-salaisuudet
 npx supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
 npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

 (lisätty)
 ```

 ## 2. Stripe Dashboard -konfiguraatio

 ### A. Luo tuotteet ja hinnat:
 1. Mene Stripe Dashboard > Products
 2. Luo "Lite" -tuote
    - Kuukausihinta: 29€
    - Vuosihinta: 279€ (20% alennus)
 3. Luo "Pro" -tuote
    - Kuukausihinta: 99€
    - Vuosihinta: 949€ (20% alennus)
 4. Kopioi Price ID:t .env-tiedostoon

 ### B. Konfiguroi webhook:
 1. Mene Stripe Dashboard > Developers > Webhooks
 2. Add endpoint: `https://[PROJECT_ID].supabase.co/functions/v1/stripe-webhook`
 3. Valitse tapahtumat:
    - checkout.session.completed
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
 4. Kopioi webhook secret

 ## 3. Tietokantataulut

 Jos taulut puuttuvat, luo ne Supabase SQL-editorissa:

 ```sql
 -- Stripe customers taulu
 CREATE TABLE stripe_customers (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
   stripe_customer_id TEXT UNIQUE NOT NULL,
   email TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

 -- Subscriptions taulu
 CREATE TABLE subscriptions (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
   stripe_subscription_id TEXT UNIQUE NOT NULL,
   stripe_customer_id TEXT NOT NULL,
   status TEXT NOT NULL,
   price_id TEXT NOT NULL,
   current_period_start TIMESTAMP WITH TIME ZONE,
   current_period_end TIMESTAMP WITH TIME ZONE,
   cancel_at_period_end BOOLEAN DEFAULT FALSE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 );

 -- Indeksit
 CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
 CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
 CREATE INDEX idx_subscriptions_status ON subscriptions(status);

 -- RLS-politiikat
 ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
 ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

 -- Käyttäjät näkevät vain omat tietonsa
 CREATE POLICY "Users can view own stripe customer data" ON stripe_customers
   FOR SELECT USING (auth.uid() = user_id);

 CREATE POLICY "Users can view own subscriptions" ON subscriptions
   FOR SELECT USING (auth.uid() = user_id);
 ```

Tarkistettu ja edellä mainitut löytyvät!

 -------

 ## 4. Deployment

 ```bash
 # Deploy webhook function
 npm run deploy:stripe-webhook

 # Deploy checkout function (jos ei vielä deployattu)
 npx supabase functions deploy create-checkout

 (deployttu)
 ```

 ## 5. Testaus

 ### Testikorttinumerot:
 - Onnistunut maksu: 4242 4242 4242 4242
 - Maksu hylätään: 4000 0000 0000 0002
 - 3D Secure vaaditaan: 4000 0025 0000 3155

 ### Testausvaiheet:
 1. Kirjaudu sisään sovellukseen
 2. Mene hinnoittelusivulle
 3. Valitse paketti ja klikkaa "Aloita tilaus"
 4. Täytä Stripe Checkout -lomake testikortilla
 5. Tarkista että:
    - Webhook vastaanottaa tapahtuman
    - Subscription tallennetaan tietokantaan
    - Käyttäjän tilaus näkyy sovelluksessa

 ## 6. Tuotanto

 Ennen tuotantoon siirtymistä:
 1. Vaihda Stripe test keys → live keys
 2. Päivitä webhook URL tuotanto-Supabaseen
 3. Testaa koko maksuvirta tuotannossa pienellä summalla
 4. Konfiguroi Stripe-sähköpostit ja laskut

 ## Ongelmatilanteet

 ### "No price ID configured"
 - Tarkista että .env-tiedostossa on Price ID:t
 - Käynnistä development server uudelleen

 ### Webhook ei toimi
 - Tarkista webhook secret
 - Varmista että Edge Function on deployattu
 - Katso logit: `npx supabase functions logs stripe-webhook`

 ### Tilaus ei näy
 - Tarkista subscriptions-taulu Supabasessa
 - Varmista että webhook käsitteli tapahtuman
 - Tarkista RLS-politiikat
