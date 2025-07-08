// supabase/functions/analyze-sales-readiness/prompts/sales-readiness-prompt.ts

export function createSalesReadinessPrompt(data) {
  const { tasks, organizedTasks, companyData, companyInfo, assessmentData, valuationData, documents } = data;

  let prompt = `
Olet yrityskaupan myyntikuntoisuuden asiantuntija ja due diligence -analyytikko. Tehtäväsi on analysoida yritysdataa ja arvioida yrityksen "${companyData.name}" myyntikuntoisuutta KAIKISSA olennaisissa kategorioissa.

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

  if (assessmentData && assessmentData.answers) {
    prompt += `
# AIEMMAN KYSELYN VASTAUKSET
Kyselyn päivämäärä: ${new Date(assessmentData.created_at).toLocaleDateString('fi-FI')}
`;

    try {
      const answers = typeof assessmentData.answers === 'string' 
        ? JSON.parse(assessmentData.answers) 
        : assessmentData.answers;

      Object.entries(answers).forEach(([key, value]) => {
        prompt += `
## Kysymys: ${formatQuestionKey(key)}
Vastaus: ${formatAnswerValue(value)}
`;
      });
    } catch (error) {
      prompt += `[Vastauksien jäsentäminen epäonnistui: ${error.message}]`;
    }
  }

  if (assessmentData && assessmentData.results) {
    prompt += `
# AIEMMAN KYSELYN TULOKSET
`;

    try {
      const results = typeof assessmentData.results === 'string' 
        ? JSON.parse(assessmentData.results) 
        : assessmentData.results;

      prompt += formatAssessmentResults(results);
    } catch (error) {
      prompt += `[Tulosten jäsentäminen epäonnistui: ${error.message}]`;
    }
  }

  if (valuationData && valuationData.results) {
    prompt += `
# NYKYINEN VALUAATIO
Valuaation päivämäärä: ${new Date(valuationData.created_at).toLocaleDateString('fi-FI')}
${formatValuationData(valuationData.results)}
`;

    // Lisää tilinpäätöstiedot valuationData:sta
    if (valuationData.results.financialAnalysis) {
      const fa = valuationData.results.financialAnalysis;

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
  }

  // Huom: Task-dokumentit lähetetään AI:lle liitteinä
  const taskDocsCount = tasks.filter(t => t.fileContent).length;
  if (taskDocsCount > 0) {
    prompt += `
# HUOMIO: TASK-DOKUMENTIT
Tässä analyysissä on mukana ${taskDocsCount} tehtäviin liittyvää dokumenttia, jotka on ladattu erillisinä liitteinä.
Analysoi nämä dokumentit osana arviointia ja ota niiden sisältö huomioon erityisesti dokumentaation arvioinnissa.
`;
  }

  prompt += `
# TEHTÄVÄT KATEGORIOITTAIN
`;

  const tasksByCategory = organizedTasks?.byCategory || groupTasksByCategory(tasks);

  for (const [category, categoryTasks] of Object.entries(tasksByCategory)) {
    if (!categoryTasks || categoryTasks.length === 0) continue;

    prompt += `
## ${category.toUpperCase()} (${categoryTasks.length} kpl)
`;

    categoryTasks.forEach(task => {
      prompt += `
- Tehtävä: ${task.title}
  Status: ${task.completion_status}
  Kuvaus: ${task.description}
  ${task.value 
    ? `Vastaus: ${
        task.value.text ? task.value.text : 
        task.value.textResponse ? task.value.textResponse :
        task.value.fileName ? `Tiedosto: ${task.value.fileName}` :
        typeof task.value === 'string' ? task.value :
        JSON.stringify(task.value)
      }` 
    : 'Ei vastausta'}
`;
    });
  }

  prompt += `
# ANALYYSITEHTÄVÄ
Analysoi yllä olevia tietoja ja arvioi yrityksen myyntikuntoisuutta KAIKISSA seuraavissa kategorioissa:

1. TALOUDELLISET TEKIJÄT (FINANCIAL)
   - Arvioi yrityksen taloudellinen vakaus ja kannattavuus
   - Arvioi liikevaihdon rakenne ja kehitys
   - Arvioi kannattavuus ja tulosrakenne
   - Anna taloudellinen kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

2. JURIDISET TEKIJÄT (LEGAL)
   - Arvioi sopimusten ja velvoitteiden läpinäkyvyys ja riskit
   - Arvioi immateriaalioikeuksien suojaus ja selkeys
   - Arvioi mahdolliset riidat ja oikeudelliset ongelmat
   - Anna juridinen kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

3. ASIAKASKESKITTYNEISYYS (CUSTOMERS)
   - Arvioi datan perusteella, kuinka suuri prosenttiosuus liikevaihdosta tulee suurimmalta asiakkaalta (top1)
   - Arvioi datan perusteella, kuinka suuri prosenttiosuus liikevaihdosta tulee viideltä suurimmalta asiakkaalta (top5)
   - Arvioi asiakaskannan vakaus ja uskollisuus
   - Anna asiakasrakenteen kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

4. HENKILÖSTÖTEKIJÄT (PERSONNEL)
   - Arvioi avainhenkilöriippuvuuden taso: 'critical', 'high', 'moderate', 'low' tai 'unknown'
   - Arvioi, onko yrityksellä lieventäviä toimenpiteitä:
     * seuraajasuunnitelma (boolean)
     * avainhenkilösopimukset (boolean)
     * tietojen siirto/dokumentointi (boolean)
   - Arvioi henkilöstön osaaminen, vaihtuvuus ja sitoutuminen
   - Anna henkilöstön kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

5. OPERATIIVISET TEKIJÄT (OPERATIONS)
   - Arvioi prosessien dokumentointi ja skaalautuvuus
   - Arvioi toiminnan tehokkuus ja teknologinen kypsyys
   - Arvioi toimitusketju ja riippuvuudet ulkoisista toimijoista
   - Anna operatiivinen kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

6. DOKUMENTAATIO (DOCUMENTATION)
   - Arvioi dokumentaation taso pisteillä 0-100
   - Arvioi dokumentaation kattavuus, ajantasaisuus ja laatu
   - Listaa merkittävimmät puutteet dokumentaatiossa
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

7. STRATEGISET TEKIJÄT (STRATEGY)
   - Arvioi strategian selkeys ja toteutuskelpoisuus
   - Arvioi kilpailuedut ja -asema markkinoilla
   - Arvioi kasvupotentiaali ja tulevaisuuden näkymät
   - Anna strateginen kokonaisarvio asteikolla 1-10
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

8. SOPIMUSRAKENNE (CONTRACT STRUCTURE)
   - Arvioi, kuinka suuri prosenttiosuus liikevaihdosta perustuu sopimuksiin
   - Arvioi sopimusten keskimääräinen kesto vuosina
   - Anna arvio tämän kategorian vaikutuksesta yrityksen arvoon prosentteina (+/-)
   - Anna yksityiskohtainen perustelu arvioillesi

Määritä myös jokaisen yllä mainitun kategorian painoarvo kokonaisvaikutuksessa tämän yrityksen kohdalla:
- Anna jokaiselle kategorialle painoarvo desimaalilukuna välillä 0-1
- Varmista, että kaikki painoarvot yhteensä summautuvat TASAN 1.0 (100%)
- Esimerkiksi: taloudelliset 0.25, henkilöstö 0.2, asiakasrakenne 0.15, jne.
- Painota kategorioita eri tavoin riippuen yrityksen luonteesta ja toimialasta
- Perustele valitsemasi painotukset

Lopuksi, anna sanallinen yhteenveto yrityksen kokonaismyyntikuntoisuudesta perustuen yllä oleviin analyyseihin.

# VAADITTU VASTAUSMUOTO
Vastaa puhtaassa JSON-muodossa seuraavan rakenteen mukaisesti. Älä lisää JSON:n ulkopuolista sisältöä (ei kommentteja, markdown-merkintöjä tai selityksiä):

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
  "sanallinenYhteenveto": "kattava yhteenveto myyntikuntoisuudesta"
}

