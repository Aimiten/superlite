// Prompt templates for Gemini API

// Prompt for analyzing financial data with user answers - LASKELMAT POISTETTU
export function createAnalysisPrompt(
  companyName: string, 
  formattedAnswers: string, 
  companyType?: string,
  originalQuestions?: { id: string; category: string; question: string; impact?: string }[]
) {
  const isPartnership = companyType === "toiminimi" || 
                        companyType === "henkilöyhtiö" || 
                        companyType === "avoin yhtiö" || 
                        companyType === "kommandiittiyhtiö";

  // KORJATTU: Käytetään formattedAnswers suoraan sellaisenaan ilman uudelleenkäsittelyä
  console.log("Using formatted answers directly, sample:", 
              formattedAnswers.substring(0, 200) + (formattedAnswers.length > 200 ? "..." : ""));

  return `
    TÄRKEÄ OHJE: VASTAA AINA SUOMEKSI. Kaikki analyysit, kysymykset ja selitykset tulee kirjoittaa suomen kielellä.
    
    Analysoi yrityksen "${companyName}" tilinpäätöstiedot uudelleen käyttäen käyttäjän antamia vastauksia täydentämään puuttuvia tietoja.

    # KYSYMYKSET JA KÄYTTÄJÄN VASTAUKSET

    ${formattedAnswers}

    ${isPartnership ? "# TÄRKEÄÄ HUOMIOIDA\nKyseessä on henkilöyhtiö (toiminimi/avoin yhtiö/kommandiittiyhtiö), jossa yrittäjän palkka ja edut vaikuttavat merkittävästi arvonmääritykseen. Nämä erät täytyy normalisoida, jotta saadaan todellinen kuva yrityksen suorituskyvystä." : ""}

    # TEHTÄVÄSI

    Tehtäväsi on:
    1. Analysoida tilinpäätöstiedot huolellisesti
    2. NORMALISOIDA TILINPÄÄTÖSTIEDOT käyttäjän vastausten perusteella - tämä tarkoittaa, että SINUN PITÄÄ MUUTTAA LUKUJA tilinpäätöksessä käyttäjän vastausten perusteella
    3. Dokumentoida tarkasti tekemäsi normalisoinnit ja niiden perustelut erillisessä normalization_explanations-kentässä
    4. Määrittää sopivat arvostuskertoimet yrityksen toimialan ja ominaisuuksien perusteella
    5. Selittää miksi valitsemasi kertoimet soveltuvat juuri tälle yritykselle

    TÄRKEÄÄ: SINUN TEHTÄVÄSI ON NORMALISOIDA TILINPÄÄTÖSTIEDOT JA PALAUTTAA MUUTETUT LUVUT. Älä luo vain selitystä normalisoinnista - tee oikeasti konkreettiset muutokset lukuihin käyttäjän vastausten perusteella. Järjestelmä laskee myöhemmin tunnusluvut ja arvostukset näiden normalisoitujen lukujen perusteella.

    # NORMALISOINNIN OHJEET

    Normalisoinnin tarkoitus on oikaista tilinpäätös niin, että se kuvaa yrityksen todellista taloudellista suorituskykyä:

    - Jos käyttäjä on ilmoittanut kertaluonteisista eristä (esim. kiinteistön myynti), POISTA nämä erät tuloslaskelmasta muuttamalla vastaavia lukuja
    - - Jos käyttäjä on ilmoittanut yrittäjän todellisen palkan, MUUTA henkilöstökuluja vastaamaan tätä tietoa JA LISÄÄ työnantajan sivukulut (noin 20-30% palkasta) markkinaehtoisen kokonaiskustannuksen määrittämiseksi. Esimerkiksi, jos yrittäjän palkka on 50 000€/v, normalisoitu kustannus olisi 50 000€ + (50 000€ * 0,3) = 65 000€.
    - Jos käyttäjä on ilmoittanut muista epätavallisista kuluista tai tuotoista, MUUTA näitä eriä tuloslaskelmassa
    - Jos käyttäjä on ilmoittanut omaisuuserien todellisesta arvosta, MUUTA näitä eriä taseessa

    # VASTAUKSESI

    Palauta tiedot tässä JSON-muodossa:

    {
      "company": {
        "name": "${companyName}",
        "business_id": "",
        "verified": true/false${isPartnership ? ',\n        "company_type": "' + (companyType || 'henkilöyhtiö') + '"' : ''}
      },
      "documents": [
        {
          "filename": "tilinpäätös",
          "source_type": "financial_statement",
          "type": "financial_statement",
          "status": "valid",
          "issues": [],
          "financial_periods": [
            {
              "period": {
                "start_date": "YYYY-MM-DD",
                "end_date": "YYYY-MM-DD"
              },
              "income_statement": {
                "revenue": 0,
                "other_income": 0,
                "materials_and_services": 0,
                "personnel_expenses": 0,
                "other_expenses": 0,
                "depreciation": 0,
                "ebit": 0,
                "financial_income_expenses": 0,
                "taxes": 0,
                "net_income": 0
              },
              "balance_sheet": {
                "assets_total": 0,
                "intangible_assets": 0,
                "real_estate": 0,
                "machinery_and_equipment": 0,
                "other_tangible_assets": 0,
                "inventory": 0,
                "accounts_receivable": 0,
                "current_assets": 0,
                "equity": 0,
                "liabilities_total": 0,
                "long_term_liabilities": 0,
                "short_term_liabilities": 0
              },
              "dcf_items": {
                "cash": 0,
                "interest_bearing_debt": 0
              },
              ${isPartnership ? `
              "entrepreneur_info": {
                "salary": 0,
                "benefits": 0,
                "private_usage": 0,
                "transferable_assets": 0
              },` : ''}
              "valuation_multiples": {
                "revenue_multiple": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                },
                "ev_ebit": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                },
                "ev_ebitda": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                }${!isPartnership ? ',\n                "p_e": {\n                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",\n                  "justification": "[perustele valintasi]"\n                }' : ''}
              }
            }
          ]
        }
      ],
      "normalization_explanations": {
        "summary": "Tiivis yhteenveto tehdyistä normalisoinneista ja niiden vaikutuksesta yrityksen taloudelliseen kuvaan",
        "applied_normalizations": [
          {
            "field": "Normalisoitu kenttä (esim. income_statement.personnel_expenses)",
            "original_value": 0,
            "normalized_value": 0,
            "explanation": "Yksityiskohtainen selitys miksi ja miten arvo normalisoitiin käyttäjän vastauksien perusteella"
          }
        ]
      }
    }

    # KERTOIMIEN MÄÄRITTÄMINEN JA PERUSTELU

    Jokaisen kertoimen kohdalla:
    1. ANALYSOI yrityksen soveltuvuus kyseiseen kertoimeen
    2. PÄÄTÄ kerroin sen perusteella 
    3. PERUSTELE päätöksesi johdonmukaisesti

    Perustelun tulee olla loogisesti yhteensopiva antamasi kertoimen kanssa.
    Jos sanot että kerroin "soveltuu" tai tunnusluku on "positiivinen", 
    anna myös positiivinen kerroin. Jos sanot että "ei sovellu", anna 0.

    Ole asiantuntija - määritä kertoimet yrityksen ominaisuuksien perusteella.

    # OHJEITA

    1. Käytä käyttäjän antamia vastauksia KONKREETTISESTI MUOKKAAMAAN tilinpäätöslukuja - älä vain selitä muutoksia, vaan tee muutokset oikeasti 
    2. Kun olet muuttanut lukuja, dokumentoi selkeästi normalization_explanations-osiossa JOKAINEN tekemäsi normalisointi
    3. Määritä sopivat arvostuskertoimet (revenue_multiple, ev_ebit, ev_ebitda, p_e) yrityksen toimialan, koon, kasvuvauhdin ja kannattavuuden perusteella
    4. Perustele valitsemasi kertoimet yksityiskohtaisesti
    5. ÄLÄ LISÄÄ MITÄÄN YLIMÄÄRÄISIÄ KENTTIÄ vastaukseen - käytä vain niitä kenttiä, jotka on määritelty JSON-rakenteessa
    6. ÄLÄ LASKE uudelleen calculated_fields-arvoja - järjestelmä laskee nämä erikseen
    7. Varmista että kaikki json-kentät on täytetty ja että JSON on validi
    8. Vastaa aina suomeksi!
    
    HUOMIO: Palauta vastauksesi PELKÄSTÄÄN validissa JSON-muodossa, ILMAN mitään selityksiä, johdantoja, 
      muuta tekstiä tai markdown-koodilohkoja (kolme backtick-merkkiä). Vastaa ainoastaan JSON-objektilla.

      KRIITTISTÄ: Tarkista, että JSON-syntaksi on täysin validi ilman ylimääräisiä merkkejä tai virheitä.
      Vastaa AINOASTAAN yhdellä JSON-objektilla ilman mitään muuta tekstiä.
  `;
}

