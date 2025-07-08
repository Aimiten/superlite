import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0"; // Oikein lainausmerkeissä
import { parseGeminiJsonResponse } from "./gemini-parser.ts";
import { getLatestPeriod } from '../../_shared/period-utils.ts';

// The model name for Gemini API calls
const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Creates a comprehensive business valuation analysis prompt for Gemini
 * based on the actual data available in the application.
 */
export function createValuationAnalysisPrompt(
  companyName: string,
  financialAnalysis: any,
  companyInfo: any,
  originalQuestions: any[] = [],
  userAnswers: Record<string, string> = {}
): string {
  // Extract industry, description, and market position if available
  const industry = companyInfo?.structuredData?.industry || "tuntematon toimiala";
  const description = companyInfo?.structuredData?.description || "";
  const marketPosition = companyInfo?.structuredData?.market_position || "";

  // Format questions and answers for better context
  const questionsAndAnswers = originalQuestions.map(q => {
    const questionId = q.id;
    const answer = userAnswers[questionId] || "Ei vastausta";
    // Include impact if available
    const impactText = q.impact ? `\nVaikutus: ${q.impact}` : "";
    return `Kysymys: ${q.question}\nVastaus: ${answer}${impactText}`;
  }).join("\n\n");

  // Extract latest financial period data safely
  const financialPeriods = financialAnalysis?.documents?.[0]?.financial_periods || [];
  const latestPeriod = financialPeriods.length > 0 ? financialPeriods.reduce((latest: any, current: any) => {
      const latestEndDate = latest?.period?.end_date ? new Date(latest.period.end_date) : null;
      const currentEndDate = current?.period?.end_date ? new Date(current.period.end_date) : null;
      if (!currentEndDate) return latest;
      if (!latestEndDate) return current;
      return currentEndDate > latestEndDate ? current : latest;
  }, financialPeriods[0]) : null;

  // Extract key data structures from the latest period
  const latestPeriodCoreData = latestPeriod ? {
      period: latestPeriod.period,
      income_statement: latestPeriod.income_statement,
      balance_sheet: latestPeriod.balance_sheet,
      dcf_items: latestPeriod.dcf_items,
      // TÄRKEÄ: Sisällytä painotetut talousluvut jos saatavilla
      weighted_financials: latestPeriod.weighted_financials || null,
      // Include normalization explanations if they exist at period level
      normalization_explanations: financialAnalysis?.normalization_explanations || latestPeriod.normalization_explanations
  } : null;

  const latestPeriodMultiples = latestPeriod?.valuation_multiples || {};
  const latestPeriodMetrics = latestPeriod?.valuation_metrics || {}; // This contains the calculated values

  // Extract period weighting information for context
  const periodWeighting = financialAnalysis?.documents?.[0]?.period_weighting || latestPeriod?.period_weighting;
  const hasMultiplePeriods = (financialPeriods.length > 1);

  // Check if we have partnership data
  const isPartnership = financialAnalysis?.company?.company_type === "toiminimi" ||
                       financialAnalysis?.company?.company_type === "henkilöyhtiö" ||
                       financialAnalysis?.company?.company_type === "avoin yhtiö" ||
                       financialAnalysis?.company?.company_type === "kommandiittiyhtiö";

  // Backtick on TÄYSIN OK ja oikein tässä monirivisen prompt-merkkijonon määrittelyyn
  return `
    TÄRKEÄ OHJE: VASTAA AINA SUOMEKSI. Kaikki analyysit, selitykset ja suositukset tulee kirjoittaa suomen kielellä.
    
    Olet kokenut yritysjärjestelyihin erikoistunut rahoitusanalyytikko, joka on saanut tehtäväkseen määrittää yrityksen "${companyName}" arvon yritysjärjestelytilannetta varten. Olet osa sovellusta, joka auttaa käyttäjiä määrittämään yrityksensä arvon käyttäen tekoälyä.

    # TEHTÄVÄSI

    Sinun tehtäväsi on analysoida alla annetut tiedot (perustiedot, normalisoidut tilinpäätöstiedot, käytetyt kertoimet, lasketut arvostusmetriikat ja käyttäjän vastaukset) ja tuottaa kattava arvonmääritysanalyysi JSON-muodossa, joka:
    1. Selittää yrityksen arvon perusteellisesti viitaten laskettuihin metriikoihin.
    2. Tunnistaa keskeiset arvoa luovat ja heikentävät tekijät.
    3. Antaa konkreettisia suosituksia arvon kasvattamiseksi.
    4. Analysoi yrityksen erityispiirteet ja niiden vaikutuksen arvoon.

    # SOVELLUKSEN ARVOSTUSMENETELMÄT (KRIITTINEN TIETO)

    Tämä sovellus käyttää seuraavaa standardimukaista arvostuslogiikkaa:

    **Arvostusmenetelmät:**
    1. **Book Value** (Kirja-arvo) = Taseen oma pääoma
    2. **Asset-Based Value** (Varallisuusperusteinen) = Nettokassa (Kassa - Korollinen velka)
    3. **EV/Revenue → Equity Value** = (Revenue × Revenue_Multiple) - NetDebt
    4. **EV/EBIT → Equity Value** = (EBIT × EBIT_Multiple) - NetDebt  
    5. **EV/EBITDA → Equity Value** = (EBITDA × EBITDA_Multiple) - NetDebt
    6. **P/E → Equity Value** = NetIncome × PE_Multiple

    **Jos useita tilikausia:**
    - Kaikki arvostuslaskelmat tehdään PAINOTETUILLA keskiarvoilla (ei yksittäisen tilikauden luvuilla)
    - Painotus riippuu yrityksen luonteesta: Kasvu (alpha 0.9), Syklinen (alpha 0.5), Vakaa (alpha 0.7)
    - **Käytä AINA \`weighted_financials\`-arvoja selityksissäsi, älä alkuperäisiä \`income_statement\`-arvoja**

    **Lopullinen arvo:**
    - Keskiarvo kaikista soveltuvista menetelmistä (ei nolla-arvoja)
    - Jos NetDebt negatiivinen (nettokassa), se LISÄTÄÄN Enterprise Value:een

    # SAATAVILLA OLEVAT TIEDOT

    ## 1. YRITYKSEN PERUSTIEDOT
    ${companyInfo?.structuredData ? JSON.stringify(companyInfo.structuredData, null, 2) : "Ei yritystietoja saatavilla"}

    ## 2. NORMALISOIDUT TILINPÄÄTÖSTIEDOT (VIIMEISIN KAUSI)
    ${latestPeriodCoreData ? JSON.stringify(latestPeriodCoreData, null, 2) : "Ei tilinpäätöstietoja saatavilla"}
    ${/* Lisätään normalisointiselitykset, jos ne eivät ole coreDatassa */ ''}
    ${financialAnalysis?.normalization_explanations && !latestPeriodCoreData?.normalization_explanations ? `
    ## 2b. NORMALISOINNIN SELITYKSET
    ${JSON.stringify(financialAnalysis.normalization_explanations, null, 2)}` : ""}

    ${hasMultiplePeriods && periodWeighting ? `
    ## 2c. TILIKAUSIEN PAINOTUSTIEDOT
    ${JSON.stringify(periodWeighting, null, 2)}
    
    **TÄRKEÄÄ:** Yllä olevassa osiossa 2 on \`weighted_financials\`-kenttä, joka sisältää painotetut keskiarvot useammasta tilikaudesta. **KÄYTÄ NÄITÄ ARVOJA** selityksissäsi, älä yksittäisen tilikauden \`income_statement\`-arvoja.` : ""}

    ## 3. KÄYTETYT ARVOSTUSKERTOIMET
    ${Object.keys(latestPeriodMultiples).length > 0 ? JSON.stringify(latestPeriodMultiples, null, 2) : "Ei arvostuskertoimia saatavilla"}

    ## 4. LASKETUT ARVOSTUSMETRIIKAT (OMAN PÄÄOMAN ARVO)
    ${/* Tämä sisältää lopputulokset: average_equity_valuation, range, book_value, calculated_net_debt, equity_value_from_... */''}
    ${Object.keys(latestPeriodMetrics).length > 0 ? JSON.stringify(latestPeriodMetrics, null, 2) : "Ei laskettuja metriikoita saatavilla"}

    ## 5. KÄYTTÄJÄLTÄ KYSYTYT KYSYMYKSET JA VASTAUKSET (Normalisoinnin pohja)
    ${questionsAndAnswers || "Ei kysymyksiä tai vastauksia saatavilla"}

    # ANALYYSIKEHYS

    Analysoi dataa seuraavien näkökulmien kautta:

    1.  **Liiketoiminta ja toimiala:** Toimiala (${industry}), päätoimintamalli, kilpailuedut, markkina-asema. Miten nämä vaikuttavat arvostukseen ja kertoimien valintaan?
    2.  **Taloudellinen suorituskyky:** ${hasMultiplePeriods ? `
        **KÄYTÄ PAINOTETTUJA ARVOJA:** Analysoi ensisijaisesti osiossa 2 olevia \`weighted_financials\`-arvoja (painotettu liikevaihto, EBIT, EBITDA, nettotulos), älä yksittäisen tilikauden \`income_statement\`-arvoja. 
        
        Yrityksen liiketoiminta on tunnistettu tyypiltään: ${periodWeighting?.business_pattern || "vakaa"}, minkä vuoksi tilikausien painotuksessa on käytetty ${periodWeighting?.alpha?.toFixed(1) || "0.7"} alpha-arvoa (${
        periodWeighting?.business_pattern === "growth" ? 
          "viimeisintä tilikautta vahvasti painottava" : 
        periodWeighting?.business_pattern === "cyclical" ? 
          "tilikausien välillä tasaisemmin jakautuva" : 
          "eksponentiaalinen"} 
        painotus). Tilikausien painot: ${periodWeighting?.weights?.map(w => `${Math.round(w * 100)}%`).join(' / ') || "ei saatavilla"}.` : 
        `Analysoi normalisoituja lukuja (liikevaihto, EBIT, EBITDA, nettotulos) osiosta 2. **Huom:** \`weighted_financials\`-arvot ovat samat kuin \`income_statement\`-arvot, koska käytettävissä on vain yksi tilikausi.`}
    3.  **Arvostusmenetelmät ja lopputulos:**
        *   Analysoi osion 3 kertoimien (\`valuation_multiples\`) sopivuutta.
        *   **Selitä, miten osion 4 laskettuihin metriikoihin (\`valuation_metrics\`) päädyttiin:** Mitkä yksittäiset komponentit (esim. \`equity_value_from_revenue\`, \`book_value\`) olivat mukana keskiarvon (\`average_equity_valuation\`) laskennassa (käytä \`valuation_methods_in_average\` apuna)? Miksi jotkin komponentit olivat mahdollisesti nolla tai eivät relevantteja? Miten nettovelka (\`calculated_net_debt\`) vaikutti?
        *   Perustele lopullinen arvo (\`average_equity_valuation\`) ja haarukka (\`equity_valuation_range\`) näiden laskelmien ja laadullisten tekijöiden pohjalta.
    4.  **Laadulliset tekijät:** Aineettomat tekijät, kasvu, skaalautuvuus, asiakkaat. Miten nämä vaikuttavat arvoon numeroiden lisäksi?
    5.  **Riskit:** Tunnista keskeiset riskit ja niiden vaikutus arvoon ja kertoimiin.

    # HUOMIOITAVAA

    - Keskity analyysissäsi perustelemaan, **miksi** yrityksen arvo on laskettujen metriikoiden (\`valuation_metrics\`) mukainen.
    - ${hasMultiplePeriods ? '**KRIITTISTÄ:** Kun selität laskelmia, käytä AINA `weighted_financials`-arvoja (painotettu liikevaihto, EBIT jne.), älä yksittäisen tilikauden `income_statement`-arvoja.' : '**Huom:** Voit käyttää joko `weighted_financials`- tai `income_statement`-arvoja, ne ovat samat yhden tilikauden tapauksessa.'}
    - Selitä selkokielellä, mutta ammattimaisesti.
    - ${isPartnership ? "Henkilöyhtiön tapauksessa korosta yrittäjän palkan ja yksityiskäytön vaikutusta normalisointiin ja arvoon." : "Osakeyhtiön tapauksessa keskity omistaja-arvoon."}
    - Anna konkreettisia, dataan perustuvia suosituksia.

    # VASTAUKSEN RAKENNE (JSON)

    {
      "key_points": {
        "title": "Keskeiset havainnot",
        "content": "Tiivis yhteenveto tärkeimmistä arvoon vaikuttavista tekijöistä ja perusteltu arvio yrityksen arvosta (viitaten average_equity_valuation ja range)."
      },
      "analysis": {
        "business_model": {
          "title": "Liiketoimintamalli ja kilpailuedut",
          "content": "Analyysi liiketoiminnasta, toimialasta, kilpailueduista ja markkina-asemasta sekä niiden vaikutuksesta arvoon."
        },
        "financial_performance": {
          "title": "Taloudellinen suorituskyky",
          "content": "Analyysi normalisoidusta taloudellisesta suorituskyvystä (kannattavuus, kasvu). Erittele normalisointien vaikutukset, jos tietoa saatavilla (ks. tiedot 2b ja 5)."
        },
        "valuation_methods": {
          "title": "Arvostusmenetelmät ja laskelmat",
          "content": "Analyysi käytetyistä kertoimista (ks. tieto 3) ja niiden soveltuvuudesta. **Selitä yksityiskohtaisesti, miten laskettuihin arvostuskomponentteihin (ks. tieto 4: equity_value_from_...) päädyttiin ja mitkä niistä muodostivat lopullisen keskiarvon (\`average_equity_valuation\`). ${hasMultiplePeriods ? 'KÄYTÄ weighted_financials-arvoja selityksissäsi (painotettu liikevaihto, EBIT jne.), älä yksittäisen tilikauden lukuja.' : ''} Mainitse nettovelan (\`calculated_net_debt\`) rooli.**"
        },
        "risk_assessment": {
          "title": "Riskiarviointi",
          "content": "Analyysi keskeisistä liiketoiminnan riskeistä ja niiden vaikutuksesta arvoon ja kertoimiin."
        }
      },
      "recommendations": [
        {
          "category": "Arvon kasvattaminen", // Tai muu relevantti kategoria
          "title": "Konkreettinen suositus 1",
          "description": "Yksityiskohtainen suositus, joka perustuu analyysissä tunnistettuihin tekijöihin."
        },
        {
          "category": "Riskien hallinta", // Tai muu relevantti kategoria
          "title": "Konkreettinen suositus 2",
          "description": "Toinen yksityiskohtainen suositus."
        }
        // Lisää tarvittaessa 1-2 suositusta lisää samassa muodossa
      ],
      "valuation_rationale": "Kokonaisvaltainen perustelu lasketulle arvolle (\`average_equity_valuation\`) ja haarukalle (\`equity_valuation_range\`). **Yhdistä analyysin eri osa-alueet (taloudellinen suorituskyky, laadulliset tekijät, riskit, arvostuskomponentit) ja selitä, miksi juuri tämä arvio on perusteltu.** Huomioi toimiala, yrityksen erityispiirteet ja käyttäjän antamat tiedot."
    }

# VASTAUKSEN MUOTOILU - KRIITTINEN OHJE

PALAUTA VASTAUKSESI PELKÄSTÄÄN JSON-MUODOSSA. ÄLÄ käytä markdown-merkintöjä tai koodilohkoja.
ÄLÄ KIRJOITA YHTÄÄN JOHDANTOA, SELITYSTÄ TAI MUUTA TEKSTIÄ ennen tai jälkeen JSON-objektin.

TARKISTA, että JSON-syntaksi on 100% validi:
- Kaikki avainten nimet ovat lainausmerkeissä
- Ei ylimääräisiä pilkkuja objektien/taulukoiden lopussa
- Kaikki lainausmerkit ovat suljettuja

VASTAA VAIN PUHTAALLA JSON-OBJEKTILLA, EI MITÄÄN MUUTA.
  `; // Backtick päättyy - OK
}

