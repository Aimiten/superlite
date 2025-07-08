
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateValuationFields(data: any) {
  console.log("Starting calculateValuationFields with data:", data ? "Data present" : "No data");
  
  // Käydään läpi kaikki dokumentit ja talouskaudet
  if (data?.documents && data.documents.length > 0) {
    data.documents.forEach((doc: any, docIndex: number) => {
      console.log(`Processing document ${docIndex + 1}/${data.documents.length}`);
      
      if (doc.financial_periods && doc.financial_periods.length > 0) {
        doc.financial_periods.forEach((periodData: any, periodIndex: number) => {
          console.log(`Processing period ${periodIndex + 1}/${doc.financial_periods.length}: ${periodData.period_description || 'Unknown period'}`);
          
          // Poimitaan tuloslaskelman ja taseen kentät
          const inc = periodData.income_statement || {};
          const bal = periodData.balance_sheet || {};

          const revenue = inc.revenue ?? 0;
          const otherIncome = inc.other_income ?? 0;
          const materials = inc.materials_and_services ?? 0;
          const personnel = inc.personnel_expenses ?? 0;
          const otherExpenses = inc.other_expenses ?? 0;
          const depreciation = inc.depreciation ?? 0;
          const netIncome = inc.net_income ?? 0;
          const financialItems = inc.financial_income_expenses ?? 0;
          const taxes = inc.taxes ?? 0;

          console.log(`Financial values for period:
          - Revenue: ${revenue}
          - Other Income: ${otherIncome}
          - Materials: ${materials}
          - Personnel: ${personnel}
          - Other Expenses: ${otherExpenses}
          - Depreciation: ${depreciation}
          - Net Income: ${netIncome}
          - Financial Items: ${financialItems}
          - Taxes: ${taxes}`);

          // Lasketaan EBIT (liikevoitto) oikein
          // EBIT = liikevaihto + muut tuotot - materiaalit - henkilöstökulut - muut kulut - poistot
          const ebit = revenue + otherIncome - materials - personnel - otherExpenses - depreciation;
          
          // EBITDA = EBIT + poistot (käyttökate)
          const ebitda = ebit + depreciation;

          // Tarkistus: EBIT pitäisi olla myös = netIncome + taxes + financial_items
          const ebitAlternative = netIncome + Math.abs(taxes) + Math.abs(financialItems);
          console.log(`EBIT calculation comparison:
          - Direct calculation (Revenue ... - Depreciation): ${ebit}
          - Alternative (Net Income + Taxes + Financial Items): ${ebitAlternative}
          - Difference: ${ebit - ebitAlternative}`);

          // Yksinkertainen FCF
          const freeCashFlow = netIncome + depreciation;

          // ROE = netIncome / equity * 100
          const equity = bal.equity ?? 0;
          const roe = equity !== 0 ? (netIncome / equity) * 100 : null;

          // Omavaraisuusaste = (equity / assets_total) * 100
          const assetsTotal = bal.assets_total ?? 0;
          const equityRatio = assetsTotal !== 0 ? (equity / assetsTotal) * 100 : null;

          console.log(`Calculated metrics:
          - EBIT: ${ebit}
          - EBITDA: ${ebitda}
          - Free Cash Flow: ${freeCashFlow}
          - ROE: ${roe !== null ? roe.toFixed(2) + '%' : 'N/A'}
          - Equity Ratio: ${equityRatio !== null ? equityRatio.toFixed(2) + '%' : 'N/A'}`);

          // Päivitetään calculated_fields
          periodData.calculated_fields = {
            ebit,
            ebitda,
            free_cash_flow: freeCashFlow,
            roe,
            equity_ratio: equityRatio
          };
          
          // Lisätään arvostuskertoimet, jos niitä ei ole
          if (!periodData.valuation_multiples) {
            // Määritellään toimiala tarkemmin yrityksen tietojen perusteella
            let industry = data.company?.industry?.toLowerCase() || '';
            if (!industry && doc.company?.industry) {
              industry = doc.company.industry.toLowerCase();
            }
            
            console.log(`Determining valuation multiples for industry: ${industry || 'Unknown'}`);
            
            // Oletuskertoimet toimialan mukaan
            let ev_ebit_multiple = 8;
            let ev_ebitda_multiple = 6;
            let p_e_multiple = 10;
            let revenue_multiple = 0.8;
            
            // Päivitetään kertoimet yrityksen koon ja toimialan mukaan
            // Teknologia-alan yritykset saavat korkeammat kertoimet
            if (industry.includes('teknologia') || industry.includes('ohjelmisto') || industry.includes('it') || 
                industry.includes('software') || industry.includes('technology')) {
              ev_ebit_multiple = 12;
              ev_ebitda_multiple = 10;
              p_e_multiple = 15;
              revenue_multiple = 1.5;
              console.log("Using technology industry multipliers");
            } 
            // Palveluyritykset
            else if (industry.includes('palvelu') || industry.includes('konsultointi') || 
                     industry.includes('service') || industry.includes('consulting')) {
              ev_ebit_multiple = 7;
              ev_ebitda_multiple = 5;
              p_e_multiple = 9;
              revenue_multiple = 1.0;
              console.log("Using service industry multipliers");
            }
            // Tuotantoyritykset
            else if (industry.includes('valmistus') || industry.includes('tuotanto') || 
                     industry.includes('manufacturing') || industry.includes('production')) {
              ev_ebit_multiple = 6;
              ev_ebitda_multiple = 5;
              p_e_multiple = 8;
              revenue_multiple = 0.7;
              console.log("Using manufacturing industry multipliers");
            }
            // Rakennusala
            else if (industry.includes('rakennus') || industry.includes('construction')) {
              ev_ebit_multiple = 5;
              ev_ebitda_multiple = 4;
              p_e_multiple = 7;
              revenue_multiple = 0.5;
              console.log("Using construction industry multipliers");
            }
            
            // Skaalaa kertoimia yrityksen koon mukaan
            if (revenue > 10000000) { // Yli 10M€
              ev_ebit_multiple += 2;
              ev_ebitda_multiple += 1;
              p_e_multiple += 2;
              console.log("Scaling multipliers up for large company (>10M€ revenue)");
            } else if (revenue < 1000000) { // Alle 1M€
              ev_ebit_multiple -= 1;
              ev_ebitda_multiple -= 1;
              p_e_multiple -= 1;
              console.log("Scaling multipliers down for small company (<1M€ revenue)");
            }
            
            // Kannattavuuden vaikutus kertoimiin
            const ebitMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
            if (ebitMargin > 20) { // Erittäin kannattava
              ev_ebit_multiple += 1;
              ev_ebitda_multiple += 1;
              console.log("Scaling multipliers up for high profitability (EBITDA margin >20%)");
            } else if (ebitMargin < 5) { // Heikosti kannattava
              ev_ebit_multiple -= 1;
              ev_ebitda_multiple -= 1;
              console.log("Scaling multipliers down for low profitability (EBITDA margin <5%)");
            }
            
            // Lisätään justification-tekstit jokaiselle kertoimelle
            periodData.valuation_multiples = {
              ev_ebit: {
                multiple: ev_ebit_multiple,
                justification: `EV/EBIT ${ev_ebit_multiple}x kerroin perustuu ${
                  industry ? `${industry}-toimialan` : 'toimialasi'
                } yleiseen tasoon. ${
                  industry.includes('teknologia') ? 
                    'Teknologia-alalla käytetään yleisesti korkeampia kertoimia johtuen vahvemmista kasvuodotuksista ja paremmasta skaalautuvuudesta.' : 
                  industry.includes('palvelu') ? 
                    'Palveluliiketoiminnassa kerroin heijastaa kevyempää taserakennetta ja maltillisempia investointitarpeita.' : 
                  industry.includes('tuotanto') || industry.includes('valmistus') ? 
                    'Tuotantoyrityksillä kertoimet ovat tyypillisesti maltillisempia johtuen korkeammista investointitarpeista ja vahvemmasta kilpailusta.' :
                  industry.includes('rakennus') ?
                    'Rakennusalalla käytetään tyypillisesti matalampia kertoimia johtuen toimialan syklisyydestä ja matalammista marginaaleista.' :
                    'Tämä kerroin huomioi yrityksesi toimialan ja koon.'
                } ${
                  revenue > 10000000 ? 
                    'Suuremman kokoluokan yrityksille käytetään korkeampia kertoimia johtuen vakiintuneemmasta asemasta.' : 
                  revenue < 1000000 ? 
                    'Pienimmille yrityksille käytetään varovaisempia kertoimia johtuen korkeammasta riskiprofiilista.' : 
                    'Kertoimessa on huomioitu yrityksesi kokoluokka.'
                } ${
                  ebitMargin > 20 ?
                    'Korkea kannattavuutesi nostaa kerrointa, sillä sijoittajat arvostavat keskimääräistä parempaa tuottokykyä.' :
                  ebitMargin < 5 ?
                    'Maltillinen kannattavuus laskee kerrointa, sillä sijoittajat arvioivat tulevaisuuden tuottopotentiaalin varovaisemmin.' :
                    'Kannattavuustasosi on huomioitu kertoimessa.'
                }`
              },
              ev_ebitda: {
                multiple: ev_ebitda_multiple,
                justification: `EV/EBITDA ${ev_ebitda_multiple}x kerroin on yleisesti käytetty arvostusmetodi, joka huomioi yrityksen operatiivisen kannattavuuden ennen poistoja. ${
                  industry.includes('teknologia') ? 
                    'Teknologia-alan yrityksillä EBITDA-kertoimet ovat tyypillisesti korkeampia (8-12x) johtuen vahvasta skaalautuvuudesta.' : 
                  industry.includes('palvelu') ? 
                    'Palveluyrityksissä EBITDA-kertoimet (4-7x) heijastavat liiketoiminnan vähäisempiä investointitarpeita.' : 
                  industry.includes('tuotanto') || industry.includes('valmistus') ? 
                    'Tuotantoyrityksillä EBITDA on erityisen käyttökelpoinen mittari, koska se neutraloi erilaisten poistokäytäntöjen vaikutukset.' :
                  industry.includes('rakennus') ?
                    'Rakennusalalla EBITDA-kertoimet (3-5x) ovat tyypillisesti matalampia johtuen alalle tyypillisistä projektiriskeistä.' :
                    'Tämä kerroin soveltuu hyvin yrityksille, joilla on merkittäviä käyttöomaisuusinvestointeja.'
                } Käyttökate (EBITDA) antaa hyvän kuvan yrityksen kyvystä tuottaa operatiivista kassavirtaa, mikä on keskeinen tekijä arvonmäärityksessä.`
              },
              p_e: {
                multiple: p_e_multiple,
                justification: `P/E ${p_e_multiple}x on yleisimmin käytetty arvostuskerroin, joka kuvaa yrityksen markkina-arvon ja nettotuloksen suhdetta. ${
                  industry.includes('teknologia') ? 
                    'Teknologia-alan korkeammat P/E-kertoimet (12-20x) heijastavat sijoittajien odotuksia tulevasta kasvusta.' : 
                  industry.includes('palvelu') ? 
                    'Palveluyrityksillä P/E-kerroin (8-12x) perustuu vakaaseen tuloksentekokykyyn ja maltilliseen kasvuun.' : 
                  industry.includes('tuotanto') || industry.includes('valmistus') ? 
                    'Perinteisemmillä tuotantoaloilla P/E-kertoimet (6-10x) ovat matalampia heijastellen kypsempää markkinaa.' :
                  industry.includes('rakennus') ?
                    'Rakennusalan matalammat P/E-kertoimet (5-8x) heijastavat alan syklisyyttä ja alempia marginaaleja.' :
                    'P/E-kerroin kuvastaa sijoittajien valmiutta maksaa yrityksen tuloksesta.'
                } Pk-yritysten arvostuksessa P/E-kerrointa täytyy käyttää harkiten, koska tulokseen vaikuttavat omistajan palkka ja muut harkinnanvaraiset erät.`
              },
              revenue_multiple: {
                multiple: revenue_multiple,
                justification: `Liikevaihtokerroin ${revenue_multiple.toFixed(1)}x on yksinkertainen mutta tehokas tapa arvioida ${
                  industry ? industry + "-" : ""
                }alan yrityksen arvoa erityisesti tilanteissa, joissa tulos ei anna oikeaa kuvaa yrityksen potentiaalista. ${
                  industry.includes('teknologia') || industry.includes('ohjelmisto') ? 
                    'Ohjelmisto- ja teknologia-alan yrityksillä käytetään tyypillisesti korkeampia liikevaihtokertoimia (1.0-3.0x) johtuen korkeista bruttomarginaaleista ja kasvupotentiaalista.' : 
                  industry.includes('palvelu') ? 
                    'Palveluyrityksillä liikevaihtokertoimet (0.8-1.5x) heijastavat tyypillisesti kevyempää kulurakennetta ja skaalautuvuutta.' : 
                  industry.includes('tuotanto') || industry.includes('valmistus') ? 
                    'Tuotantoyrityksissä liikevaihtokertoimet (0.5-1.0x) ovat matalampia johtuen tyypillisesti pienemmistä marginaaleista ja pääomaintensiivisyydestä.' :
                  industry.includes('rakennus') ?
                    'Rakennusalalla liikevaihtokertoimet (0.3-0.7x) ovat matalampia johtuen projektiluontoisuudesta ja kilpaillusta markkinasta.' :
                    'Liikevaihtokerroin on erityisen hyödyllinen nopeasti kasvavien yritysten tai tappiollisten yritysten arvioinnissa.'
                } Liikevaihtokerroin soveltuu erityisesti tilanteisiin, joissa yritys on kasvuvaiheessa tai tulosta optimoidaan verosuunnittelulla.`
              }
            };
            
            console.log("Added valuation multiples with justifications");
          }
        });
      }
    });
  }
  
  return data;
}