// Prompt for corporations - LASKELMAT POISTETTU
export function createCorporationPrompt(companyName: string) {
  return `
    TÄRKEÄ OHJE: VASTAA AINA SUOMEKSI. Kaikki analyysit, kysymykset ja selitykset tulee kirjoittaa suomen kielellä.
    
    Analysoi yrityksen ${companyName} tilinpäätöstiedot ja poimi tarkat arvot seuraavaan JSON-muotoon.

Tehtävä:

Analysoi annetut tilinpäätöstiedot ja tuota JSON-muotoinen raportti, joka sisältää seuraavat elementit:

1. Perustiedot: Yrityksen nimi, Y-tunnus ja vahvistus siitä, onko tiedot varmennettu.

2. Dokumenttien analyysi: Analysoi jokainen annettu dokumentti (tilinpäätös, liitetiedot jne.) ja määritä sen tyyppi, tila ja mahdolliset ongelmat.

3. Tilikauden tiedot: Poimi jokaiselta tilikaudelta olennaiset tiedot tuloslaskelmasta ja taseesta. Älä tee omia laskuja.

4. Anomalioiden tunnistus: Tunnista tilinpäätöksestä anomaliat (esim. epätavalliset muutokset luvuissa, ristiriidat eri dokumenttien välillä). Priorisoi anomaliat niiden vaikutuksen mukaan arvonmääritykseen.

5. Arvostuskertoimien määritys: Määritä sopivat arvostuskertoimet (liikevaihtokerroin, EV/EBIT, EV/EBITDA, P/E) juuri kyseisen yrityksen toimialan ja ominaisuuksien perusteella. Perustele valitut kertoimet selkeästi käyttäen asiantuntemustasi.

6. Kysymykset: Muotoile 1-6 kysymystä, jotka auttavat normalisoimaan tilinpäätöksen, jotta voidaan laskea tarkempi arvonmääritys oikaistuista tilinpäätösluvuista. Kysymysten tulee olla erittäin spesifisiä ja suoraan tilinpäätöksestä johdettuja.

6a. Tunnista ensin tilinpäätöksestä anomaliat (esim. suuret muutokset edellisvuoteen verrattuna) ja merkittävät luvut (esim. suuri osuus liikevaihdosta).

6b. Luo kysymykset automaattisesti näiden anomalioiden ja merkittävien lukujen perusteella.

6c. Kysymysten tulee aina viitata suoraan tiettyyn euromääräiseen lukuun tilinpäätöksessä ja kysyä siitä tarkentavia tietoja.

6d. Kysymysten tulee selvittää, onko kyseessä kertaluonteinen vai toistuva erä.

6e. Kysymysten tulee pyytää vertaamaan lukuja markkinahintaan (esim. omistajan palkka, vuokrakulut), jos se on relevanttia.

6f. Kysymysten tulee pyrkiä saamaan tietoa, jonka avulla voidaan suoraan poistaa tai lisätä eriä tulokseen tai taseeseen.

6g.Kysymysten tulee hyödyntää tilinpäätöksen rakennetta (esim. jos kertaluonteiset erät on jo eritelty, niistä ei tarvitse kysyä uudelleen).

6h. Kysymysten tulee ottaa huomioon käytettävät arvostuskertoimet (liikevaihtokerroin, EV/EBIT jne.) ja olla relevantteja niiden kannalta.

6i. Kysymysten tulee olla selkeitä ja konkreettisia, ja niiden vastauksien tulee olla sellaisia, että niiden avulla voi normalisoida tilinpäätöksen luotettavasti.

6j. Älä esitä kysymyksiä joihin ei ole suoranaista tarvetta

# Esimerkkejä HYVISTÄ kysymyksistä (nämä ovat esimerkkejä, mallin tulee luoda omat kysymykset tilinpäätöksen perusteella):

- "Liikevaihto kasvoi 50 % edellisvuodesta. Johtuuko tämä kasvusta uusista asiakkaista vai kertaluonteisista projekteista? Jos kyseessä on kertaluonteinen projekti, mikä oli sen euromääräinen arvo?"

- "Henkilöstökulut ovat 80 % liikevaihdosta. Sisältääkö tämä luku alihankintakuluja, jotka voitaisiin luokitella suoraan projektikuluiksi? Jos, mikä on niiden euromääräinen arvo?"

- "Vuokrakulut ovat X euroa. Sisältävätkö nämä kulut markkinahintaa ylittävää osuutta? Jos kyllä, mikä on sen euromääräinen arvo?"

- "Muut kulut ovat Y euroa. Oliko näissä kuluissa sellaisia, jotka liittyvät yrityksen perustamiseen ja ovat kertaluonteisia? Jos kyllä, mikä oli niiden euromääräinen arvo?"

Tärkeitä lisäohjeita:

- Käytä annettua JSON-rakennetta raportin luomiseen.
- Poimi tilinpäätöksen luvut euromääräisinä ilman yksikköä.
- Priorisoi viimeisimmän tilikauden tiedot, mutta huomioi myös kehitystrendit.
- Jos havaitset ristiriitoja eri dokumenttien välillä, merkitse ne ja priorisoi ne.
- Pyri antamaan arvostuskertoimille mahdollisimman yksilöllisiä perusteluja, jotka ottavat huomioon yrityksen erityispiirteet.
- Varmista, että kysymykset ovat relevantteja normalisoinnin kannalta.

Oletuksena on, että vastajaa on yrityksen omistaja. Muotoile kysymykset ja perustelut sen mukaisesti.

# ÄÄRIMMÄISEN TÄRKEÄ OHJE TILIKAUSIEN KÄSITTELYSTÄ

Sinun TÄYTYY tunnistaa ja käsitellä JOKAINEN ERILLINEN TILIKAUSI kaikista annetuista dokumenteista.

- Käy läpi KAIKKI dokumentit ja etsi KAIKKI tilikaudet
- Jos löydät esimerkiksi tilikaudet 2021, 2022, 2023, 2024 LISÄÄ KAIKKI erillisinä objekteina financial_periods-taulukkoon
- ÄLÄ KOSKAAN yhdistä tai jätä pois tilikausia
- Jokainen tilikausi vaatii oman objektinsa financial_periods-taulukkoon, vaikka tietoja olisi vain osittain
- TARKISTA HUOLELLISESTI jokaisen PDF-dokumentin sisältö, koska eri dokumentit voivat sisältää eri tilikausien tietoja

Jos et noudata tätä ohjetta, arvonmääritys ei toimi oikein.

    Vastaa JSON-muodossa, joka sisältää sekä analyysin että pakolliset kysymykset:

    {
      "company": {
        "name": "${companyName}",
        "business_id": "",
        "verified": true/false
      },
      "documents": [
        {
          "filename": "tilinpäätös",
          "source_type": "financial_statement",
          "type": "financial_statement",
          "status": "valid",
          "issues": [],
          "financial_periods": [
            {
              "period": {
                "start_date": "YYYY-MM-DD",
                "end_date": "YYYY-MM-DD"
              },
              "income_statement": {
                "revenue": 0,
                "other_income": 0,
                "materials_and_services": 0,
                "personnel_expenses": 0,
                "other_expenses": 0,
                "depreciation": 0,
                "ebit": 0,
                "financial_income_expenses": 0,
                "taxes": 0,
                "net_income": 0
              },
              "balance_sheet": {
                "assets_total": 0,
                "intangible_assets": 0,
                "real_estate": 0,
                "machinery_and_equipment": 0,
                "other_tangible_assets": 0,
                "inventory": 0,
                "accounts_receivable": 0,
                "current_assets": 0,
                "equity": 0,
                "liabilities_total": 0,
                "long_term_liabilities": 0,
                "short_term_liabilities": 0
              },
              "dcf_items": {
                "cash": 0,
                "interest_bearing_debt": 0
              },
              "notes": {
                "guarantees": null,
                "extraordinary_items": null,
                "commitments": null,
                "leasing_liabilities": null,
                "pending_lawsuits": null,
                "related_party_transactions": null,
                "other_obligations": null
              },
              "validation": {
                "balance_check": true/false,
                "missing_data": [],
                "anomalies": [
                  {
                    "item": "",
                    "category": "",
                    "amount": 0,
                    "period": "",
                    "description": "",
                    "requires_clarification": true/false,
                    "priority": "high/medium/low"
                  }
                ]
              },
              "valuation_multiples": {
                "revenue_multiple": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                },
                "ev_ebit": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi huomioiden toimiala, yhtiön koko, kasvunopeus ja kannattavuus]"
                },
                "ev_ebitda": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi huomioiden toimiala, yhtiön koko, kasvunopeus ja kannattavuus]"
                },
                "p_e": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi huomioiden toimiala, yhtiön koko, kasvunopeus ja kannattavuus]"
                }
              }
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "owner_salary_impact",
          "category": "income_statement",
          "description": "Mikä on omistajan palkan vaikutus yrityksen tulokseen?",
          "question": "Mikä on yrittäjän/omistajan nostama palkka tai palkkiot, ja miten se vaikuttaa yrityksen tulokseen?",
          "impact": "Omistajan palkka on olennainen normalisoitava erä arvonmäärityksessä"
        },
        {
          "id": "revenue_anomaly",
          "category": "income_statement",
          "description": "Onko liikevaihdossa kertaluontoisia tai poikkeavia eriä?",
          "question": "Sisältääkö liikevaihto kertaluontoisia tai poikkeavia eriä, jotka eivät kuvasta yrityksen normaalia operatiivista toimintaa?",
          "impact": "Kertaluontoiset tuotot voivat vääristää arvonmääritystä"
        }
        // Lisää muut kysymykset tähän samassa muodossa - yhteensä 1-6 kysymystä
      ],
      "initialFindings": {
        "identified_issues": [],
        "company_type": "osakeyhtiö",
        "industry": "",
        "size_category": "",
        "multi_year_analysis": {
          "has_multiple_periods": false,
          "period_count": 1,
          "latest_period": "YYYY-MM-DD to YYYY-MM-DD"
        }
      }
    }

Tärkeitä huomioita tilinpäätöksen analysointiin:
1. Tunnista eri tilikaudet ja niiden päivämäärät tarkasti
2. Taseessa pitäisi olla yhtä paljon vastaavaa ja vastattavaa - merkitse balance_check true/false sen mukaan
3. Luo jokaiselle kysymykselle yksilöllinen id, kuvaava kategoria ja selkeä kysymys
4a. Käsittelet useaa tilikautta, lisää financial_periods-listaan kaikki tilikaudet, mutta painota analyysissä viimeisintä.

4b. TÄRKEÄÄ: Jos käsittelet useita tilikausia, SINUN TULEE ANALYSOIDA JA LISÄTÄ KAIKKI TILIKAUDET financial_periods-listaan erillisinä objekteina. ÄLÄ yhdistä eri tilikausien tietoja yhdeksi tilikaudeksi. Jokainen tilikausi tulee olla oma objektinsa financial_periods-listassa, sisältäen kyseisen tilikauden period-, income_statement-, balance_sheet- ym. tiedot. Varmista, että kaikki tunnistetut tilikaudet säilyvät lopullisessa vastauksessa jokaisesta dokumentista, jonka käsittelet!

5. ÄLÄ KOSKAAN jätä questions-listaa tyhjäksi, vaikka data vaikuttaisi täydelliseltä
6. ÄLÄ LASKE arvonmäärityksen lukuja - määritä vain sopivat kertoimet

HUOMIO: Palauta vastauksesi PELKÄSTÄÄN validissa JSON-muodossa, ILMAN mitään selityksiä, johdantoja, 
    muuta tekstiä tai markdown-koodilohkoja (kolme backtick-merkkiä). Vastaa ainoastaan JSON-objektilla.
    
    KRIITTISTÄ: Tarkista, että JSON-syntaksi on täysin validi ilman ylimääräisiä merkkejä tai virheitä.
    Vastaa AINOASTAAN yhdellä JSON-objektilla ilman mitään muuta tekstiä.
  `;
}