/**
 * Makes a call to Gemini API to generate a valuation analysis
 * based on financial data and company information.
 */
export async function generateValuationAnalysis(
  companyName: string,
  financialAnalysis: any,
  companyInfo: any,
  originalQuestions: any[] = [],
  userAnswers: Record<string, string> = {}
): Promise<any> {
    // ... toteutus ennallaan ...
    try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Create the valuation analysis prompt using the updated function
    const prompt = createValuationAnalysisPrompt(
      companyName,
      financialAnalysis,
      companyInfo,
      originalQuestions,
      userAnswers
    );

    console.log(`Generating valuation analysis for ${companyName}`);

    const contents = [{
      role: "user",
      parts: [{ text: prompt }]
    }];

    const generationConfig = {
      temperature: 0.2,
      maxOutputTokens: 15192, // Keep sufficient token limit
      // response_mime_type: "application/json" // Consider enabling for direct JSON
    };

    const result = await model.generateContent({
      contents,
      generationConfig
    });

    const response = result.response;

    if (!response || response.promptFeedback?.blockReason) {
      const blockReason = response?.promptFeedback?.blockReason || "Unknown reason";
      const safetyRatings = response?.candidates?.[0]?.safetyRatings || "No safety ratings";
      console.error(`Gemini request blocked. Reason: ${blockReason}`, safetyRatings);
      throw new Error(`Tekoälypyyntö estettiin turvallisuussyistä: ${blockReason}`);
    }

    const text = response.text();
    console.log(`Received valuation analysis response, length: ${text.length} characters`);

    try {
      // KORVAA VANHA JSON-PARSINTA TÄLLÄ:
      const parsedData = parseGeminiJsonResponse(text, {
        expectFormat: "object", 
        logPrefix: "valuation-analysis"
      });

      console.log("Successfully parsed valuation analysis data");
      return parsedData;
    } catch (parseError) {
      console.error("Error parsing Gemini valuation analysis response:", parseError);
      console.log("Raw response sample:", text.substring(0, 500) + "...");
      throw new Error(`Tekoälyn analyysivastauksen jäsentäminen epäonnistui: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in generateValuationAnalysis:", error);
    return {
      error: error.message || "Tuntematon virhe arvonmääritysanalyysin tuottamisessa",
      status: "error_generating_analysis"
    };
  }
}

/**
 * Creates a final valuation report object based on the analysis results,
 * structured for the frontend.
 */
export function createFinalReportStructure(
  analysisResult: any, // Result from generateValuationAnalysis
  financialAnalysis: any // Original financial analysis with calculated metrics
): any {
    // ... toteutus ennallaan ...
     let valuationRange = { low: 0, high: 0 };
    let mostLikelyValue = 0;
    let valuationMetrics = {}; // Initialize metrics object

    // Use the same logic as everywhere else to find the latest period
    const latestPeriod = getLatestPeriod(financialAnalysis);


    if (latestPeriod?.valuation_metrics) {
        valuationMetrics = latestPeriod.valuation_metrics; // Assign the whole metrics object
        // Use specific Equity value fields for range and most likely value
        valuationRange = {
            low: latestPeriod.valuation_metrics.equity_valuation_range?.low ?? 0,
            high: latestPeriod.valuation_metrics.equity_valuation_range?.high ?? 0
        };
        mostLikelyValue = latestPeriod.valuation_metrics.average_equity_valuation ?? 0;
    }

    // Structure matches ValuationReport.tsx expectations
    const finalReport = {
      key_points: analysisResult.key_points || { title: "Keskeiset havainnot", content: "Analyysia ei saatavilla." },
      analysis: analysisResult.analysis || {},
      recommendations: analysisResult.recommendations || [],
      valuation_numbers: {
        // Frontend expects these names
        range: valuationRange,
        most_likely_value: mostLikelyValue,
        valuation_rationale: analysisResult.valuation_rationale || "Arvonmäärityksen perusteluja ei saatavilla.",
        // Add other relevant metrics for display in frontend
        book_value: (valuationMetrics as any).book_value,
        calculated_net_debt: (valuationMetrics as any).calculated_net_debt,
        valuation_methods_in_average: (valuationMetrics as any).valuation_methods_in_average
      },
      // Include potential error from analysis generation
      error: analysisResult.error || null
    };

    return finalReport;
}


/**
 * Integration function that calls the valuation analysis generation
 * and structures the final report.
 */
export async function generateFinalAnalysis(
  companyName: string,
  financialAnalysis: any, // Contains normalized data + calculated metrics
  companyInfo: any,
  originalQuestions: any[] = [],
  userAnswers: Record<string, string> = {}
): Promise<any> {
    // ... toteutus ennallaan ...
      console.log(`Generating final analysis structure for ${companyName}`);

  // Check if necessary data (especially calculated metrics) is present
  const latestPeriodMetrics = financialAnalysis?.documents?.[0]?.sortedPeriods?.[0]?.valuation_metrics || 
                           financialAnalysis?.documents?.[0]?.financial_periods?.[0]?.valuation_metrics;
  if (!latestPeriodMetrics || Object.keys(latestPeriodMetrics).length === 0) {
      console.error("Missing calculated valuation metrics for final analysis:", financialAnalysis);
      return {
          error: "Laskettuja arvostusmetriikoita ei löytynyt lopullisen analyysin tekemiseen.",
          status: "error_missing_metrics"
      };
  }

  try {
    // 1. Generate the textual analysis using Gemini
    const analysisResult = await generateValuationAnalysis(
      companyName,
      financialAnalysis, // Pass data including metrics
      companyInfo,
      originalQuestions,
      userAnswers
    );

    // 2. Structure the final report for the frontend, combining analysis text and numbers
    const finalReport = createFinalReportStructure(analysisResult, financialAnalysis);

    // Check for errors during analysis generation
    if (analysisResult.error) {
        console.warn("Error occurred during analysis text generation, returning report with error:", analysisResult.error);
        // finalReport already includes the error field from analysisResult
    } else {
        console.log("Final analysis structure created successfully.");
    }

    return finalReport;

  } catch (error) {
    console.error("Error in generateFinalAnalysis orchestration:", error);
    return {
      error: error.message || "Virhe lopullisen analyysin koontamisessa",
      status: "error_final_analysis_orchestration"
    };
  }
}