// prompts/manual-inputs.ts
// Prompt for processing manual inputs

export function getManualInputsPrompt(companyName: string, revenue: number, profit: number, assets: number, liabilities: number): string {
  return `Analysoi nämä yksinkertaiset taloudelliset tiedot ja palauta arvio JSON-muodossa. 
  Yrityksen nimi: "${companyName}"

  Taloudelliset tiedot:
  - Liikevaihto: ${revenue} euroa
  - Tulos: ${profit} euroa
  - Varat: ${assets} euroa
  - Velat: ${liabilities} euroa

  Palauta arvio seuraavassa JSON-muodossa:
  {
    "tilinpaatos": {
      "tase": {
        "pysyvat_vastaavat": {
          "aineelliset_kayttoomaisuuserat": 0,
          "aineettomat_hyodykkeet": 0,
          "muut": 0
        },
        "vaihtuvat_vastaavat": 0,
        "velat": {
          "lyhytaikaiset": 0,
          "pitkataikaiset": 0
        }
      },
      "tuloslaskelma": {
        "liikevaihto": ${revenue},
        "liiketoiminnan_muut_tuotot": 0,
        "liiketoiminnan_kulut": {
          "materiaalit": 0,
          "henkilostokulut": 0,
          "poistot": 0,
          "muut_kulut": 0
        },
        "liikevoitto": ${profit}
      }
    },
    "Arvioni": {
      "EV_kerroin": 0,
      "EV_perustelut": string,
      "EV_EBIT_kerroin": 0,
      "EV_EBIT_perustelut": string
    }
  }

  Arvion tulee perustua annettuihin lukuihin. EV_kerroin-kohdassa anna arvio EV/Liikevaihto -KERTOIMESTA (ei suoraa enterprise value -arvoa). Tyypillisesti tämä kerroin vaihtelee välillä 0.5-5 riippuen toimialasta ja kannattavuudesta.
  Anna myös EV_EBIT_kerroin, joka on arvio EV/EBIT -kertoimesta. Tyypillisesti tämä kerroin vaihtelee välillä 4-12 riippuen toimialasta ja yrityksen kasvunäkymistä.
  Palauta VAIN JSON ilman selityksiä.`;
}