// Prompt for manual multiplier settings
export function createManualMultiplierPrompt(
  companyName: string, 
  customMultipliers: any,
  companyType?: string
) {
  // KRIITTINEN VALIDAATIO
  if (!customMultipliers || 
      typeof customMultipliers.revenue_multiple !== 'number' ||
      typeof customMultipliers.ev_ebit !== 'number' ||
      typeof customMultipliers.ev_ebitda !== 'number' ||
      customMultipliers.revenue_multiple <= 0 ||
      customMultipliers.ev_ebit <= 0 ||
      customMultipliers.ev_ebitda <= 0) {
    throw new Error("Invalid customMultipliers provided");
  }

  const isPartnership = companyType === "toiminimi" || 
                        companyType === "henkilöyhtiö" || 
                        companyType === "avoin yhtiö" || 
                        companyType === "kommandiittiyhtiö";
                        
  return `
    TÄRKEÄ OHJE: VASTAA AINA SUOMEKSI. Kaikki analyysit, kysymykset ja selitykset tulee kirjoittaa suomen kielellä.
    
    Analysoi yrityksen "${companyName}" tilinpäätöstiedot ja poimi tarkat arvot seuraavaan JSON-muotoon.

    # TÄRKEÄ OHJE KERTOIMISTA
    Käyttäjä on määrittänyt seuraavat arvostuskertoimet, joita SINUN TULEE KÄYTTÄÄ:
    - Liikevaihtokerroin: ${customMultipliers.revenue_multiple}
    - EV/EBIT: ${customMultipliers.ev_ebit}
    - EV/EBITDA: ${customMultipliers.ev_ebitda}
    ${customMultipliers.p_e ? `- P/E: ${customMultipliers.p_e}` : ''}
    
    ÄLÄ määritä omia kertoimia - käytä VAIN näitä käyttäjän antamia arvoja.

    ${isPartnership ? "# TÄRKEÄÄ HUOMIOIDA\nKyseessä on henkilöyhtiö (toiminimi/avoin yhtiö/kommandiittiyhtiö), jossa yrittäjän palkka ja edut vaikuttavat merkittävästi arvonmääritykseen. Nämä erät täytyy normalisoida, jotta saadaan todellinen kuva yrityksen suorituskyvystä." : ""}

    # TEHTÄVÄSI

    Tehtäväsi on:
    1. Analysoida tilinpäätöstiedot huolellisesti
    2. Tunnista mahdolliset anomaliat ja luo kysymyksiä niistä
    3. Määritä sopivat arvostuskertoimet yrityksen toimialan ja ominaisuuksien perusteella
    4. Käytä käyttäjän antamia kertoimia valuation_multiples-osiossa

    # VASTAUKSESI

    Palauta tiedot tässä JSON-muodossa:

    {
      "company": {
        "name": "${companyName}",
        "business_id": "",
        "verified": true/false${isPartnership ? ',\n        "company_type": "' + (companyType || 'henkilöyhtiö') + '"' : ''}
      },
      "documents": [
        {
          "filename": "tilinpäätös",
          "source_type": "financial_statement",
          "type": "financial_statement",
          "status": "valid",
          "issues": [],
          "financial_periods": [
            {
              "period": {
                "start_date": "YYYY-MM-DD",
                "end_date": "YYYY-MM-DD"
              },
              "income_statement": {
                "revenue": 0,
                "other_income": 0,
                "materials_and_services": 0,
                "personnel_expenses": 0,
                "other_expenses": 0,
                "depreciation": 0,
                "ebit": 0,
                "financial_income_expenses": 0,
                "taxes": 0,
                "net_income": 0
              },
              "balance_sheet": {
                "assets_total": 0,
                "intangible_assets": 0,
                "real_estate": 0,
                "machinery_and_equipment": 0,
                "other_tangible_assets": 0,
                "inventory": 0,
                "accounts_receivable": 0,
                "current_assets": 0,
                "equity": 0,
                "liabilities_total": 0,
                "long_term_liabilities": 0,
                "short_term_liabilities": 0
              },
              "dcf_items": {
                "cash": 0,
                "interest_bearing_debt": 0
              },
              ${isPartnership ? `
              "entrepreneur_info": {
                "salary": 0,
                "benefits": 0,
                "private_usage": 0,
                "transferable_assets": 0
              },` : ''}
              "valuation_multiples": {
                "revenue_multiple": {
                  "multiple": ${customMultipliers.revenue_multiple},
                  "justification": "Käyttäjän määrittämä kerroin"
                },
                "ev_ebit": {
                  "multiple": ${customMultipliers.ev_ebit},
                  "justification": "Käyttäjän määrittämä kerroin"
                },
                "ev_ebitda": {
                  "multiple": ${customMultipliers.ev_ebitda},
                  "justification": "Käyttäjän määrittämä kerroin"
                }${!isPartnership && customMultipliers.p_e ? `,
                "p_e": {
                  "multiple": ${customMultipliers.p_e},
                  "justification": "Käyttäjän määrittämä kerroin"
                }` : ''}
              }
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "owner_salary_impact",
          "category": "income_statement",
          "description": "Mikä on omistajan palkan vaikutus yrityksen tulokseen?",
          "question": "Mikä on yrittäjän/omistajan nostama palkka tai palkkiot, ja miten se vaikuttaa yrityksen tulokseen?",
          "impact": "Omistajan palkka on olennainen normalisoitava erä arvonmäärityksessä"
        }
        // Lisää muut kysymykset tähän samassa muodossa - yhteensä 1-6 kysymystä
      ],
      "initialFindings": {
        "identified_issues": [],
        "company_type": "${isPartnership ? 'henkilöyhtiö' : 'osakeyhtiö'}",
        "industry": "",
        "size_category": "",
        "multi_year_analysis": {
          "has_multiple_periods": false,
          "period_count": 1,
          "latest_period": "YYYY-MM-DD to YYYY-MM-DD"
        }
      }
    }

    # OHJEITA

    1. Poimi tilinpäätöstiedot tarkkaan euromääräisinä ilman yksikköä
    2. Tunnista eri tilikaudet ja niiden päivämäärät tarkasti
    3. Luo jokaiselle kysymykselle yksilöllinen id, kuvaava kategoria ja selkeä kysymys
    4. ÄLÄ KOSKAAN jätä questions-listaa tyhjäksi, vaikka data vaikuttaisi täydelliseltä
    5. Varmista että kaikki json-kentät on täytetty ja että JSON on validi
    6. Vastaa aina suomeksi!
    
    HUOMIO: Palauta vastauksesi PELKÄSTÄÄN validissa JSON-muodossa, ILMAN mitään selityksiä, johdantoja, 
      muuta tekstiä tai markdown-koodilohkoja (kolme backtick-merkkiä). Vastaa ainoastaan JSON-objektilla.

      KRIITTISTÄ: Tarkista, että JSON-syntaksi on täysin validi ilman ylimääräisiä merkkejä tai virheitä.
      Vastaa AINOASTAAN yhdellä JSON-objektilla ilman mitään muuta tekstiä.
  `;
}

