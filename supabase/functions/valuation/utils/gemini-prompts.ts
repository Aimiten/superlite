
// Prompt templates for Gemini API

// Prompt for analyzing financial data with user answers
export function createAnalysisPrompt(companyName: string, formattedAnswers: string, companyType?: string) {
  const isPartnership = companyType === "toiminimi" || 
                        companyType === "henkilöyhtiö" || 
                        companyType === "avoin yhtiö" || 
                        companyType === "kommandiittiyhtiö";

  return `
    Analysoi yrityksen "${companyName}" tilinpäätöstiedot uudelleen käyttäen käyttäjän antamia vastauksia täydentämään puuttuvia tietoja.
    
    Käyttäjän vastaukset täydentäviin kysymyksiin:
    ${formattedAnswers}
    
    ${isPartnership ? "Huomioi että kyseessä on henkilöyhtiö, jossa yrittäjän palkka ja edut vaikuttavat merkittävästi arvonmääritykseen." : ""}
    
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
              "calculated_fields": {
                "ebit": 0,
                "ebitda": 0,
                "free_cash_flow": 0,
                "roe": 0,
                "equity_ratio": 0
              },
              "valuation_multiples": {
                "ev_ebit": {
                  "multiple": 0,
                  "justification": ""
                },
                "ev_ebitda": {
                  "multiple": 0,
                  "justification": ""
                }${!isPartnership ? ',\n                "p_e": {\n                  "multiple": 0,\n                  "justification": ""\n                }' : ''}
              },
              "valuations": {
                "ev_ebit_valuation": 0,
                "ev_ebitda_valuation": 0${!isPartnership ? ',\n                "pe_valuation": 0' : ''}
              }
            }
          ]
        }
      ]
    }

    Ohjeita tietojen käsittelyyn:
    1. Käytä käyttäjän antamia vastauksia täydentämään puuttuvia tietoja
    2. Laske tunnusluvut uudestaan täydennettyjen tietojen perusteella
    3. Määritä sopivat arvostuskertoimet ja laske niiden perusteella yrityksen arvo
    4. Palauta vain JSON-muoto, ilman ylimääräisiä selityksiä
    5. Varmista että kaikki kentät on täytetty ja että JSON on validi
  `;
}

// Prompt for corporations
export function createCorporationPrompt(companyName: string) {
  return `
    Analysoi yrityksen ${companyName} tilinpäätöstiedot ja poimi tarkat arvot seuraavaan JSON-muotoon.
    
    Tärkeät taloudelliset tunnusluvut ja niiden laskentaperiaatteet:
    1. EBIT (Liikevoitto) = Liikevaihto + Liiketoiminnan muut tuotot - Materiaalit ja palvelut - Henkilöstökulut - Liiketoiminnan muut kulut - Poistot
    2. EBITDA (Käyttökate) = EBIT + Poistot
    3. Vapaa kassavirta (FCF) = Tilikauden tulos + Poistot
      (yksinkertaistettuna voit laskea: Tilikauden tulos + Poistot)
    4. ROE (Oman pääoman tuotto-%) = (Tilikauden tulos / Oma pääoma) * 100
    5. Omavaraisuusaste (%) = (Oma pääoma / Taseen loppusumma) * 100

    Etsi AINA tilinpäätöksestä mahdollisia anomalioita ja luo niistä kysymyksiä:

    1. Tuloslaskelman anomaliat:
    Tunnista tuloslaskelman puolelta erät, jotka vaativat todellista oikaisua (esim. kertaluonteiset tuotot tai kulut, merkittävät poikkeamat materiaaleissa tai palveluissa, epätavalliset henkilöstökulut yms.).

    2. Taseen anomaliat:
    Tunnista taseen puolelta merkittävät erät, jotka eivät ole "normaalissa" tilanteessa, kuten:
    - Selviä PDF:stä löytyviä ongelmia (esim. vanhentuneet saatavat, epäjohdonmukaiset varaukset)
    - Mahdollisia piileviä tai "off-balance sheet" -eriä (esim. aktivoimattomat aineettomat hyödykkeet)
    - Yrityksen arvoon vaikuttavaa kiinteää omaisuutta, joka ei liity yrityksen toimintaan

    Luo AINA 4-7 kysymystä näistä anomalioista, sekä lisää AINA kysymys omistajan palkan vaikutuksesta tulokseen.

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
                "ev_ebit": {
                  "multiple": 0,
                  "justification": "Yksityiskohtainen perustelu, miksi tämä kerroin valittiin tälle yritykselle. Huomioi toimiala, yhtiön koko, kasvunopeus ja kannattavuus."
                },
                "ev_ebitda": {
                  "multiple": 0,
                  "justification": "Yksityiskohtainen perustelu, miksi tämä kerroin valittiin tälle yritykselle. Huomioi toimiala, yhtiön koko, kasvunopeus ja kannattavuus."
                },
                "p_e": {
                  "multiple": 0,
                  "justification": "Yksityiskohtainen perustelu, miksi tämä kerroin valittiin tälle yritykselle. Huomioi toimiala, yhtiön koko, kasvunopeus ja kannattavuus."
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
        // Lisää muut kysymykset tähän samassa muodossa - yhteensä 4-7 kysymystä
      ],
      "initialFindings": {
        "identified_issues": [],
        "company_type": "osakeyhtiö",
        "industry": "",
        "size_category": ""
      }
    }

    Ohjeita tilinpäätöksen analysointiin:
    1. Tunnista eri tilikaudet ja niiden päivämäärät tarkasti
    2. Poimi tuloslaskelman ja taseen luvut euromääräisinä ilman yksikköä
    3. Laske tunnusluvut (EBIT, EBITDA) yllä olevien laskukaavojen mukaisesti
    4. Tunnista tuloslaskelman ja taseen anomaliat ja merkitse ne validation.anomalies-listaan
    5. LUO AINA vähintään 4-7 kysymystä anomalioista ja lisää AINA kysymys omistajan palkasta
    6. Taseessa pitäisi olla yhtä paljon vastaavaa ja vastattavaa - merkitse balance_check true/false sen mukaan
    7. Luo jokaiselle kysymykselle yksilöllinen id, kuvaava kategoria ja selkeä kysymys
    8. ÄLÄ KOSKAAN jätä questions-listaa tyhjäksi, vaikka data vaikuttaisi täydelliseltä
  `;
}

