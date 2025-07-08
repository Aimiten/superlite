import { CompanyData, FinancialData } from "../types/dcf-types.ts";
import { parseGeminiJsonResponse } from "../../valuation/utils/gemini-parser.ts";

export interface DCFVariantSelection {
  variant: 'full_dcf' | 'simplified_dcf' | 'forward_looking_dcf';
  reasoning: string;
  confidence_score: number;
  data_quality_assessment: string;
  recommended_approach: string;
}

export async function selectDCFVariant(
  companyData: CompanyData,
  financialData: FinancialData
): Promise<DCFVariantSelection> {
  
  // Extract info about financial periods
  const periodInfo = {
    periods_count: financialData.financial_periods.length,
    years: financialData.financial_periods.map(p => p.year),
    has_revenue: financialData.financial_periods.some(p => p.income_statement.revenue > 0),
    has_ebitda: financialData.financial_periods.some(p => (p.income_statement.ebitda || 0) > 0),
    data_quality_score: financialData.data_quality?.completeness_score || 0
  };

  const prompt = `Olet kokenut yritysjärjestelyihin erikoistunut rahoitusanalyytikko. Analysoi yrityksen tiedot ja päätä sopivin DCF-variantti perusteellisen arvioinnin perusteella.

YRITYKSEN PERUSTIEDOT:
- Nimi: ${companyData.name}
- Toimiala: ${companyData.industry || 'määrittelemätön'}
- Kuvaus: ${companyData.description || 'ei kuvausta'}
- Yritysmuoto: ${companyData.company_type || 'tuntematon'}

SAATAVILLA OLEVA TALOUSDATA:
- Tilikausia: ${periodInfo.periods_count}
- Vuodet: ${periodInfo.years.join(', ')}
- Liikevaihto saatavilla: ${periodInfo.has_revenue ? 'Kyllä' : 'Ei'}
- EBITDA saatavilla: ${periodInfo.has_ebitda ? 'Kyllä' : 'Ei'}
- Datan laatupisteet: ${periodInfo.data_quality_score}

TEHTÄVÄ: Päätä mikä DCF-variantti sopii parhaiten tälle yritykselle analysoimalla seuraavat tekijät:

1. HISTORIALLISEN DATAN ARVIOINTI:
   - Arvioi kuinka monta merkityksellistä tilikautta on todennäköisesti saatavilla
   - Huomioi dokumenttien määrä ja tyypit
   - Arvio datan laadusta ja luotettavuudesta

2. LIIKETOIMINTAMALLIN ANALYYSI:
   - Tunnista yrityksen kehitysvaihe (startup/growth/mature/turnaround)
   - Arvioi kassavirtojen ennakoitavuutta toimialan perusteella
   - Huomioi liiketoimintamallin vakaus vs. volatiliteetti

3. TOIMIALAKOHTAISET ERITYISPIIRTEET:
   - SaaS/tech: Nopeasti muuttuvat trendit, tarvitsee startup-fokuksen
   - Biotech/pharma: Pitkät kehityssyklit, erityisriskit
   - Kiinteistöt: Vakaita kassavirtoja, asset-heavy
   - Teollisuus: Pääomaintensiivinen, sykliset trendit
   - Palvelut: Henkilöriippuvuus, skalautuvuus

DCF-VARIANTIT:

FULL_DCF:
- Edellyttää: 3+ merkityksellistä tilikautta
- Sopii: Kypsille yrityksille, vakaille kassavirroille
- Metodologia: Perinteinen DCF täydellä historiallisella trend-analyysilla
- Luotettavuus: Korkea, jos data riittää

SIMPLIFIED_DCF:
- Edellyttää: 2-3 tilikautta tai rajoitetusti historiallista dataa
- Sopii: Kasvuyritykset, toimialabenchmarkit painottuvat
- Metodologia: DCF yhdistettynä vahvasti toimialavertailuihin
- Luotettavuus: Keskitaso, vaatii varovaisuutta

FORWARD_LOOKING_DCF:
- Edellyttää: 1-2 tilikautta tai startup/early-stage
- Sopii: Startupit, disruptiiviset liiketoimintamallit
- Metodologia: Revenue-based projections, kasvumetriikat fokuksessa
- Luotettavuus: Matala, vaatii scenario-painotusta

ARVIOINTIPERUSTEET:
- Jos yritys on selkeästi startup/pre-revenue → forward_looking_dcf
- Jos yritys on toiminut 5+ vuotta ja vakaat kassavirrat → full_dcf
- Jos yritys on kasvuvaiheessa tai rajoitetusti dataa → simplified_dcf
- Jos toimiala on erittäin volatilli (tech, biotech) → harkitse simplified tai forward_looking
- Jos toimiala on vakaa (utilities, mature manufacturing) → suosi full_dcf

Palauta analyysi JSON-muodossa:

{
  "variant": "full_dcf|simplified_dcf|forward_looking_dcf",
  "reasoning": "Perustelu valinnalle (MAX 50 SANAA)",
  "confidence_score": [1-10 luottamus valintaan],
  "data_quality_assessment": "Arvio datan laadusta (MAX 30 SANAA)",
  "recommended_approach": "Suositukset toteutuksesta (MAX 40 SANAA)"
}

KRIITTINEN OHJE: Pidä KAIKKI tekstikentät ERITTÄIN LYHYINÄ! Jokainen tekstikenttä saa olla MAX 2-3 lausetta.
Vastaa PELKÄSTÄÄN JSON-objekti ilman muita selityksiä tai markdown-merkintöjä.`;

  console.log("Method Selector: Analyzing company for DCF variant selection...");
  
  try {
    // Use Gemini for method selection
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    
    const { GoogleGenerativeAI } = await import("https://esm.sh/@google/generative-ai@0.23.0");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8000,
        responseMimeType: "application/json",
      }
    });
    
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    
    // Since we use responseMimeType: "application/json", Gemini returns valid JSON directly
    let selection;
    try {
      selection = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Method Selector: Failed to parse JSON response:", parseError);
      console.log("Method Selector: Raw response:", responseText);
      
      // Fallback to parser if direct parse fails
      selection = parseGeminiJsonResponse(responseText, {
        expectFormat: "object",
        logPrefix: "Method Selector"
      });
    }
    
    console.log(`Method Selector: Selected variant '${selection.variant}' with confidence ${selection.confidence_score}/10`);
    console.log(`Method Selector: Reasoning - ${selection.reasoning}`);
    
    return selection;
    
  } catch (error) {
    console.error("Method Selector failed:", error);
    
    // Fallback to simplified_dcf if selection fails
    console.log("Method Selector: Falling back to simplified_dcf due to selection error");
    return {
      variant: 'simplified_dcf',
      reasoning: 'Automaattinen valinta: Method selector -virhe, käytetään simplified DCF:ää turvallisena vaihtoehtona',
      confidence_score: 5,
      data_quality_assessment: 'Tuntematon - method selector epäonnistui',
      recommended_approach: 'Käytetään simplified DCF:ää vahvalla toimialavertailulla'
    };
  }
}