TÄRKEÄÄ: Huomioi seuraavat asiat JSON-vastauksessasi:
1. Varmista, että jokainen lainausmerkki (") on oikein suljettu
2. Älä käytä kenoviivoja (\\) merkkijonoissa, sillä ne voivat aiheuttaa jäsennysvirheitä
3. Älä käytä "..." tai placeholder-tekstejä vaan tuota täydelliset arvot kaikkiin kenttiin
4. Vältä erikoismerkkejä ja vahvoja muotoiluja pitkissä tekstikentissä
5. Täytä puuttuvat arvot null-arvoilla, ei tyhjillä merkkijonoilla
6. Varmista, että kategoriapainotuksen summa on täsmälleen 1.0
`;

  return prompt;
}

function formatQuestionKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function formatAnswerValue(value) {
  if (value === null || value === undefined) return 'Ei vastausta';
  if (typeof value === 'boolean') return value ? 'Kyllä' : 'Ei';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return value.toString();
}

function formatAssessmentResults(results) {
  if (!results) return 'Ei tuloksia saatavilla';

  let output = '';

  try {
    if (results.summary) {
      output += `Yhteenveto: ${results.summary}\n`;
    }

    if (results.scores) {
      output += `\nPistemäärät:\n`;
      Object.entries(results.scores).forEach(([category, score]) => {
        output += `- ${formatQuestionKey(category)}: ${score}/10\n`;
      });
    }

    if (results.recommendations) {
      output += `\nSuositukset:\n`;
      results.recommendations.forEach((rec, i) => {
        output += `${i+1}. ${rec}\n`;
      });
    }

    return output;
  } catch (error) {
    return `Assessment-tulosten jäsentäminen epäonnistui: ${error.message}\nRaakatulokset: ${JSON.stringify(results)}`;
  }
}

function formatValuationData(results) {
  if (!results) return "Ei valuaatiotietoja saatavilla";

  try {
    const valuationSummary = [];

    if (results.average_valuation) {
      valuationSummary.push(`Keskimääräinen valuaatio: ${formatCurrency(results.average_valuation)}`);
    }

    if (results.range) {
      valuationSummary.push(`Haarukka: ${formatCurrency(results.range.low)} - ${formatCurrency(results.range.high)}`);
    }

    if (results.used_revenue_multiple) {
      valuationSummary.push(`Revenue multiple: ${results.used_revenue_multiple.value}`);
    }

    if (results.used_ev_ebit_multiple) {
      valuationSummary.push(`EBIT multiple: ${results.used_ev_ebit_multiple.value}`);
    }

    if (results.used_ev_ebitda_multiple) {
      valuationSummary.push(`EBITDA multiple: ${results.used_ev_ebitda_multiple.value}`);
    }

    if (results.used_p_e_multiple) {
      valuationSummary.push(`P/E multiple: ${results.used_p_e_multiple.value}`);
    }

    return valuationSummary.join('\n');
  } catch (error) {
    return "Valuaatiotietojen jäsennys epäonnistui";
  }
}

function groupTasksByCategory(tasks) {
  const categories = {
    financial: [],
    legal: [],
    customers: [],
    personnel: [],
    operations: [],
    documentation: [],
    strategy: [],
    other: []
  };

  tasks.forEach(task => {
    const category = task.category;
    if (category in categories) {
      categories[category].push(task);
    } else {
      categories.other.push(task);
    }
  });

  return categories;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fi-FI', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0 
  }).format(value);
}