// Prompt for partnerships (sole traders, general partnerships, limited partnerships)
export function createPartnershipPrompt(companyName: string) {
  return `
    Analysoi henkilöyhtiön ${companyName} tilinpäätöstiedot tai kirjanpito ja poimi tarkat arvot seuraavaan JSON-muotoon.
    
    Huomioi, että henkilöyhtiöiden (toiminimi, avoin yhtiö, kommandiittiyhtiö) kirjanpito ja tilinpäätöstiedot ovat usein suppeampia kuin osakeyhtiöiden. Etsi saatavilla olevat tiedot ja merkitse selkeästi mitä tietoja puuttuu.
    
    Tärkeät taloudelliset tunnusluvut ja niiden laskentaperiaatteet henkilöyhtiöille:
    1. EBIT (Liikevoitto) = Liikevaihto + Liiketoiminnan muut tuotot - Materiaalit ja palvelut - Henkilöstökulut - Liiketoiminnan muut kulut - Poistot
    2. EBITDA (Käyttökate) = EBIT + Poistot
    3. Vapaa kassavirta (FCF) = Tilikauden tulos + Poistot
    4. Omavaraisuusaste (%) = (Oma pääoma / Taseen loppusumma) * 100

    Etsi AINA tilinpäätöksestä mahdollisia anomalioita ja luo niistä kysymyksiä:

    1. Tuloslaskelman anomaliat:
    Tunnista tuloslaskelman puolelta erät, jotka vaativat todellista oikaisua (esim. kertaluonteiset tuotot tai kulut, merkittävät poikkeamat materiaaleissa tai palveluissa, epätavalliset henkilöstökulut, omistajan palkan vaikutus tulokseen yms.).

    2. Taseen anomaliat:
    Tunnista taseen puolelta merkittävät erät, jotka eivät ole "normaalissa" tilanteessa, kuten:
    - Selviä PDF:stä löytyviä ongelmia (esim. vanhentuneet saatavat, epäjohdonmukaiset varaukset)
    - Mahdollisia piileviä tai "off-balance sheet" -eriä (esim. aktivoimattomat aineettomat hyödykkeet)
    - Yrityksen arvoon vaikuttavaa kiinteää omaisuutta, joka ei liity yrityksen toimintaan

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
                "ev_ebit": {
                  "multiple": 0,
                  "justification": "Yksityiskohtainen perustelu, miksi tämä kerroin valittiin tälle yritykselle."
                },
                "ev_ebitda": {
                  "multiple": 0,
                  "justification": "Yksityiskohtainen perustelu, miksi tämä kerroin valittiin tälle yritykselle."
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
        "size_category": ""
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
    8. ÄLÄ KOSKAAN jätä questions-listaa tyhjäksi, vaikka data vaikuttaisi täydelliseltä
  `;
}
