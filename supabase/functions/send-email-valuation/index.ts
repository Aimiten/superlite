// Supabase Edge Function - send-email-valuation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS-headerit
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Apufunktiot
function formatValue(value: number): string {
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(value);
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
    const { email, valuationData, companyName, emailType = "free_valuation" } = await req.json();

    // Tarkistetaan pakolliset kentät
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Sähköpostiosoite puuttuu" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!valuationData) {
      return new Response(
        JSON.stringify({ error: "Arvonmääritystiedot puuttuvat" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Lähetetään sähköposti osoitteeseen:", email);
    console.log("Yrityksen nimi:", companyName);
    console.log("Sähköpostin tyyppi:", emailType);
    console.log("Arvonmääritystiedot:", JSON.stringify(valuationData));

    // Tarkistetaan että valuationData sisältää odotetut kentät
    if (!valuationData || typeof valuationData !== 'object') {
      console.error("Virheellinen valuationData-objekti:", valuationData);
      return new Response(
        JSON.stringify({ error: "Virheellinen arvonmääritysdata" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Logitetaan selkeästi kentät ja niiden arvot
    console.log("ValuationData sisältää seuraavat arvot:");
    console.log("- Tuottopohjainen arvostus:", valuationData.earnings_valuation);
    console.log("- Substanssiarvo:", valuationData.asset_valuation);
    console.log("- Kassavirtapohjainen arvostus:", valuationData.cash_flow_valuation);
    console.log("- Vertailuarvostus:", valuationData.comparative_valuation);
    console.log("- Keskimääräinen arvo:", valuationData.average_valuation);

    // Valitaan sähköpostipohja tyypin mukaan
    let htmlContent = "";
    let subject = "";

    if (emailType === "business_calculator") {
      // Liiketoiminta-arvolaskurin sähköpostipohja
      subject = `Yrityksesi ${companyName || "Yrityksesi"} arvolaskurin tulokset`;
      htmlContent = generateBusinessCalculatorEmail(valuationData, companyName);
    } else {
      // Oletuksena ilmainen arvonmääritys
      subject = `Yrityksesi ${companyName || "Yrityksesi"} arvonmääritys`;
      htmlContent = generateFreeValuationEmail(valuationData, companyName);
    }

    // Lähetetään sähköposti Resend API:n kautta
    try {
      const data = await resend.emails.send({
        from: "Arvento <noreply@arvento.fi>",
        to: [email],
        subject: subject,
        html: htmlContent,
        reply_to: "arvento@aimiten.fi"
      });

      console.log("Sähköposti lähetetty onnistuneesti:", data);

      return new Response(
        JSON.stringify({ success: true, message: "Sähköposti lähetetty onnistuneesti" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (sendError) {
      console.error("Virhe sähköpostin lähetyksessä:", sendError);
      throw sendError;
    }
  } catch (error) {
    console.error("Virhe funktiossa:", error);
    return new Response(
      JSON.stringify({ error: `Sähköpostin lähetys epäonnistui: ${error.message || error}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

//HUOM TÄMÄ ON ILMAISEN HIEMAN LAAJEMMAN VERSION SÄHKÖPOSTI
// Ilmaisen arvonmäärityksen sähköpostipohja
function generateFreeValuationEmail(valuationData: any, companyName: string): string {
  // Varmistetaan, että kaikki arvot ovat numeroita ja muutetaan ne oikeaan muotoon
  // Tehdään tyyppimuunnos eksplisiittisesti, jotta ei tule yllätyksiä
  const earningsValuation = formatValue(Number(valuationData?.earnings_valuation || 0));
  const assetValuation = formatValue(Number(valuationData?.asset_valuation || 0));
  const cashFlowValuation = formatValue(Number(valuationData?.cash_flow_valuation || 0));
  const comparativeValuation = formatValue(Number(valuationData?.comparative_valuation || 0));
  const averageValuation = formatValue(Number(valuationData?.average_valuation || 0));

  // Lokitetaan formatoidut arvot
  console.log("Formatoidut arvot sähköpostiin:");
  console.log("- Tuottopohjainen arvostus:", earningsValuation);
  console.log("- Substanssiarvo:", assetValuation);
  console.log("- Kassavirtapohjainen arvostus:", cashFlowValuation);
  console.log("- Vertailuarvostus:", comparativeValuation);
  console.log("- Keskimääräinen arvo:", averageValuation);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Yrityksen arvonmääritys</title>
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
      .valuation-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .valuation-table th, .valuation-table td {
        border: 1px solid #ddd;
        padding: 12px;
      }
      .valuation-table th {
        background-color: #f2f2f2;
        text-align: left;
      }
      .highlight {
        font-weight: bold;
        color: #6366F1;
      }
      .cta-button {
        display: inline-block;
        background-color: #6366F1;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.8em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Yrityksen arvonmääritys</h1>
      <p>Kiitos kun käytit Arvento.fi palvelua!</p>
    </div>

    <div class="content">
      <p>Hei,</p>
      <p>Tässä on pyytämäsi arvio yrityksesi <strong>${companyName}</strong> arvosta:</p>

      <table class="valuation-table">
        <tr>
          <th>Arvostusmenetelmä</th>
          <th>Arvo</th>
        </tr>
        <tr>
          <td>Tuottopohjainen arvostus</td>
          <td>${earningsValuation}</td>
        </tr>
        <tr>
          <td>Substanssiarvo</td>
          <td>${assetValuation}</td>
        </tr>
        <tr>
          <td>Kassavirtapohjainen arvostus</td>
          <td>${cashFlowValuation}</td>
        </tr>
        <tr>
          <td>Vertailuarvostus</td>
          <td>${comparativeValuation}</td>
        </tr>
        <tr>
          <td><strong>Keskimääräinen arvo</strong></td>
          <td class="highlight">${averageValuation}</td>
        </tr>
      </table>

      <h3>Keskeiset havainnot</h3>
      ${valuationData?.finalAnalysis?.key_points && valuationData.finalAnalysis.key_points.content
        ? `<div style="margin-bottom: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
            ${valuationData.finalAnalysis.key_points.content}
          </div>`
        : ``
      }

      <h3>Suositukset</h3>
      ${valuationData?.finalAnalysis?.recommendations && Array.isArray(valuationData.finalAnalysis.recommendations) && valuationData.finalAnalysis.recommendations.length > 0 
        ? `<ul style="margin-bottom: 20px; padding-left: 20px;">
            ${valuationData.finalAnalysis.recommendations.map(rec => `
              <li>
                <strong>${rec.title || rec.description || rec}</strong>
                ${rec.expected_impact ? `<div style="margin: 5px 0 10px 0; padding: 8px; background-color: #f0f0f0; border-left: 3px solid #6366F1; font-size: 0.9em;">${rec.expected_impact}</div>` : ''}
              </li>
            `).join('')}
          </ul>`
      : ''} 

      <p>Tämä on alustava arvio yrityksesi arvosta. Tarkemman analyysin saat käyttämällä Arvento Lite tai Pro -palveluamme, joka auttaa sinua myös kasvattamaan yrityksesi arvoa myyntiä varten.</p>

      <a href="https://tally.so/r/wQ4WOp" class="cta-button" style="color: white;">Laske tarkempi arvo</a>
    </div>

    <div class="footer">
      <p>Tämä on automaattinen viesti, tarvittaessa saat meihin yhteyden vastaamalla tähän viestiin.</p>
      <p>© 2025 Arvento.fi - Aimiten Oy. Kaikki oikeudet pidätetään.</p>
    </div>
  </body>
  </html>
  `;
}

//HUOM TÄMÄ ON ILMAISEN MOBIILIVERSION SÄHKÖPOSTI
// Liiketoiminta-arvolaskurin sähköpostipohja
function generateBusinessCalculatorEmail(valuationData: any, companyName: string): string {
  console.log("Generating email with data:", JSON.stringify(valuationData));

  // Haetaan tarvittavat tiedot, ei lasketa mitään
  const companyInfo = valuationData.companyInfo || {};
  const financialData = valuationData.financialData || {};
  const revenue = financialData.revenue || [];
  const operatingProfit = financialData.operatingProfit || [];

  // Multiplier-tiedot (tarvitaan vain näyttämistä varten)
  const multipliers = valuationData.multipliers || {};
  const revenueMultiplier = multipliers.revenue || { min: 0, avg: 0, max: 0 };
  const evEbitMultiplier = multipliers.evEbit || { min: 0, avg: 0, max: 0 };

  // Käytetään suoraan laskurilta tulevia valmiita arvoja
  let minRevenueValue = 0;
  let avgRevenueValue = 0;
  let maxRevenueValue = 0;

  let minEvEbitValue = 0;
  let avgEvEbitValue = 0;
  let maxEvEbitValue = 0;

  let averageMinValue = 0;
  let averageAvgValue = 0;
  let averageMaxValue = 0;

  // Käytetään valmiita laskettuja arvoja
  if (valuationData.calculations) {
    // Liikevaihtoperusteiset arvot
    if (valuationData.calculations.revenueValuations) {
      minRevenueValue = valuationData.calculations.revenueValuations.min;
      avgRevenueValue = valuationData.calculations.revenueValuations.avg;
      maxRevenueValue = valuationData.calculations.revenueValuations.max;
    }

    // EV/EBIT arvot
    if (valuationData.calculations.evEbitValuations) {
      minEvEbitValue = valuationData.calculations.evEbitValuations.min;
      avgEvEbitValue = valuationData.calculations.evEbitValuations.avg;
      maxEvEbitValue = valuationData.calculations.evEbitValuations.max;
    }

    // Kokonaisarvot
    if (valuationData.calculations.totalValuations) {
      averageMinValue = valuationData.calculations.totalValuations.min;
      averageAvgValue = valuationData.calculations.totalValuations.avg;
      averageMaxValue = valuationData.calculations.totalValuations.max;
    }
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Yrityksesi arvolaskurin tulokset</title>
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
      .valuation-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .valuation-table th, .valuation-table td {
        border: 1px solid #ddd;
        padding: 12px;
      }
      .valuation-table th {
        background-color: #f2f2f2;
        text-align: left;
      }
      .highlight {
        font-weight: bold;
        color: #6366F1;
      }
      .cta-button {
        display: inline-block;
        background-color: #6366F1;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.8em;
        color: #666;
      }
      .company-info {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #f0f0f0;
        border-radius: 5px;
      }
      .multiplier-info {
        margin-top: 20px;
        font-size: 0.9em;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Liiketoiminta-arvolaskurin tulokset</h1>
      <p>Kiitos kun käytit Arvento.fi palvelua!</p>
    </div>

    <div class="content">
      <p>Hei,</p>
      <p>Tässä on pyytämäsi arvio yrityksesi <strong>${companyName || "Yrityksesi"}</strong> arvosta arvolaskurin perusteella:</p>

      <div class="company-info">
        <h3>Yrityksen tiedot</h3>
        <p><strong>Yrityksen nimi:</strong> ${valuationData.companyInfo?.name || companyName}</p>
        <p><strong>Y-tunnus:</strong> ${valuationData.companyInfo?.businessId || "-"}</p>
        <p><strong>Toimiala:</strong> ${valuationData.companyInfo?.industry || "-"}</p>
      </div>

      <h3>Taloudelliset tiedot</h3>
      <table class="valuation-table">
        <tr>
          <th>Vuosi</th>
          <th>Liikevaihto</th>
          <th>Liiketulos (EBIT)</th>
        </tr>
        ${revenue.map((r, i) => `
        <tr>
          <td>${r.year}</td>
          <td>${formatValue(r.value)}</td>
          <td>${formatValue(operatingProfit[i]?.value || 0)}</td>
        </tr>
        `).join('')}
      </table>

      <h3>Arvonmääritys</h3>
      <table class="valuation-table">
        <tr>
          <th>Arvostusmenetelmä</th>
          <th>Minimi</th>
          <th>Keskiarvo</th>
          <th>Maksimi</th>
        </tr>
        <tr>
          <td>Liikevaihtopohjainen (${revenueMultiplier.min}x - ${revenueMultiplier.max}x)</td>
          <td>${formatValue(minRevenueValue)}</td>
          <td>${formatValue(avgRevenueValue)}</td>
          <td>${formatValue(maxRevenueValue)}</td>
        </tr>
        <tr>
          <td>EV/EBIT-pohjainen (${evEbitMultiplier.min}x - ${evEbitMultiplier.max}x)</td>
          <td>${formatValue(minEvEbitValue)}</td>
          <td>${formatValue(avgEvEbitValue)}</td>
          <td>${formatValue(maxEvEbitValue)}</td>
        </tr>
      </table>

      <h3>Arvonmäärityksen menetelmät</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <p><strong>Liikevaihtopohjainen arvostus:</strong> 3 vuoden keskimääräinen liikevaihto kerrottuna toimialan liikevaihtokertoimilla (min, avg, max)</p>
        <p><strong>EV/EBIT-pohjainen arvostus:</strong> 3 vuoden keskimääräinen liiketulos kerrottuna toimialan EV/EBIT-kertoimilla (min, avg, max)</p>
      </div>

      <div class="multiplier-info">
        <p><strong>Huomioitavaa:</strong> Arvonmääritys perustuu ilmoitettuihin taloudellisiin lukuihin ja toimialakohtaisiin kertoimiin. Todelliset myyntihinnat voivat vaihdella merkittävästi yrityksestä ja ostajasta riippuen.</p>
        ${revenueMultiplier.justification ? `<p><strong>Liikevaihtokertoimet:</strong> ${revenueMultiplier.justification}</p>` : ''}
        ${evEbitMultiplier.justification ? `<p><strong>EV/EBIT-kertoimet:</strong> ${evEbitMultiplier.justification}</p>` : ''}
        ${revenueMultiplier.source ? `<p><strong>Lähde (liikevaihto):</strong> ${revenueMultiplier.source}</p>` : ''}
        ${evEbitMultiplier.source ? `<p><strong>Lähde (EV/EBIT):</strong> ${evEbitMultiplier.source}</p>` : ''}
      </div>

      <p>Tämä on alustava arvio yrityksesi arvosta. Tarkemman analyysin saat käyttämällä Arvento Pro -palveluamme, joka auttaa sinua kasvattamaan yrityksesi arvoa myyntiä varten.</p>

      <a href="https://arvento.fi/" class="cta-button">Laske yrityksesi arvo</a>
    </div>

    <div class="footer">
      <p>Tämä on automaattinen viesti, tarvittaessa saat meihin yhteyden vastaamalla tähän viestiin.</p>
      <p>© 2025 Arvento.fi - Aimiten Oy. Kaikki oikeudet pidätetään.</p>
    </div>
  </body>
  </html>
  `;
}