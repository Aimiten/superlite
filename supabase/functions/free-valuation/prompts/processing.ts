// prompts/processing.ts
// Prompt for processing financial data and normalization

export function getProcessingPrompt(companyName: string, formattedAnswers: string): string {
  return `Analysoi tämä tilinpäätös ja palauta yrityksen taloudelliset tiedot strukturoidussa JSON-muodossa. 
    Yrityksen nimi: "${companyName}"

    Käyttäjä on antanut seuraavat vastaukset normalisointia varten:
    ${formattedAnswers}

    Tehtäväsi on:
    1. Poimia tilinpäätöksestä olennaiset taloudelliset tiedot tilinpäätöksestä.
    2. **Normalisoi tilinpäätöksen lukuja VAIN tarvittaessa ja käyttäjän antamien vastausten perusteella.** Keskity normalisoimaan kertaluonteisia eriä ja sellaisia eriä, jotka vääristävät yrityksen operatiivista tulosta tai eivät ole markkinatasoisia.  **Jos käyttäjä on vastannut epäselvästi, niin ÄLÄ normalisoi sitä.**
    3. Arvioi toimialakohtainen EV/Liikevaihto -kerroin ja EV/EBIT -kerroin sekä perustele nämä arviosi.
    4. Palauta tiedot alla olevassa JSON-muodossa.
    5. **Jos käyttäjän vastauksista jää epäselvyyksiä tai kysymyksiä, jotka voivat vaikuttaa arvonmääritykseen, listaa ne "unclear_items" kenttään JSON-vastauksessa.**

    Palauta vastaus TÄSMÄLLEEN tässä JSON-muodossa:

    {
      "tilinpaatos": {
        "tase": {
          "pysyvat_vastaavat": {
            "aineelliset_kayttoomaisuuserat": number,
            "aineettomat_hyodykkeet": number,
            "muut": number
          },
          "vaihtuvat_vastaavat": number,
          "velat": {
            "lyhytaikaiset": number,
            "pitkataikaiset": number
          }
        },
        "tuloslaskelma": {
          "liikevaihto": number,
          "liiketoiminnan_muut_tuotot": number,
          "liiketoiminnan_kulut": {
            "materiaalit": number,
            "henkilostokulut": number,
            "poistot": number,
            "muut_kulut": number
          },
          "liikevoitto": number
        }
      },
      "Arvioni": {
        "EV_kerroin": number,
        "EV_perustelut": string,
        "EV_EBIT_kerroin": number,
        "EV_EBIT_perustelut": string
      },
      "normalization": {
        "status": {
          "owner_salary_normalized": boolean,
          "premises_costs_normalized": boolean,
          "other_normalizations": boolean,
          "normalization_impact": string,
          "original_values": object,
          "adjusted_values": object,
          "normalizations_explained": [
            {
              "category": string,
              "original_value": number,
              "normalized_value": number,
              "explanation": string
            }
          ],
          "unclear_items": [
            string //Tähän listataan epäselvät asiat
          ]
        }
      }
    }

    TÄRKEÄÄ:
    - **Normalisoi tilinpäätöksen luvut VAIN jos käyttäjä on antanut siihen selkeän syyn ja ohjeen.**
    - Jos teet normalisointeja, tallenna alkuperäiset arvot normalization.status.original_values-objektiin ja normalisoidut arvot normalization.status.adjusted_values-objektiin.
    - Selitä jokainen tehty normalisointi normalization.status.normalizations_explained-kentässä.
    - **Listaa mahdolliset epäselvyydet tai kysymykset "unclear_items" kenttään.**
    - EV_kerroin-kohdassa anna arvio EV/Liikevaihto -KERTOIMESTA (ei suoraa enterprise value -arvoa). Tyypillisesti tämä kerroin vaihtelee välillä 0.5-5 riippuen toimialasta ja kannattavuudesta.
    - EV_EBIT_kerroin kohdassa anna arvio EV/EBIT -kertoimesta. Tyypillisesti tämä kerroin vaihtelee välillä 4-12 riippuen toimialasta ja kasvunäkymistä.`;
}