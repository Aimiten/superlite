// supabase/functions/analyze-post-dd-readiness/prompts/post-dd-analysis-prompt.ts

interface PostDDAnalysisPromptParams {
  originalSalesReadinessAnalysis: any;
  ddRiskAnalysis: any;
  ddTasks: any[];
  companyData: any;
  documents?: any[];
  previousAnalysis?: any;
}

export function createPostDDAnalysisPrompt(params: PostDDAnalysisPromptParams): string {
  const { originalSalesReadinessAnalysis, ddRiskAnalysis, ddTasks, companyData, documents, previousAnalysis } = params;

  // Company information context
  const companyContext = companyData ? `
  Yrityksen perustiedot:
  - Nimi: ${companyData.name || 'Ei tiedossa'}
  - Toimiala: ${companyData.industry || 'Ei tiedossa'}
  - Yritystyyppi: ${companyData.company_type || 'Ei tiedossa'}
  - Perustamisvuosi: ${companyData.founded || 'Ei tiedossa'}
  - Työntekijöiden määrä: ${companyData.employees || 'Ei tiedossa'}
  - Kuvaus: ${companyData.description || 'Ei kuvausta saatavilla'}
  ` : 'Yrityksen tarkemmat tiedot eivät ole saatavilla.';

  // DD tasks summary
  const completedDDTasks = ddTasks.filter(task => task.completion_status === "completed");

  let ddTasksSummary = `
# DUE DILIGENCE -TEHTÄVÄT (${ddTasks.length} kpl, ${completedDDTasks.length} suoritettu)
`;

  // Group DD tasks by category
  const tasksByCategory: Record<string, any[]> = {};
  ddTasks.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push(task);
  });

  // Add tasks by category
  Object.entries(tasksByCategory).forEach(([category, tasks]) => {
    ddTasksSummary += `
## ${category.toUpperCase()} (${tasks.length} kpl)
`;

    tasks.forEach(task => {
      ddTasksSummary += `
- Tehtävä: ${task.title}
  Status: ${task.completion_status}
  Kuvaus: ${task.description}
  ${task.task_responses && task.task_responses.length > 0 
    ? `Vastaus: ${task.task_responses[0].text_response || 'Tiedostovastaus'}` 
    : 'Ei vastausta'}
`;
    });
  });

  // Documentation section
  let documentSection = '';
  if (documents && documents.length > 0) {
    documentSection = `
# DOKUMENTAATIO
Saatavilla olevat dokumentit (${documents.length} kpl):
${documents.map(doc => `- ${doc.name} (${doc.document_type || 'Dokumentti'})`).join('\n')}

TÄRKEÄÄ: Kaikki yllä mainitut dokumentit on sisällytetty tähän pyyntöön koko sisällöllään.
Tutki dokumentteja huolellisesti niiden sisältämien tietojen hyödyntämiseksi analyysissä.
Huomioi erityisesti dokumenteissa olevat tiedot, jotka voivat vaikuttaa due diligence -toimenpiteiden ja
korjausten vaikutusten arviointiin.
`;
  }

  // Previous analysis information
  let previousAnalysisSection = '';  
  if (previousAnalysis) {
    previousAnalysisSection = `
# AIEMPI ANALYYSI
Seuraavassa on viimeisin analyysi (sisältö on vain kontekstina, käytä silti alla olevaa JSON-mallirakennetta vastauksessasi):

${JSON.stringify(previousAnalysis.sales_readiness_analysis || {}, null, 2)}

## AIEMMAT SÄÄTÖTEKIJÄT
${JSON.stringify(previousAnalysis.adjustment_factors || {}, null, 2)}
`;
  }

  // Original sales readiness analysis
  const salesReadinessSection = `
# ALKUPERÄINEN MYYNTIKUNTOISUUSANALYYSI
${JSON.stringify(originalSalesReadinessAnalysis, null, 2)}
`;

  // Required JSON model with clear instructions
  const responseFormatInstruction = `
# VAADITTU VASTAUSMUOTO
Vastaa JSON-muodossa TÄSMÄLLEEN tätä rakennetta noudattaen:

{
  "analyysiPvm": "YYYY-MM-DDTHH:MM:SSZ",
  "perustuuTehtaviin": <suoritettujen tehtävien lukumäärä>,
  "kvantitatiivisetArviot": {
    "taloudelliset": {
      "kokonaisarvio": <numero 1-10>,
      "vakaus": <numero 1-10>,
      "kannattavuus": <numero 1-10>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "juridiset": {
      "kokonaisarvio": <numero 1-10>,
      "sopimusriskit": <numero 1-10>,
      "immateriaalisuoja": <numero 1-10>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "asiakaskeskittyneisyys": {
      "kokonaisarvio": <numero 1-10>,
      "arvioituTop1Prosentti": <numero | null>,
      "arvioituTop5Prosentti": <numero | null>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "henkilosto": {
      "kokonaisarvio": <numero 1-10>,
      "arvioituTaso": "critical | high | moderate | low | unknown",
      "havaittuLievennys": {
        "seuraajasuunnitelma": <boolean>,
        "avainSopimukset": <boolean>,
        "tietojenSiirto": <boolean>
      },
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "operatiiviset": {
      "kokonaisarvio": <numero 1-10>,
      "prosessit": <numero 1-10>,
      "teknologia": <numero 1-10>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "dokumentaatio": {
      "arvioituTasoPisteet": <numero | null>,
      "puutteet": ["puute 1", "puute 2"],
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "strategiset": {
      "kokonaisarvio": <numero 1-10>,
      "kilpailuedut": <numero 1-10>,
      "kasvupotentiaali": <numero 1-10>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    },
    "sopimusrakenne": {
      "arvioituSopimuspohjainenProsentti": <numero | null>,
      "arvioituKeskimKestoVuosina": <numero | null>,
      "perustelu": "yksityiskohtainen perustelu",
      "arvovaikutus": {
        "vaikutusprosentti": <numero>,
        "perustelu": "yksityiskohtainen perustelu vaikutuksesta"
      }
    }
  },
  "kategoriapainotus": {
    "taloudelliset": <numero 0-1>,
    "juridiset": <numero 0-1>,
    "asiakaskeskittyneisyys": <numero 0-1>,
    "henkilosto": <numero 0-1>,
    "operatiiviset": <numero 0-1>,
    "dokumentaatio": <numero 0-1>,
    "strategiset": <numero 0-1>,
    "sopimusrakenne": <numero 0-1>,
    "painotusperustelu": "selitys miksi painotukset ovat juuri nämä tässä yrityksessä"
  },
  "riskienLieventaminen": {
    "alkuperainenKokonaisRiskitaso": <numero 1-10>,
    "paivitettyKokonaisRiskitaso": <numero 1-10>,
    "riskikategoriat": [
      {
        "kategoria": "string",
        "alkuperainenRiskitaso": <numero 1-10>,
        "paivitettyRiskitaso": <numero 1-10>,
        "muutosPerustelu": "yksityiskohtainen perustelu muutokselle",
        "jaljellaolevat_toimenpiteet": ["toimenpide 1", "toimenpide 2"]
      }
    ],
    "yhteenveto": "kattava yhteenveto riskien lieventämisen edistymisestä"
  },
  "sanallinenYhteenveto": "kattava yhteenveto myyntikuntoisuudesta"
}

TÄRKEÄÄ: Huomioi seuraavat asiat JSON-vastauksessasi:
1. Varmista, että jokainen lainausmerkki (") on oikein suljettu
2. Älä käytä kenoviivoja (\\) merkkijonoissa, sillä ne voivat aiheuttaa jäsennysvirheitä
3. Älä käytä "..." tai placeholder-tekstejä vaan tuota täydelliset arvot kaikkiin kenttiin
4. Vältä erikoismerkkejä ja vahvoja muotoiluja pitkissä tekstikentissä
5. Täytä puuttuvat arvot null-arvoilla, ei tyhjillä merkkijonoilla
6. Varmista, että kategoriapainotuksen summa on täsmälleen 1.0
7. Riskien lieventäminen -osiossa vertaa alkuperäistä riskitasoa päivitettyyn tasoon ja perustele muutokset
`;

  // Create final prompt
  const riskAnalysisSection = ddRiskAnalysis ? `
# DUE DILIGENCE -RISKIT
${JSON.stringify(ddRiskAnalysis, null, 2)}
` : `
# DUE DILIGENCE -RISKIT
Alkuperäistä riskianalyysia ei ole saatavilla. Luo riskienLieventaminen-osion arviot suoritettujen DD-tehtävien ja muun saatavilla olevan materiaalin perusteella.
`;

  const prompt = `
Olet kokenut yrityskaupan myyntikuntoisuuden asiantuntija ja due diligence -analyytikko. Tehtäväsi on arvioida, miten due diligence -korjaustoimenpiteet ovat vaikuttaneet yrityksen myyntikuntoisuuteen ja tunnistettuihin riskeihin.

${companyContext}

${previousAnalysisSection}

${salesReadinessSection}

${riskAnalysisSection}

${ddTasksSummary}

${documentSection}

# ANALYYSITEHTÄVÄ
Arvioi, miten DD-korjaustoimenpiteet ovat vaikuttaneet yrityksen myyntikuntoisuuteen ja arvoon, sekä kuinka hyvin tunnistettuja riskejä on onnistuttu lieventämään. Tehtäväsi on kaksiosainen:

1. MYYNTIKUNTOISUUDEN PÄIVITYS:
   Käy läpi jokainen kategoria ja:
   - Arvioi, miten DD-toimenpiteiden suoritus on vaikuttanut kyseiseen kategoriaan
   - Päivitä kategoriaan liittyvät arviot ja pisteet
   - Päivitä kategorialle arvioitu arvovaikutus (vaikutusprosentti) uusien löydösten valossa
   - Perustele, mikä on muuttunut ja miksi vaikutus on muuttunut

2. RISKIEN LIEVENTÄMISEN ARVIOINTI:
   - Vertaa alkuperäistä riskianalyysia nykytilanteeseen
   - Arvioi, miten DD-toimenpiteet ovat vaikuttaneet tunnistettuihin riskeihin
   - Anna päivitetty riskitaso jokaiselle riskikategorialle
   - Perustele riskitasojen muutokset
   - Listaa mahdolliset jäljellä olevat toimenpiteet riskien lieventämiseksi
   - Anna kokonaisarvio riskien hallinnasta ja niiden vaikutuksesta arvoon

Huomioi, että:
- DD-tehtävien suoritus on voinut pienentää tai poistaa aiemmin tunnistettuja riskejä
- Joissakin tapauksissa toimenpiteet ovat voineet paljastaa uusia riskejä
- Kategoriapainotuksia voi tarvittaessa päivittää

Lopuksi, anna sanallinen yhteenveto siitä, miten myyntikuntoisuus on kokonaisuudessaan kehittynyt ja miten riskejä on saatu hallittua.

${responseFormatInstruction}
`;

  return prompt;
}