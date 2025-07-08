// supabase/functions/analyze-post-dd-readiness/utils/response-utils.ts

export function validateResponse(responseText: string, type: 'post-dd-analysis') {
  try {
    // Yritä jäsentää JSON-vastaus
    const parsedResponse = JSON.parse(responseText);

    // Varmista, että vastaus sisältää vaaditut kentät
    if (type === 'post-dd-analysis') {
      if (!parsedResponse.kvantitatiivisetArviot || !parsedResponse.sanallinenYhteenveto) {
        console.warn(`Invalid ${type} response structure:`, parsedResponse);
        throw new Error("Vastaus ei sisällä vaadittuja kenttiä");
      }

      // Tarkista, että jokainen kategoria on olemassa
      const requiredCategories = [
        'taloudelliset', 'juridiset', 'asiakaskeskittyneisyys', 
        'henkilosto', 'operatiiviset', 'dokumentaatio', 'strategiset'
      ];

      // Kirjaa varoitus puuttuvista kentistä, mutta ei heitetä virhettä
      for (const category of requiredCategories) {
        if (!parsedResponse.kvantitatiivisetArviot[category]) {
          console.warn(`Warning: Missing category ${category} in response`);
        }
      }

      // Tarkista kategoriapainotukset
      if (!parsedResponse.kategoriapainotus) {
        console.warn("Warning: Missing kategoriapainotus in response");
      }
    }

    // Lisää aikakenttä, jos ei ole
    if (!parsedResponse.analyysiPvm) {
      parsedResponse.analyysiPvm = new Date().toISOString();
    }

    return parsedResponse;
  } catch (error) {
    console.error(`Error parsing ${type} response:`, error);
    console.error("Raw response:", responseText);
    throw new Error(`Vastauksen jäsennys epäonnistui: ${error instanceof Error ? error.message : "Tuntematon virhe"}`);
  }
}