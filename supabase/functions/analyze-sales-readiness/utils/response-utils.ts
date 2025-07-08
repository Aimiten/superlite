// supabase/functions/analyze-sales-readiness/utils/response-utils.ts

export function validateResponse(responseText: string, type: 'sales-readiness' | 'dd-risk') {
  try {
    // Jos responseText on jo objekti (eli se on tullut response.parsed kautta), 
    // käsitellään sitä suoraan
    if (typeof responseText === 'object' && responseText !== null) {
      console.log(`Response is already an object, likely from response.parsed`);

      // Varmistetaan että objektissa on vaaditut kentät
      ensureRequiredFields(responseText, type);
      return responseText;
    }

    // Sanitize the response before parsing
    const sanitizedText = sanitizeJsonResponse(responseText);

    // Log comparison if there were changes (for debugging)
    if (sanitizedText !== responseText) {
      console.log(`JSON sanitized from ${responseText.length} to ${sanitizedText.length} chars`);
    }

    // Check for potential truncation
    if (detectTruncation(sanitizedText)) {
      console.warn("Detected potentially truncated response");
      const completedText = completeJsonStructure(sanitizedText);
      console.log(`Completed JSON structure (added ${completedText.length - sanitizedText.length} chars)`);

      try {
        const parsedResponse = JSON.parse(completedText);
        console.log("Successfully parsed completed JSON");

        // Add validation logic here (simplified for brevity)
        ensureRequiredFields(parsedResponse, type);
        return parsedResponse;
      } catch (completionError) {
        console.warn("Completed structure still invalid, continuing with recovery attempts");
        // Continue to normal flow
      }
    }

    // Try to parse the sanitized JSON response
    const parsedResponse = JSON.parse(sanitizedText);

    // Varmista, että vastaus sisältää vaaditut kentät
    ensureRequiredFields(parsedResponse, type);

    return parsedResponse;
  } catch (error) {
    console.error(`Error parsing ${type} response:`, error);

    // Try more aggressive recovery methods if normal parsing fails
    try {
      console.log("Attempting recovery with JSON repair...");
      const repairedJson = attemptJsonRecovery(responseText, type);

      // If recovery succeeds, log and return
      console.log("JSON successfully repaired!");
      return repairedJson;
    } catch (recoveryError) {
      // If recovery also fails, log both errors
      console.error("Recovery also failed:", recoveryError);
      console.error("Raw response:", responseText.substring(0, 500) + "..."); 
      throw new Error(`${type === 'sales-readiness' ? 'Myyntikuntoisuusanalyysin' : 'DD-riskianalyysin'} jäsennys epäonnistui: ${error.message}`);
    }
  }
}

function ensureRequiredFields(parsedResponse: any, type: 'sales-readiness' | 'dd-risk') {
  if (type === 'sales-readiness') {
    // Tarkista myyntikuntoisuusanalyysin rakenne
    if (!parsedResponse.kvantitatiivisetArviot || !parsedResponse.sanallinenYhteenveto) {
      console.warn(`Invalid ${type} response structure: missing main fields`);
      throw new Error("Myyntikuntoisuusanalyysin vastaus ei sisällä pääkenttiä");
    }

    // Tarkista kategoriakentät
    const requiredCategories = [
      'taloudelliset', 'juridiset', 'asiakaskeskittyneisyys', 
      'henkilosto', 'operatiiviset', 'dokumentaatio', 'strategiset'
    ];

    for (const category of requiredCategories) {
      if (!parsedResponse.kvantitatiivisetArviot[category]) {
        console.warn(`Invalid ${type} response structure: missing category ${category}`);
        // Älä heita virhettä, mutta kirjaa varoitus lokiin
        console.warn(`Puuttuva kategoria: ${category}`);
      }
    }
  } 
  else if (type === 'dd-risk') {
    if (!parsedResponse.riskiKategoriat || !parsedResponse.kokonaisRiskitaso || !parsedResponse.yhteenveto) {
      console.warn(`Invalid ${type} response structure`);
      throw new Error("DD-riskianalyysin vastaus ei sisällä vaadittuja kenttiä");
    }
  }

  // Lisää aikakenttä, jos ei ole
  if (!parsedResponse.analyysiPvm) {
    parsedResponse.analyysiPvm = new Date().toISOString();
  }
}

// Function to sanitize JSON responses
function sanitizeJsonResponse(text: string): string {
  // Trim whitespace
  let sanitized = text.trim();

  // Remove any markdown code block markers if present
  sanitized = sanitized.replace(/^```json\s+/m, '').replace(/\s+```$/m, '');

  // Handle unclosed quotes in strings (a common LLM issue)
  sanitized = fixUnterminatedStrings(sanitized);

  return sanitized;
}

