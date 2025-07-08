// Supabase Edge Function - send-report-email
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
interface SendReportEmailRequest {
  email: string;
  message?: string;
  pdfData: string; // Base64-encoded PDF data
  reportName: string;
  companyName: string;
  reportType: "valuation-report" | "sales-prospectus";
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
    const requestData: SendReportEmailRequest = await req.json();
    const { email, message, pdfData, reportName, companyName, reportType } = requestData;

    // Tarkistetaan pakolliset kentät
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Sähköpostiosoite puuttuu" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!pdfData) {
      return new Response(
        JSON.stringify({ success: false, error: "PDF-data puuttuu" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Lähetetään raportti sähköpostilla osoitteeseen:", email);
    console.log("Yrityksen nimi:", companyName);
    console.log("Raportin nimi:", reportName);
    console.log("Raportin tyyppi:", reportType);

    // Valitaan otsikko raportin tyypin mukaan
    const subject = reportType === "valuation-report" 
      ? `${companyName} - Arvonmääritysraportti` 
      : `${companyName} - Myyntiesite`;

    // Valmistellaan sähköpostin sisältö
    const htmlContent = generateEmailTemplate({
      companyName,
      reportName,
      reportType,
      message: message || `Hei,\n\nTässä ${companyName} -yrityksen ${reportType === "valuation-report" ? "arvonmääritysraportti" : "myyntiesite"}.\n\nTerveisin`
    });

    // Lähetetään sähköposti Resend API:n kautta
    try {
      const data = await resend.emails.send({
        from: "Arvento <noreply@arvento.fi>",
        to: [email],
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: reportName,
            content: pdfData,  // Base64-koodattu data
            encoding: 'base64', // Määritellään encoding parametri
            type: 'application/pdf' // Määritellään MIME-tyyppi
          }
        ],
        reply_to: "arvento@aimiten.fi"
      });

      console.log("Sähköposti lähetetty onnistuneesti:", data);

      return new Response(
        JSON.stringify({ success: true, message: "Raportti lähetetty onnistuneesti" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (sendError) {
      console.error("Virhe sähköpostin lähetyksessä:", sendError);
      throw sendError;
    }
  } catch (error) {
    console.error("Virhe funktiossa:", error);
    return new Response(
      JSON.stringify({ success: false, error: `Raportin lähetys epäonnistui: ${error.message || error}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Sähköpostipohjan generointifunktio
function generateEmailTemplate({ companyName, reportName, reportType, message }: { 
  companyName: string; 
  reportName: string; 
  reportType: string;
  message: string;
}): string {
  const reportTypeText = reportType === "valuation-report" ? "arvonmääritysraportti" : "myyntiesite";
  const formattedMessage = message.replace(/\n/g, '<br>');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${companyName} - ${reportTypeText}</title>
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
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.8em;
        color: #666;
      }
      .message {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .attachment-info {
        background-color: #e9ecef;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        border-left: 4px solid #6366F1;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${companyName}</h1>
      <p>${reportTypeText.charAt(0).toUpperCase() + reportTypeText.slice(1)}</p>
    </div>

    <div class="content">
      <div class="message">
        ${formattedMessage}
      </div>

      <div class="attachment-info">
        <p><strong>Liite:</strong> ${reportName}</p>
        <p>Raportti on liitetty tähän sähköpostiin PDF-tiedostona.</p>
      </div>

      <p>Tämä raportti on luotu Arvento-palvelun avulla. Se sisältää luottamuksellista tietoa
      ja on tarkoitettu vain vastaanottajan käyttöön.</p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Arvento.fi. Kaikki oikeudet pidätetään.</p>
      <p>Tämä on automaattisesti lähetetty viesti. Tarvittaessa voit vastata tähän viestiin.</p>
    </div>
  </body>
  </html>
  `;
}