// supabase/functions/generate-tasks/tasks.ts
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@^0.2.0";
import { ExitType, Timeline, Task, TaskRequest } from "./types.ts";
import { validateAndSanitizeTask, validateRequiredFields } from "./taskValidation.ts";

// The model name that should always be used for all Gemini API calls
const GEMINI_MODEL = "gemini-2.0-flash";

export async function generateTasks(
  companyId: string,
  assessmentId: string, 
  valuationId: string,
  exitType: ExitType,
  timeline: Timeline,
  identifiedIssues: string[],
  userId: string,
  authToken: string
): Promise<Task[]> {
  console.log(`Generating tasks for company: ${companyId}, assessment: ${assessmentId}, valuation: ${valuationId}`);
  console.log(`ExitType: ${exitType}, Timeline: ${timeline}`);
  console.log(`User ID: ${userId}`);

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ympäristömuuttuja puuttuu");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Get company data from database
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');


    if (!SUPABASE_URL ) {
      throw new Error("Supabase-asetuksia ei ole määritetty");
    }

    if (!userId || !authToken) {
      throw new Error("Käyttäjätunnus tai authToken puuttuu");
    }

    // Fetch all necessary data from Supabase with user authentication
    const [company, assessment, valuation] = await Promise.all([
      fetchCompanyData(authToken, SUPABASE_URL, companyId, userId),
      fetchAssessmentData(authToken, SUPABASE_URL, assessmentId, userId),
      fetchValuationData(authToken, SUPABASE_URL, valuationId, userId)
    ]);

    if (!company || !assessment || !valuation) {
      throw new Error("Tarvittavia tietoja ei löytynyt");
    }

    console.log("Haettu yrityksen, arvioinnin ja arvonmäärityksen tiedot onnistuneesti");

    // Format identified issues for the prompt
    const formattedIssues = identifiedIssues.map(issue => `- ${issue}`).join('\n');

    // Create enhanced prompt for task generation
    const prompt = `
    Aiempien keskustelujen ja analyysien perusteella luo konkreettinen tehtäväkokonaisuus, jonka toteuttamalla
    yritys saadaan myyntikuntoon. Käyttäjän omistajanvaihdostyyppi on ${exitType}, aikataulu ${timeline}.

    Analyysissa on tunnistettu seuraavat kehityskohteet:
    ${formattedIssues}

    Yrityksen tiedot:
    ${JSON.stringify(company, null, 2)}

    Arvioinnin tulokset:
    ${JSON.stringify(assessment.results || {}, null, 2)}

    Arvonmäärityksen tulokset:
    ${JSON.stringify(valuation.results || {}, null, 2)}

    Luo 12-15 konkreettista, toteuttamiskelpoista tehtävää perustuen yrityksen nykytilanteeseen ja analyyseista saatuihin tietoihin.
    Keskity erityisesti niihin osa-alueisiin, joissa on eniten kehitettävää arvioinnin perusteella.

    Jokaisen tehtävän tulee olla:
    - Konkreettinen ja selkeästi määritelty
    - Mitattava ja seurattava
    - Toteuttamiskelpoinen annetuilla resursseilla
    - Suoraan kytköksissä myyntikuntoon parantamiseen

    Jaa tehtävät seuraaviin kategorioihin:
    - financial (talous)
    - legal (sopimukset ja juridiikka)
    - operations (toiminta)
    - documentation (dokumentaatio)
    - customers (asiakkaat)
    - personnel (henkilöstö)
    - strategy (strategia)

    Huomioi seuraavat tehtävätyypit:
    - checkbox (yksinkertainen kyllä/ei-tehtävä)
    - multiple_choice (monivalintatehtävä)
    - text_input (tekstimuotoinen vastaus)
    - document_upload (tiedoston lataus)
    - explanation (laajempi selite)
    - contact_info (yhteystiedon lisääminen)

    Jokaisen tehtävän kohdalla määritä:
    - Kiireellisyys/prioriteetti (high, medium, low) perustuen vaikuttavuuteen ja kriittisyyteen
    - Vaikutus myyntikuntoon (impact: high, medium, low)
    - Selkeä kuvaus mitä pitää tehdä ja miksi
    - Konkreettinen, mitattava odotettu lopputulos
    - Arvioitu aika tehtävän suorittamiseen (estimated_time), sisällyttäen myös pitkäkestoisia tehtäviä (6-12kk)
    - Lisää 2-3 pitkäkestoista seurantatehtävää (esim. asiakastyytyväisyyden mittaus 12kk yms.)
    - Mahdolliset riippuvuudet muista tehtävistä (dependencies)
    - Monivalintatehtäville (multiple_choice) määritä vaihtoehdot (options)

    Älä luo:
    - Liian yleisiä tai epämääräisiä tehtäviä
    - Tehtäviä ilman selkeää yhteyttä myyntikuntoisuuteen
    - Epärealistisia tai liian laajoja tehtäviä
    - Tehtäviä ilman konkreettista lopputulosta

    Palauta tehtävät JSON-muodossa:
    [
      {
        "title": "Selkeä, toimintaa kuvaava otsikko",
        "description": "Yksityiskohtainen kuvaus tehtävästä ja sen tavoitteista",
        "category": "financial|legal|operations|documentation|customers|personnel|strategy",
        "type": "checkbox|multiple_choice|text_input|document_upload|explanation|contact_info",
        "priority": "high|medium|low",
        "impact": "high|medium|low",
        "estimated_time": "X tuntia / X päivää/ X kuukautta",
        "completion_status": "not_started",
        "options": ["Vaihtoehto 1", "Vaihtoehto 2", "Vaihtoehto 3"],
        "depends_on_indexes": [1, 3], // Tehtävä riippuu listan tehtävistä indekseillä 1 ja 3 (nolla-pohjainen, eli ensimmäinen tehtävä on 0)
        "dependencies": [] // Tämä jätetään tyhjäksi, täytetään myöhemmin
      }
    ]

    HUOM! Aseta alustava completion_status aina "not_started". Options-kenttä määritellään vain, jos tyyppi on multiple_choice.
    HUOM!: Tehtävä ei koskaan saa olla riippuvainen itsestään. Varmista, että depends_on_indexes-listassa ei koskaan esiinny tehtävän omaa indeksiä. Esimerkiksi tehtävässä indeksillä 3 ei saa olla 3 depends_on_indexes-listassa.
    Älä määrittele dependencies-kenttää, käytä sen sijaan depends_on_indexes-kenttää viittaamaan tässä samassa listassa oleviin tehtäviin, ja se riippuvuuksia ei toki aina ole.
    `;

    console.log(`Sending task generation request to Gemini (${GEMINI_MODEL})`);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("Gemini vastasi onnistuneesti");

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const tasksData = JSON.parse(jsonString) as Task[];

      if (!Array.isArray(tasksData)) {
        throw new Error("Vastaus ei sisällä tehtäviä oikeassa muodossa");
      }

      console.log(`Jäsennettiin ${tasksData.length} tehtävää onnistuneesti`);

      return tasksData;

    } catch (error) {
      console.error("Virhe jäsennettäessä Geminin vastausta:", error);
      console.log("Alkuperäinen vastaus:", text);
      throw new Error(`Virhe jäsennettäessä Geminin vastausta: ${error.message}`);
    }

  } catch (error) {
    console.error("Virhe tehtävien generoinnissa:", error);
    throw error;
  }
}