// Function to attempt to fix unterminated strings
function fixUnterminatedStrings(jsonText: string): string {
  // Advanced approach to find and fix unterminated strings
  // This pattern looks for quoted strings that aren't properly terminated
  return jsonText.replace(/("[^"\\]*(?:\\.[^"\\]*)*)((?=,|}|]|$))/g, '$1"');
}

// Check for potential truncation in the response
function detectTruncation(text: string): boolean {
  // Check if the text ends abruptly with a truncated JSON structure
  if (!text.trim().endsWith('}')) return true;

  // Check for unbalanced braces
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;

  return openBraces !== closeBraces;
}

// Function to attempt to complete JSON structure
function completeJsonStructure(text: string): string {
  // Count opening and closing braces
  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;

  // Add missing closing braces
  let fixed = text;
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}';
  }

  // Try to identify and fix missing quotes around keys or values
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

  return fixed;
}

// More aggressive JSON recovery function as a fallback
function attemptJsonRecovery(text: string, type: 'sales-readiness' | 'dd-risk'): any {
  // First attempt: find the main JSON object by looking for outer braces
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      // Try to parse just the matched JSON object
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Continue to more aggressive methods if this fails
      console.log("First recovery attempt failed, trying more aggressive methods");
    }
  }

  // Second attempt: Create a minimal valid structure based on expected schema
  if (type === 'sales-readiness') {
    const result: any = {
      analyysiPvm: new Date().toISOString(),
      perustuuTehtaviin: 0,
      kvantitatiivisetArviot: {},
      kategoriapainotus: {
        taloudelliset: 0.15,
        juridiset: 0.15,
        asiakaskeskittyneisyys: 0.10,
        henkilosto: 0.20,
        operatiiviset: 0.10,
        dokumentaatio: 0.10,
        strategiset: 0.15,
        sopimusrakenne: 0.05,
        painotusperustelu: "Automaattisesti luotu virhetilanteessa."
      },
      sanallinenYhteenveto: "Analyysin muodostaminen epäonnistui. Tämä on automaattisesti generoitu vaihtoehtoinen vastaus. Ole hyvä ja aja analyysi uudelleen."
    };

    // Extract key categories
    const categories = ['taloudelliset', 'juridiset', 'asiakaskeskittyneisyys', 
                        'henkilosto', 'operatiiviset', 'dokumentaatio', 'strategiset', 'sopimusrakenne'];

    categories.forEach(category => {
      result.kvantitatiivisetArviot[category] = { 
        kokonaisarvio: 5, // Default fallback value
        perustelu: "Automaattinen arvo JSON-korjauksen jälkeen - tarkista manuaalisesti.",
        arvovaikutus: {
          vaikutusprosentti: 0,
          perustelu: "Automaattinen arvo JSON-korjauksen jälkeen."
        }
      };

      // Add additional category-specific fields
      if (category === 'taloudelliset') {
        result.kvantitatiivisetArviot[category].vakaus = 5;
        result.kvantitatiivisetArviot[category].kannattavuus = 5;
      } else if (category === 'juridiset') {
        result.kvantitatiivisetArviot[category].sopimusriskit = 5;
        result.kvantitatiivisetArviot[category].immateriaalisuoja = 5;
      } else if (category === 'asiakaskeskittyneisyys') {
        result.kvantitatiivisetArviot[category].arvioituTop1Prosentti = null;
        result.kvantitatiivisetArviot[category].arvioituTop5Prosentti = null;
      } else if (category === 'henkilosto') {
        result.kvantitatiivisetArviot[category].arvioituTaso = "unknown";
        result.kvantitatiivisetArviot[category].havaittuLievennys = {
          seuraajasuunnitelma: false,
          avainSopimukset: false,
          tietojenSiirto: false
        };
      } else if (category === 'operatiiviset') {
        result.kvantitatiivisetArviot[category].prosessit = 5;
        result.kvantitatiivisetArviot[category].teknologia = 5;
      } else if (category === 'dokumentaatio') {
        result.kvantitatiivisetArviot[category].arvioituTasoPisteet = 50;
        result.kvantitatiivisetArviot[category].puutteet = ["Automaattisesti generoitu - puutteiden määritys epäonnistui"];
      } else if (category === 'strategiset') {
        result.kvantitatiivisetArviot[category].kilpailuedut = 5;
        result.kvantitatiivisetArviot[category].kasvupotentiaali = 5;
      } else if (category === 'sopimusrakenne') {
        result.kvantitatiivisetArviot[category].arvioituSopimuspohjainenProsentti = null;
        result.kvantitatiivisetArviot[category].arvioituKeskimKestoVuosina = null;
      }
    });

    return result;
  } else if (type === 'dd-risk') {
    // Create a minimal valid DD risk analysis
    return {
      analyysiPvm: new Date().toISOString(),
      kokonaisRiskitaso: 5,
      riskiKategoriat: [
        {
          kategoria: "yleiset",
          riskitaso: 5,
          kuvaus: "Automaattisesti generoitu riskiarvio",
          vaikutus: "medium",
          havainnot: ["Automaattisesti generoitu - ei todellisia havaintoja"],
          toimenpideSuositukset: ["Aja analyysi uudelleen"]
        }
      ],
      keskeisimmatLöydökset: ["Analyysin muodostus epäonnistui - aja uudelleen"],
      yhteenveto: "Tämä on automaattisesti generoitu vaihtoehtoinen riskianalyysi. Ole hyvä ja aja analyysi uudelleen."
    };
  }

  // Return minimal valid object if all else fails
  return {
    analyysiPvm: new Date().toISOString(),
    virhe: "Jäsennys epäonnistui täysin",
    virheviesti: "Automaattisesti generoitu virheviesti: JSON-jäsennys epäonnistui"
  };
}