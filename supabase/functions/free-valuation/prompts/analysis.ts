// prompts/analysis.ts
// Prompt for generating final analysis

import { FinancialData } from '../types.ts';
import { premiumServiceDescription } from '../premium-service-description.ts';

export function getAnalysisPrompt(
  companyName: string, 
  financialData: FinancialData, 
  normalizationSummary: string,
  valuationDetails: {
    substanssiValue: number;
    isSubstanssiNegative: boolean;
    evLiikevaihtoValue: number;
    korjattuKerroin: number;
    evEbitValue: number;
    isEbitNegativeOrZero: boolean;
    evEbitKerroin: number;
    low: number;
    high: number;
  },
  originalQuestions?: { id: string; category: string; question: string; impact?: string; }[]
): string {
  const { 
    substanssiValue, 
    isSubstanssiNegative, 
    evLiikevaihtoValue, 
    korjattuKerroin, 
    evEbitValue, 
    isEbitNegativeOrZero, 
    evEbitKerroin, 
    low, 
    high 
  } = valuationDetails;

  // Muotoile kysymykset ja vastaukset, jos saatavilla
  let questionsAndAnswersText = "";
  if (originalQuestions && Array.isArray(originalQuestions) && originalQuestions.length > 0) {
    questionsAndAnswersText = "\nKäyttäjän antamat vastaukset normalisointiin liittyviin kysymyksiin:\n";
    questionsAndAnswersText += originalQuestions.map(q => {
      const impactText = q.impact ? `\nVaikutus: ${q.impact}` : "";
      return `Kysymys: ${q.question}${impactText}`;
    }).join("\n\n");
  }

  return `Olet yritysten arvonmäärityksen ja yrityskauppojen asiatuntija. Tarkastele seuraavan yrityksen arvonmääritykseen liityvää taloudellista dataa, yrityksen edustajalle esitettyjä kysymyksiä ja hänen antamiaan vastauksia sekä näiden perusteella tehtyjä laskelmia ja laadi yksityiskohtainen kommentointi niistä. 

Yrityksen nimi: "${companyName}"

Taloudelliset tiedot:
${JSON.stringify(financialData, null, 2)}

Kysytyt kysymykset ja vastaukset:
${questionsAndAnswersText}

Näiden vastausten pohjalta tehdyt normalisoinnit, jotka ovat saattaanneet vaikuttaa laskuihin: 

${normalizationSummary}

Arvonmäärityksen tulokset:
- Substanssiarvo: ${Math.round(substanssiValue)} euroa ${isSubstanssiNegative ? "(NEGATIIVINEN - velat ylittävät varat)" : ""}
- EV/Revenue-arvo: ${Math.round(evLiikevaihtoValue)} euroa (käytetty liikevaihtokerroin: ${korjattuKerroin.toFixed(2)})
- EV/EBIT-arvo: ${isEbitNegativeOrZero ? "Ei laskettavissa (negatiivinen tai nolla EBIT)" : Math.round(evEbitValue) + " euroa"} ${!isEbitNegativeOrZero ? `(käytetty EBIT-kerroin: ${evEbitKerroin.toFixed(2)})` : ""}
- Arvon vaihteluväli: ${low === 0 && high === 0 ? "Ei laskettavissa (kaikki mittarit negatiivisia/nolla)" : `${Math.round(low)} - ${Math.round(high)} euroa`}

${isSubstanssiNegative ? "HUOMIO: Yrityksen substanssiarvo on negatiivinen, mikä tarkoittaa että velat ylittävät yrityksen varat." : ""}
${isEbitNegativeOrZero ? "HUOMIO: Yrityksen EBIT (liikevoitto) on negatiivinen tai nolla, mikä vaikuttaa merkittävästi arvonmääritykseen." : ""}

Luo seuraavaksi yksityiskohtainen ja tarkka kommentointi näistä tuloksista JSON-muodossa seuraavasti:

{
  "key_points": {
    "title": "Keskeiset havainnot",
    "content": "Tiivis kuvaus arvonmäärityksen päätuloksista ja kokonaiskuva"
  },
  "valuation_analysis": {
    "substanssi_analysis": {
      "title": "Substanssiarvon analyysi",
      "content": "Yksityiskohtainen kommentti substanssiarvosta ja sen merkityksestä yritykselle"
    },
    "ev_revenue_analysis": {
      "title": "EV/Revenue-arvon analyysi",
      "content": "Yksityiskohtainen kommentti EV/Revenue-arvosta ja sen merkityksestä yritykselle"
    },
    "ev_ebit_analysis": {
      "title": "EV/EBIT-arvon analyysi",
      "content": "Yksityiskohtainen kommentti EV/EBIT-arvosta ja sen merkityksestä yritykselle"
    }
  },
  "myyntikuntoon_recommendation": {
    "personalized_title": "Juuri sinun yrityksellesi räätälöity otsikko",
    "catchy_subtitle": "Houkutteleva alaotsikko",
    "main_benefit_description": "Kuvaus siitä, miten Arvento -palvelun maksullinen versio auttaisi juuri tätä yritystä",
    "bullet_points": {
      "bullet_point_1": "Tärkeä hyöty 1",
      "bullet_point_2": "Tärkeä hyöty 2",
      "bullet_point_3": "Tärkeä hyöty 3"
    },
    "call_to_action": "Max 3 sanan kutsu jättämään sähköposti"
  },
  "recommendations": [
    {
      "title": "Suosituksen otsikko",
      "description": "Toimenpidesuositus yritykselle arvon parantamiseksi"
    }
  ]
}

Ohjeet:
1. Kommentoi annettuja lukuarvoja - älä laske uusia arvoja
2. Selitä arvonmäärityksen tuloksia ja eri menetelmien merkitystä tämän yrityksen kohdalla tarkasti ja analyyttisesti
3. Huomioi yrityksen edustajalle esitetetyt kysymykset ja edustajan antamat vastaukset erittäin tarkasti, jotta voit kommentoida mahdollisia normalisointeja tai niiden puutetta, joka voi esimerkiksi johtua heikoista vastauksista ja tuo tämä suoraan esille
4. Sisällytä erilliseen osioon (myyntikuntoon_recommendation) spesifinen suositus MYYNTIKUNTOON-palvelun maksullisesta versiosta perustuen seuraaviin tietoihin palvelustamme:
${premiumServiceDescription}
5. Sisällytä 1-3 toimenpidesuositusta recommendations-osioon
6. Analyysin tulee olla suomeksi
7. Pidä teksti positiivisena ja kannustavana${isSubstanssiNegative || isEbitNegativeOrZero ? ", mutta rehellisesti huomioi myös taloudelliset haasteet" : ""}
8. Muotoile Arventoon liittyvä osio erityisen houkuttelevaksi ja vakuuttavaksi - tämä on tärkeä osa arvonmääritysraporttia.
9. Personoi kaikki teksti koskemaan juuri kyseistä yritystä ja sen tilannetta.`;
}