// Prompt for partnerships (sole traders, general partnerships, limited partnerships) - LASKELMAT POISTETTU
export function createPartnershipPrompt(companyName: string) {
  return `
    TÄRKEÄ OHJE: VASTAA AINA SUOMEKSI. Kaikki analyysit, kysymykset ja selitykset tulee kirjoittaa suomen kielellä.
    
    Analysoi henkilöyhtiön ${companyName} tilinpäätöstiedot tai kirjanpito ja poimi tarkat arvot seuraavaan JSON-muotoon.

    Huomioi, että henkilöyhtiöiden (toiminimi, avoin yhtiö, kommandiittiyhtiö) kirjanpito ja tilinpäätöstiedot ovat usein suppeampia kuin osakeyhtiöiden. Etsi saatavilla olevat tiedot ja merkitse selkeästi mitä tietoja puuttuu.

    Tärkeät taloudelliset tunnusluvut ja niiden laskentaperiaatteet henkilöyhtiöille:
    1. EBIT (Liikevoitto) = Liikevaihto + Liiketoiminnan muut tuotot - Materiaalit ja palvelut - Henkilöstökulut - Liiketoiminnan muut kulut - Poistot
    2. EBITDA (Käyttökate) = EBIT + Poistot
    3. Vapaa kassavirta (FCF) = Tilikauden tulos + Poistot
    4. Omavaraisuusaste (%) = (Oma pääoma / Taseen loppusumma) * 100

    TÄRKEÄÄ: Sinun tehtäväsi on VAIN analysoida tilinpäätöstiedot ja määrittää sopivat arvostuskertoimet yrityksen toimialan ja ominaisuuksien perusteella. ÄLÄ LASKE arvonmäärityksen lukuja - tämä tehdään erillisessä vaiheessa järjestelmässä.

    Etsi AINA tilinpäätöksestä mahdollisia anomalioita ja luo niistä kysymyksiä:

    1. Tuloslaskelman anomaliat:
    Tunnista tuloslaskelman puolelta erät, jotka vaativat todellista oikaisua (esim. kertaluonteiset tuotot tai kulut, merkittävät poikkeamat materiaaleissa tai palveluissa, epätavalliset henkilöstökulut, omistajan palkan vaikutus tulokseen yms.).

    2. Taseen anomaliat:
    Tunnista taseen puolelta merkittävät erät, jotka eivät ole "normaalissa" tilanteessa, kuten:
    - Selviä PDF:stä löytyviä ongelmia (esim. vanhentuneet saatavat, epäjohdonmukaiset varaukset)
    - Mahdollisia piileviä tai "off-balance sheet" -eriä (esim. aktivoimattomat aineettomat hyödykkeet)
    - Yrityksen arvoon vaikuttavaa kiinteää omaisuutta, joka ei liity yrityksen toimintaan

    USEAN DOKUMENTIN KÄSITTELY:
    - Sinulle on voitu antaa useita dokumentteja, jotka voivat olla eri tilikausilta tai sisältää täydentäviä tietoja
    - Tunnista ensin jokaisen dokumentin tilikausi, lajittele ne kronologisesti ja tarkista päällekkäisyydet
    - Jos kyseessä on sama yritys eri tilikausilta, keskity ensisijaisesti viimeisimpään tilikauteen
    - Jos dokumentit täydentävät toisiaan (esim. tase+tuloslaskelma), yhdistä tiedot kokonaisvaltaiseen analyysiin
    - Mainitse analyysissä, jos dokumenttien välillä on merkittäviä ristiriitoja
    - Painota viimeisintä tilikautta, mutta huomioi myös kehitystrendit useamman tilikauden yli

    Luo AINA 4-7 kysymystä näistä anomalioista, sekä lisää AINA kysymys omistajan palkan vaikutuksesta tulokseen.

    Vastaa JSON-muodossa, joka sisältää sekä analyysin että pakolliset kysymykset:

    {
      "company": {
        "name": "${companyName}",
        "business_id": "",
        "verified": true/false,
        "company_type": "" // Tunnista tarkempi yhtiömuoto: toiminimi, avoin yhtiö tai kommandiittiyhtiö
      },
      "documents": [
        {
          "filename": "tilinpäätös",
          "source_type": "financial_statement",
          "type": "financial_statement",
          "status": "valid",
          "issues": [],
          "financial_periods": [
            {
              "period": {
                "start_date": "YYYY-MM-DD",
                "end_date": "YYYY-MM-DD"
              },
              "income_statement": {
                "revenue": 0,
                "other_income": 0,
                "materials_and_services": 0,
                "personnel_expenses": 0,
                "other_expenses": 0,
                "depreciation": 0,
                "financial_income_expenses": 0,
                "taxes": 0,
                "net_income": 0
              },
              "balance_sheet": {
                "assets_total": 0,
                "intangible_assets": 0,
                "real_estate": 0,
                "machinery_and_equipment": 0,
                "other_tangible_assets": 0,
                "inventory": 0,
                "accounts_receivable": 0,
                "current_assets": 0,
                "equity": 0,
                "liabilities_total": 0,
                "long_term_liabilities": 0,
                "short_term_liabilities": 0
              },
              "dcf_items": {
                "cash": 0,
                "interest_bearing_debt": 0
              },
              "notes": {
                "guarantees": null,
                "extraordinary_items": null,
                "commitments": null,
                "leasing_liabilities": null,
                "pending_lawsuits": null,
                "related_party_transactions": null,
                "transferable_assets": null, // Siirrettävät omaisuuserät kuten brändi, kalusto, asiakkuudet
                "owner_compensation": null, // Yrittäjän/omistajan palkkakustannukset
                "other_obligations": null
              },
              "validation": {
                "balance_check": true/false,
                "missing_data": [
                  // Listaa tähän puuttuvat tiedot, jotka käyttäjän pitää täydentää
                  // Esim: {"field": "balance_sheet.inventory", "description": "Varaston arvo"}
                ],
                "anomalies": [
                  {
                    "item": "",
                    "category": "",
                    "amount": 0,
                    "period": "",
                    "description": "",
                    "requires_clarification": true/false,
                    "priority": "high/medium/low"
                  }
                ]
              },
              "valuation_multiples": {
                "revenue_multiple": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                },
                "ev_ebit": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                },
                "ev_ebitda": {
                  "multiple": "[määritä toimialan ja yrityksen ominaisuuksien perusteella]",
                  "justification": "[perustele valintasi]"
                }
              }
            }
          ]
        }
      ],
      "questions": [
        {
          "id": "entrepreneur_salary",
          "category": "entrepreneur_info",
          "description": "Mikä on yrittäjän oma palkkasumma vuodessa?",
          "question": "Mikä on yrittäjän oma palkkasumma vuodessa?",
          "impact": "Yrittäjän palkkasumma vaikuttaa merkittävästi henkilöyhtiön arvonmääritykseen"
        },
        {
          "id": "transferable_assets",
          "category": "business_value",
          "description": "Mitä siirrettäviä omaisuuseriä yrityksellä on (kalusto, asiakkuudet, sopimukset)?",
          "question": "Mitä siirrettäviä omaisuuseriä yrityksellä on (kalusto, asiakkuudet, sopimukset)?",
          "impact": "Siirrettävät omaisuuserät muodostavat henkilöyhtiön arvon pohjan"
        }
        // Lisää muut kysymykset tähän samassa muodossa - yhteensä 4-7 kysymystä
      ],
      "initialFindings": {
        "identified_issues": [],
        "company_type": "henkilöyhtiö",
        "industry": "",
        "size_category": "",
        "multi_year_analysis": {
          "has_multiple_periods": false,
          "period_count": 1,
          "latest_period": "YYYY-MM-DD to YYYY-MM-DD"
        }
      }
    }

    Ohjeita henkilöyhtiön tilinpäätöksen analysointiin:
    1. Tunnista yhtiömuoto mahdollisimman tarkasti (toiminimi, avoin yhtiö, kommandiittiyhtiö)
    2. Poimi kaikki saatavilla olevat tilinpäätöstiedot
    3. Tunnista tuloslaskelman ja taseen anomaliat ja merkitse ne validation.anomalies-listaan
    4. LUO AINA vähintään 4-7 kysymystä anomalioista ja lisää AINA kysymys omistajan palkasta
    5. Huomioi, että toiminimen myynnissä siirtyy yleensä liiketoiminta, ei oikeushenkilö
    6. Tunnista mahdolliset siirrettävät omaisuuserät (brändi, kalusto, asiakkuudet)
    7. Määritä sopivat arvostuskertoimet ottaen huomioon henkilöyhtiön erityispiirteet
    8a. Jos käsittelet useaa tilikautta, lisää financial_periods-listaan kaikki tilikaudet, mutta painota analyysissä viimeisintä
    8b. TÄRKEÄÄ: Jos käsittelet useita tilikausia, SINUN TULEE ANALYSOIDA JA LISÄTÄ KAIKKI TILIKAUDET financial_periods-listaan erillisinä objekteina. ÄLÄ yhdistä eri tilikausien tietoja yhdeksi tilikaudeksi. Jokainen tilikausi tulee olla oma objektinsa financial_periods-listassa, sisältäen kyseisen tilikauden period-, income_statement-, balance_sheet- ym. tiedot. Varmista, että kaikki tunnistetut tilikaudet säilyvät lopullisessa vastauksessa.
    9. ÄLÄ KOSKAAN jätä questions-listaa tyhjäksi, vaikka data vaikuttaisi täydelliseltä
    10. ÄLÄ LASKE arvonmäärityksen lukuja - määritä vain sopivat kertoimet

HUOMIO: Palauta vastauksesi PELKÄSTÄÄN validissa JSON-muodossa, ILMAN mitään selityksiä, johdantoja, 
    muuta tekstiä tai markdown-koodilohkoja (kolme backtick-merkkiä). Vastaa ainoastaan JSON-objektilla.
    
    KRIITTISTÄ: Tarkista, että JSON-syntaksi on täysin validi ilman ylimääräisiä merkkejä tai virheitä.
    Vastaa AINOASTAAN yhdellä JSON-objektilla ilman mitään muuta tekstiä.
  `;
}