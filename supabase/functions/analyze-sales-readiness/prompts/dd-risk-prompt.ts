// supabase/functions/analyze-sales-readiness/prompts/dd-risk-prompt.ts

export function createDDRiskPrompt(data) {
  const { tasks, companyData, companyInfo, documents, valuationData, financialAnalysisData } = data;

  let prompt = `
Olet Due Diligence -asiantuntija ja riskianalyytikko. Tehtäväsi on arvioida yrityksen "${companyData.name}" DD-riskejä ostajan näkökulmasta.

# YRITYSPROFIILI
Nimi: ${companyData.name}
Toimiala: ${companyData.industry || 'Ei määritelty'}
Perustamisvuosi: ${companyData.founded || 'Ei tiedossa'}
Henkilöstömäärä: ${companyData.employees || 'Ei tiedossa'}
Yhtiömuoto: ${companyData.company_type || 'Ei määritelty'}
Kuvaus: ${companyData.description || 'Ei kuvausta'}
`;

  if (companyInfo) {
    prompt += `
# YRITYSANALYYSI
Liiketoimintakuvaus: ${companyInfo.business_description || 'Ei saatavilla'}
Asiakkaat ja markkinat: ${companyInfo.customer_and_market || 'Ei saatavilla'}
Kilpailuasema: ${companyInfo.competition || 'Ei saatavilla'}

## SWOT-ANALYYSI
Vahvuudet: ${companyInfo.strengths || 'Ei määritelty'}
Heikkoudet: ${companyInfo.weaknesses || 'Ei määritelty'}
Mahdollisuudet: ${companyInfo.opportunities || 'Ei määritelty'}
Uhat: ${companyInfo.threats || 'Ei määritelty'}
`;
  }

  // Lisää tilinpäätöstiedot (ensisijaisesti financial_analysis, sitten valuationData)
  const fa = financialAnalysisData?.financial_analysis || valuationData?.results?.financialAnalysis;
  if (fa) {

    prompt += `
# TILINPÄÄTÖSTIEDOT
`;

    if (fa.documents && fa.documents.length > 0 && 
        fa.documents[0].financial_periods && 
        fa.documents[0].financial_periods.length > 0) {

      const latestPeriod = fa.documents[0].financial_periods[0];

      // Tuloslaskelma
      if (latestPeriod.income_statement) {
        const is = latestPeriod.income_statement;
        prompt += `
## TULOSLASKELMA
Liikevaihto: ${is.revenue || 0}€
EBIT: ${is.ebit || 0}€
Tulos: ${is.net_income || 0}€
Henkilöstökulut: ${is.personnel_expenses || 0}€
Materiaalit ja palvelut: ${is.materials_and_services || 0}€
Muut kulut: ${is.other_expenses || 0}€
`;
      }

      // Tase
      if (latestPeriod.balance_sheet) {
        const bs = latestPeriod.balance_sheet;
        prompt += `
## TASE
Varat yhteensä: ${bs.assets_total || 0}€
Oma pääoma: ${bs.equity || 0}€
Velat yhteensä: ${bs.liabilities_total || 0}€
Pitkäaikaiset velat: ${bs.long_term_liabilities || 0}€
Lyhytaikaiset velat: ${bs.short_term_liabilities || 0}€
`;
      }

      // Normalisoinnit
      if (fa.normalization_explanations) {
        prompt += `
## NORMALISOINNIT
${fa.normalization_explanations.summary || 'Ei normalisointeja'}
`;

        if (fa.normalization_explanations.applied_normalizations && 
            fa.normalization_explanations.applied_normalizations.length > 0) {
          prompt += `
Sovelletut normalisoinnit:
${fa.normalization_explanations.applied_normalizations.map(n => 
  `- ${n.field}: ${n.explanation} (${n.original_value || 0}€ → ${n.normalized_value || 0}€)`
).join('\n')}
`;
        }
      }
    }
  }

  // Lisää valuaatiotulokset kontekstiksi
  if (valuationData?.results?.valuationReport) {
    const vr = valuationData.results.valuationReport;
    prompt += `
# VALUAATIOTULOKSET
`;
    
    if (vr.valuation_numbers) {
      prompt += `
## ARVOSTUSTULOKSET
Keskiarvo: ${formatCurrency(vr.valuation_numbers.most_likely_value || 0)}
Haarukka: ${formatCurrency(vr.valuation_numbers.range?.low || 0)} - ${formatCurrency(vr.valuation_numbers.range?.high || 0)}
Perustelu: ${vr.valuation_numbers.valuation_rationale || 'Ei perustelua'}
`;
    }

    if (vr.analysis?.valuation_methods?.content) {
      prompt += `
## ARVOSTUSMENETELMÄT
${vr.analysis.valuation_methods.content.substring(0, 500)}${vr.analysis.valuation_methods.content.length > 500 ? '...' : ''}
`;
    }

    if (vr.analysis?.risk_assessment?.content) {
      prompt += `
## AIEMPI RISKIARVIO
${vr.analysis.risk_assessment.content.substring(0, 500)}${vr.analysis.risk_assessment.content.length > 500 ? '...' : ''}
`;
    }
  }

  if (documents && documents.length > 0) {
    prompt += `
# DOKUMENTAATIO
Saatavilla olevat dokumentit (${documents.length} kpl):
${documents.map(doc => `- ${doc.name} (${doc.document_type || 'Ei tyyppiä'})`).join('\n')}

Huom: Dokumenttien sisältämät olennaiset tilinpäätös- ja tasetiedot on sisällytetty yllä olevaan analyysiin.
`;
  }

  prompt += `
# TEHTÄVÄT JA VASTAUKSET
Seuraavassa on lista tehtävistä ja niihin annetuista vastauksista:
`;

  tasks.forEach((task) => {
    prompt += `
---
Tehtävä: ${task.title}
Kategoria: ${task.category}
Status: ${task.completion_status}
Kuvaus: ${task.description}
${task.task_responses && task.task_responses.length > 0 
  ? `Vastaus: ${task.task_responses[0].text_response || 'Tiedostovastaus'}` 
  : 'Ei vastausta'}
---
`;
  });

  // Lisää task-dokumenttien maininta
  const taskDocsCount = tasks.filter(t => t.fileContent).length;
  if (taskDocsCount > 0) {
    prompt += `

# HUOMIO: TASK-DOKUMENTIT
Tässä analyysissä on mukana ${taskDocsCount} tehtäviin liittyvää dokumenttia, jotka on ladattu erillisinä liitteinä.
Analysoi nämä dokumentit huolellisesti ja ota niiden sisältö huomioon riskiarvioinnissa, erityisesti operatiivisten prosessien ja dokumentaation osalta.
`;
  }

  prompt += `
# ANALYYSITEHTÄVÄ
Analysoi yllä olevia tietoja ja arvioi yrityksen DD-riskejä ostajan näkökulmasta. Suorita seuraavat analyysivaiheet:

1. RISKIKARTOITUS KATEGORIOITTAIN
   Tunnista ja arvioi riskit seuraavissa kategorioissa:
   - Taloudelliset riskit 
   - Juridiset riskit
   - Asiakkaisiin liittyvät riskit
   - Henkilöstöriskit
   - Operatiiviset riskit
   - Muut merkittävät riskit

   Jokaiselle riskikategorialle:
   - Anna numeraalinen riskitaso (1-10, jossa 10 on korkein riski)
   - Kuvaa riskin luonne ja merkitys
   - Määritä vaikutus ostajalle (high/medium/low)
   - Listaa konkreettiset havainnot
   - Anna konkreettiset toimenpidesuositukset riskin hallintaan

2. KOKONAISRISKIARVIO JA YHTEENVETO
   - Määritä kokonaisriskitaso (1-10)
   - Listaa 3-5 keskeisintä löydöstä
   - Anna kattava yhteenveto riskitilanteesta

# VAADITTU VASTAUSMUOTO
Vastaa ainoastaan puhtaassa JSON-muodossa seuraavan rakenteen mukaisesti. Älä lisää JSON-rakenteen ulkopuolisia selityksiä tai markdown-koodia. Vältä käyttämästä kenoviivaa (\\) merkkijonoissa jäsennysvirheiden välttämiseksi:

{
  "analyysiPvm": "YYYY-MM-DDTHH:MM:SSZ",
  "kokonaisRiskitaso": <numero 1-10>,
  "riskiKategoriat": [
    {
      "kategoria": "string",
      "riskitaso": <numero 1-10>,
      "kuvaus": "string",
      "vaikutus": "high | medium | low",
      "havainnot": ["havainto 1", "havainto 2"],
      "toimenpideSuositukset": ["suositus 1", "suositus 2"]
    }
  ],
  "keskeisimmatLöydökset": ["löydös 1", "löydös 2"],
  "yhteenveto": "kokoava analyysi DD-riskeistä"
}

TÄRKEÄÄ: Varmista, että jokainen lainausmerkki (") ja sulkumerkki on oikein ja vastauksessasi on vain puhdasta JSONia. Tarkista merkkijonomuotoiset kentät huolellisesti ja vältä erikoismerkkejä kuten kenoviivaa (\\). Älä käytä "..." tai placeholder-tekstejä vaan tuota täydelliset arvot kaikkiin kenttiin.
`;

  return prompt;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fi-FI', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0 
  }).format(value);
}