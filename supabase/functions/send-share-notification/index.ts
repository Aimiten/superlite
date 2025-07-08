// Supabase Edge Function - send-share-notification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS-headerit
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Tyyppi lähetysdatalle
interface SendShareNotificationRequest {
  email: string;
  message?: string;
  shareLink: string;
  companyName: string;
  sharedBy: string;
  expiresAt?: string;
  shareDetails: {
    shareAssessment: boolean;
    shareValuation: boolean;
    shareDocuments: boolean;
    shareTasks: boolean;
    shareValuationImpact: boolean;
    accessLevel: 'read_only' | 'comment';
    requiresNDA?: boolean;
  };
}

serve(async (req) => {
  // CORS-käsittely
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false }
      }
    );

    // Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY ympäristömuuttuja puuttuu");
    }

    // Alusta Resend API
    const resend = new Resend(resendApiKey);

    // Pyyntödatan käsittely
    const requestData: SendShareNotificationRequest = await req.json();
    const { email, message, shareLink, companyName, sharedBy, expiresAt, shareDetails } = requestData;

    // Tarkistetaan pakolliset kentät
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Sähköpostiosoite puuttuu" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!shareLink) {
      return new Response(
        JSON.stringify({ success: false, error: "Jakolinkki puuttuu" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Lähetetään jakoilmoitus sähköpostilla osoitteeseen:", email);
    console.log("Yrityksen nimi:", companyName);
    console.log("Jakolinkki:", shareLink);
    console.log("Jaettu käyttäjältä:", sharedBy);

    // Valmistellaan sähköpostin sisältö
    const htmlContent = generateShareNotificationEmail({
      companyName,
      shareLink,
      sharedBy,
      message,
      expiresAt,
      shareDetails
    });

    // Lähetetään sähköposti Resend API:n kautta
    try {
      const data = await resend.emails.send({
        from: "Arvento <noreply@arvento.fi>",
        to: [email],
        subject: `${companyName} - Tiedot on jaettu kanssasi${shareDetails.requiresNDA ? ' (NDA vaaditaan)' : ''}`,
        html: htmlContent,
        reply_to: "arvento@aimiten.fi"
      });

      console.log("Sähköposti lähetetty onnistuneesti:", data);

      return new Response(
        JSON.stringify({ success: true, message: "Jakoilmoitus lähetetty onnistuneesti" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (sendError) {
      console.error("Virhe sähköpostin lähetyksessä:", sendError);
      throw sendError;
    }
  } catch (error) {
    console.error("Virhe funktiossa:", error);
    return new Response(
      JSON.stringify({ success: false, error: `Jakoilmoituksen lähetys epäonnistui: ${error.message || error}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Sähköpostipohjan generointifunktio
function generateShareNotificationEmail({ 
  companyName, 
  shareLink, 
  sharedBy, 
  message, 
  expiresAt,
  shareDetails
}: { 
  companyName: string; 
  shareLink: string; 
  sharedBy: string;
  message?: string;
  expiresAt?: string;
  shareDetails: any;
}): string {
  const formattedMessage = message ? message.replace(/\n/g, '<br>') : null;
  
  // Muotoillaan voimassaoloaika
  let expirationText = 'Toistaiseksi voimassa';
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    expirationText = `Voimassa ${expirationDate.toLocaleDateString('fi-FI')} asti`;
  }

  // Luodaan lista jaetuista tiedoista
  const sharedItems = [];
  if (shareDetails.shareAssessment) sharedItems.push('Myyntikunto-analyysi');
  if (shareDetails.shareValuation) sharedItems.push('Arvonmääritys');
  if (shareDetails.shareDocuments) sharedItems.push('Dokumentit');
  if (shareDetails.shareTasks) sharedItems.push('Tehtävät');
  if (shareDetails.shareValuationImpact) sharedItems.push('Tehtävien arvovaikutus');

  const accessLevelText = shareDetails.accessLevel === 'comment' 
    ? 'Voit myös kommentoida jaettuja tietoja' 
    : 'Sinulla on lukuoikeus jaettuihin tietoihin';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${companyName} - Tiedot jaettu</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #6366F1;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        background-color: #f9f9f9;
      }
      .message-box {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        border-left: 4px solid #6366F1;
      }
      .share-details {
        background-color: #ffffff;
        padding: 20px;
        border-radius: 5px;
        margin: 20px 0;
        border: 1px solid #e0e0e0;
      }
      .share-details h3 {
        margin-top: 0;
        color: #6366F1;
      }
      .share-details ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .cta-button {
        display: inline-block;
        background-color: #6366F1;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.8em;
        color: #666;
      }
      .expiration-info {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        border-radius: 5px;
        margin: 15px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${companyName}</h1>
      <p>Yrityksen tiedot on jaettu kanssasi</p>
    </div>

    <div class="content">
      <p>Hei,</p>
      
      <p><strong>${sharedBy}</strong> on jakanut kanssasi yrityksen <strong>${companyName}</strong> tietoja Arvento-palvelussa.</p>

      ${formattedMessage ? `
        <div class="message-box">
          <strong>Viesti sinulle:</strong><br>
          ${formattedMessage}
        </div>
      ` : ''}

      <div class="share-details">
        <h3>Jaetut tiedot:</h3>
        <ul>
          ${sharedItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><em>${accessLevelText}.</em></p>
      </div>

      <div class="expiration-info">
        <strong>Voimassaolo:</strong> ${expirationText}
      </div>

      <div style="text-align: center;">
        <a href="${shareLink}" class="cta-button">Avaa jaetut tiedot</a>
      </div>

      <p>Voit avata jaetut tiedot klikkaamalla yllä olevaa nappia tai kopioimalla seuraavan linkin selaimeesi:</p>
      <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
        ${shareLink}
      </p>

      <p><strong>Huomio:</strong> Tämä linkki on henkilökohtainen. Älä jaa sitä eteenpäin ilman lupaa.</p>
      
      ${shareDetails.requiresNDA ? `
        <div style="background-color: #e8f4f8; border: 2px solid #6366F1; border-radius: 5px; padding: 15px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #6366F1;">🔒 Salassapitosopimus vaaditaan</h3>
          <p>Sinun tulee hyväksyä salassapitosopimus (NDA) ennen kuin voit nähdä jaetut tiedot.</p>
          <p>Kun avaat jakolinkin, sinut ohjataan ensin NDA:n hyväksyntäsivulle.</p>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Arvento.fi. Kaikki oikeudet pidätetään.</p>
      <p>Tämä on automaattisesti lähetetty viesti. Jos sinulla on kysyttävää, voit vastata tähän viestiin.</p>
      <p>Jos et odottanut tätä viestiä, voit jättää sen huomiotta.</p>
    </div>
  </body>
  </html>
  `;
}