// Fetch company, assessment and valuation data using JWT authentication
async function fetchCompanyData(token: string, supabaseUrl: string, companyId: string, userId: string) {
  // Käytetään supabasea jossa RLS tarkistaa käyttäjän oikeudet
  const response = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${companyId}&user_id=eq.${userId}&select=*`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa yritystietoja: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("Yritystä ei löytynyt tai käyttäjällä ei ole oikeuksia siihen");
  }
  return data[0];
}

async function fetchAssessmentData(token: string, supabaseUrl: string, assessmentId: string, userId: string) {
  // Käytetään supabasea jossa RLS tarkistaa käyttäjän oikeudet
  const response = await fetch(`${supabaseUrl}/rest/v1/assessments?id=eq.${assessmentId}&user_id=eq.${userId}&select=*,results`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa arvioinnin tietoja: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("Arviointia ei löytynyt tai käyttäjällä ei ole oikeuksia siihen");
  }
  return data[0];
}

async function fetchValuationData(token: string, supabaseUrl: string, valuationId: string, userId: string) {
  // Käytetään supabasea jossa RLS tarkistaa käyttäjän oikeudet
  const response = await fetch(`${supabaseUrl}/rest/v1/valuations?id=eq.${valuationId}&user_id=eq.${userId}&select=*,results`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Virhe haettaessa arvonmäärityksen tietoja: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("Arvonmääritystä ei löytynyt tai käyttäjällä ei ole oikeuksia siihen");
  }
  return data[0];
}

export async function saveTasks(
  token: string, 
  supabaseUrl: string, 
  companyId: string, 
  assessmentId: string, 
  valuationId: string, 
  tasks: Task[], 
  userId: string
) {
  console.log(`Saving ${tasks.length} tasks to database for user ${userId}`);

  // Tallenna tehtävät ensin ilman riippuvuuksia
  const tasksForSaving = tasks.map((task, index) => {
    // Erotellaan depends_on_indexes omaksi muuttujakseen, jotta sitä ei tallenneta tietokantaan
    const { depends_on_indexes, ...rawTaskData } = task;

    // Validoi enum-tyyppiset kentät
    const validatedEnums = validateAndSanitizeTask(task, index);

    // Validoi pakolliset tekstikentät
    const validatedRequired = validateRequiredFields(task, index);

    const cleanedTaskData = {
      title: validatedRequired.title,
      description: validatedRequired.description,
      category: validatedEnums.category,
      type: validatedEnums.type,
      priority: validatedEnums.priority,
      impact: validatedEnums.impact,
      estimated_time: task.estimated_time || null,
      expected_outcome: task.expected_outcome || null,
      completion_status: validatedEnums.completion_status,
      company_id: companyId,
      assessment_id: assessmentId,
      valuation_id: valuationId,
      dependencies: [],
      dd_related: false,
      options: validatedEnums.type === 'multiple_choice' ? (task.options || []) : null,
    };

    return cleanedTaskData;
  });

  // Log validation summary
  console.log(`Validoitu ${tasksForSaving.length} tehtävää tallennusta varten`);

  // Tallenna tehtävät ja pyydä vastauksena tallennetut tehtävät ID:ineen
  const response = await fetch(`${supabaseUrl}/rest/v1/company_tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // Tärkeä: pyydä vastausdata
    },
    body: JSON.stringify(tasksForSaving)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Tallennusvirhe - Status: ${response.status}, Virhe: ${errorText}`);
    console.error(`Yritetty data ensimmäisestä tehtävästä: ${JSON.stringify(tasksForSaving[0], null, 2)}`);
    throw new Error(`Virhe tallennettaessa tehtäviä tietokantaan: ${response.statusText}, ${errorText}`);
  }

  // Hae tallennetut tehtävät, joilla on nyt ID:t
  const savedTasks = await response.json();
  console.log(`${savedTasks.length} tehtävää tallennettu onnistuneesti, päivitetään riippuvuudet...`);

  // Päivitä riippuvuudet
  const dependencyUpdates = [];

  // Käy läpi alkuperäiset tehtävät ja päivitä riippuvuudet
  for (let i = 0; i < tasks.length; i++) {
    const originalTask = tasks[i];
    const savedTask = savedTasks[i];

    if (originalTask.depends_on_indexes && originalTask.depends_on_indexes.length > 0) {
      // Suodata pois itseriippuvuudet
      const filteredIndexes = originalTask.depends_on_indexes.filter(index => index !== i);

      if (originalTask.depends_on_indexes.length !== filteredIndexes.length) {
        console.warn(`Tehtävä ${i+1} (${originalTask.title}): Poistettu itseriippuvuus`);
      }

      // Muunna indeksit todellisiksi ID:iksi
      const dependencyIds = filteredIndexes
        .map(index => {
          // Varmista että indeksi on kelvollinen
          if (index >= 0 && index < savedTasks.length) {
            return savedTasks[index].id;
          }
          console.warn(`Tehtävä ${i+1}: Virheellinen riippuvuusindeksi ${index}, ohitetaan`);
          return null;
        })
        .filter(id => id !== null); // Poista null-arvot

      if (dependencyIds.length > 0) {
        // Päivitä tehtävä dependencies-kentällä
        dependencyUpdates.push(
          fetch(`${supabaseUrl}/rest/v1/company_tasks?id=eq.${savedTask.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dependencies: dependencyIds })
          })
        );
      }
    }
  }

  // Suorita kaikki päivitykset
  if (dependencyUpdates.length > 0) {
    await Promise.all(dependencyUpdates);
    console.log(`Päivitetty ${dependencyUpdates.length} tehtävän riippuvuudet`);
  }

  console.log("Tehtävien tallennus ja riippuvuuksien päivitys valmis");
  return savedTasks;
}