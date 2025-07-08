/**
 * gemini-parser.ts
 * 
 * Tämä moduuli tarjoaa robustin tavan jäsentää eri Gemini-mallien palauttamia JSON-vastauksia.
 * Se pystyy käsittelemään erilaisia JSON-formaatteja, markdown-koodilohkoja ja poimii
 * valideja JSON-objekteja/taulukoita mahdollisesti virheellisestäkin tekstivastauksesta.
 */

/**
 * Jäsentää Gemini API:n palauttaman vastauksen JSON-muotoon mahdollisimman robustisti.
 * Käsittelee useita erilaisia tapauksia, joilla Gemini voi palauttaa JSONia.
 * 
 * @param responseText Gemini API:n palauttama raakatekstivastaus
 * @param options Jäsennysvaihtoehdot (valinnainen)
 * @returns Jäsennetty JSON-objekti tai taulukko
 * @throws Error jos vastauksen jäsentäminen epäonnistuu kaikilla kokeilluilla tavoilla
 */
export function parseGeminiJsonResponse(
  responseText: string, 
  options: {
    logResponse?: boolean;  // Tulisiko lokittaa vastaus (oletus: true)
    expectFormat?: "object" | "array" | "any";  // Oletettu JSON-muoto (oletus: "any")
    logPrefix?: string;  // Etuliite lokiviesteille (oletus: "gemini-parser")
  } = {}
): any {
  const {
    logResponse = true,
    expectFormat = "any",
    logPrefix = "gemini-parser"
  } = options;

  try {
    if (!responseText) {
      throw new Error("Tyhjä vastaus Gemini API:lta");
    }

    // Lokita vastaus debuggausta varten
    if (logResponse) {
      if (responseText.length > 1000) {
        console.log(`[${logPrefix}] Vastauksen alku (200 merkkiä):`, responseText.substring(0, 200));
        console.log(`[${logPrefix}] Vastauksen loppu (200 merkkiä):`, responseText.substring(responseText.length - 200));
        console.log(`[${logPrefix}] Vastauksen pituus:`, responseText.length, "merkkiä");
      } else {
        console.log(`[${logPrefix}] Raaka vastaus:`, responseText);
      }
    }

    // 1. Yritä löytää täsmällinen JSON-objekti tai taulukko pattern matchingilla
    const expectedPattern = expectFormat === "object" ? /\{[\s\S]*\}/s : 
                           expectFormat === "array" ? /\[[\s\S]*\]/s : 
                           /(\{[\s\S]*\}|\[[\s\S]*\])/s;

    const jsonMatch = responseText.match(expectedPattern);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        console.log(`[${logPrefix}] Jäsennetty täsmällinen JSON ${Array.isArray(result) ? 'taulukko' : 'objekti'} onnistuneesti`);
        return result;
      } catch (e) {
        console.warn(`[${logPrefix}] Löydetyn JSON-rakenteen jäsennys epäonnistui, kokeillaan muita tapoja`);
        // Jatka seuraaviin tapoihin
      }
    }

    // 2. Etsi markdown-koodilohkoja
    const markdownMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/s);
    if (markdownMatch && markdownMatch[1]) {
      try {
        const result = JSON.parse(markdownMatch[1]);
        console.log(`[${logPrefix}] Jäsennetty markdown-koodilohkosta JSON onnistuneesti`);
        return result;
      } catch (e) {
        console.warn(`[${logPrefix}] Markdown-lohkon jäsennys epäonnistui, kokeillaan muita tapoja`);
        // Jatka seuraaviin tapoihin
      }
    }

    // 3a. Etsi JSON-objekteja
    if (expectFormat !== "array") {
      // Käytä greedy-regex objektille (huom: kattaa yksitason objektit)
      const objectPattern = /\{\s*"[^"]+"\s*:[\s\S]*?(?=\}\s*($|\n|\r))/g;
      const objectMatches = Array.from(responseText.matchAll(objectPattern));

      if (objectMatches.length > 0) {
        const objects = objectMatches.map(match => {
          try {
            let objectStr = match[0];
            // Varmista että objekti päättyy sulkevaan sulkeeseen
            if (!objectStr.endsWith('}')) objectStr += '}';
            return JSON.parse(objectStr);
          } catch (e) {
            console.warn(`[${logPrefix}] Objektin jäsennys epäonnistui:`, match[0].substring(0, 50));
            return null;
          }
        }).filter(Boolean);

        if (objects.length > 0) {
          console.log(`[${logPrefix}] Poimittu ${objects.length} JSON-objektia tekstistä`);
          return objects.length === 1 ? objects[0] : objects;
        }
      }
    }

    // 3b. Etsi JSON-taulukoita
    if (expectFormat !== "object") {
      const arrayPattern = /\[\s*\{[\s\S]*?\}\s*\]/g;
      const arrayMatches = Array.from(responseText.matchAll(arrayPattern));

      if (arrayMatches.length > 0) {
        const arrays = arrayMatches.map(match => {
          try {
            return JSON.parse(match[0]);
          } catch (e) {
            console.warn(`[${logPrefix}] Taulukon jäsennys epäonnistui:`, match[0].substring(0, 50));
            return null;
          }
        }).filter(Boolean);

        if (arrays.length > 0) {
          console.log(`[${logPrefix}] Poimittu ${arrays.length} JSON-taulukkoa tekstistä`);
          return arrays.length === 1 ? arrays[0] : arrays[0]; // Palautetaan ensimmäinen taulukko
        }
      }
    }

    // 4. Siivoa ja yritä korjata mahdollisesti virheellinen JSON
    console.log(`[${logPrefix}] Yksinkertaiset haut epäonnistuivat, yritetään korjata virheellistä JSONia`);

    // Korjausyritys 1: Etsi ensimmäinen JSON alkava ja viimeinen päättävä merkki
    let cleanedText = responseText
      .replace(/```[a-z]*\n/g, '') // Poista markdown aloitukset
      .replace(/```/g, '')         // Poista markdown lopetukset
      .replace(/[\r\n]+/g, ' ');   // Yhdistä rivit

    const objectStart = expectFormat !== "array" ? cleanedText.indexOf('{') : -1;
    const objectEnd = expectFormat !== "array" ? cleanedText.lastIndexOf('}') : -1;
    const arrayStart = expectFormat !== "object" ? cleanedText.indexOf('[') : -1;
    const arrayEnd = expectFormat !== "object" ? cleanedText.lastIndexOf(']') : -1;

    // Päätä, kumpi rakenne (objekti vai taulukko) on järkevämpi käsitellä
    let candidateJson = null;

    if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
      candidateJson = cleanedText.substring(objectStart, objectEnd + 1);
      console.log(`[${logPrefix}] Yritetään korjata JSON-objektia`);
    } else if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      candidateJson = cleanedText.substring(arrayStart, arrayEnd + 1);
      console.log(`[${logPrefix}] Yritetään korjata JSON-taulukkoa`);
    }

    if (candidateJson) {
      try {
        // Korjaa yleisiä JSON-virheitä
        const fixedJson = candidateJson
          .replace(/,\s*}/g, '}')           // Poista trailing commat objektin lopusta
          .replace(/,\s*\]/g, ']')          // Poista trailing commat taulukon lopusta
          .replace(/\\/g, '\\\\')           // Escape backslashit
          .replace(/([^\\])"/g, '$1\\"')    // Escape quotet jotka eivät ole jo escapattuja
          .replace(/([^\\])'/g, '$1"')      // Korvaa singlequotet doublequoteilla
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Varmista property-nimien quotet

        const result = JSON.parse(fixedJson);
        console.log(`[${logPrefix}] Virheellisen JSONin korjaus onnistui`);
        return result;
      } catch (e) {
        console.warn(`[${logPrefix}] JSON korjausyritys epäonnistui:`, e.message);
      }
    }

    // 5. Korjausyritys 2: Etsi virheellinen kohta
    if (expectFormat !== "array" && objectStart !== -1 && objectEnd !== -1) {
      try {
        console.log(`[${logPrefix}] Yritetään korjata objektia progressiivisesti`);
        // Etsi viimeinen validi JSON:in osa (progressiivisesti)
        let lastValid = "{";
        for (let i = objectStart + 1; i <= objectEnd; i++) {
          try {
            const partial = cleanedText.substring(objectStart, i) + "}";
            JSON.parse(partial);
            lastValid = partial;
          } catch (e) {
            // Jatka
          }
        }
        console.log(`[${logPrefix}] Osittainen objekti:`, lastValid);
        return JSON.parse(lastValid);
      } catch (e) {
        console.warn(`[${logPrefix}] Progressiivinen korjaus epäonnistui`);
      }
    }

    // Kaikki menetelmät epäonnistuivat, heitä virhe
    throw new Error("Ei voitu tunnistaa validia JSON-rakennetta vastauksesta");

  } catch (parseError) {
    console.error(`[${logPrefix}] Virhe Gemini JSON-vastauksen jäsentämisessä:`, parseError.message);
    if (!logResponse) {
      // Jos emme lokittaneet aiemmin, lokitetaan nyt virhetilanteessa
      if (responseText && responseText.length > 1000) {
        console.error(`[${logPrefix}] Vastauksen alku (200 merkkiä):`, responseText.substring(0, 200));
        console.error(`[${logPrefix}] Vastauksen loppu (200 merkkiä):`, responseText.substring(responseText.length - 200));
      } else if (responseText) {
        console.error(`[${logPrefix}] Raaka vastaus:`, responseText);
      }
    }
    throw new Error(`Tekoälyn vastauksen jäsentäminen epäonnistui: ${parseError.message}`);
  }
}

/**
 * Parantaa JSON-objektin ominaisuuksien jäsennystä rekursiivisesti.
 * Korjaa tyyppejä yrittämällä parsia numeroita ja boolean-arvoja, sekä poistaa ylimääräisiä tai NULL-arvoja.
 * 
 * @param obj Jäsennettävä objekti
 * @param cleanNull Poistetaanko null- ja undefined-arvot (oletus: true)
 * @param cleanEmpty Poistetaanko tyhjät stringit (oletus: false)
 * @returns Puhdistettu ja paranneltu objekti
 */
export function enhanceJsonObject(
  obj: any, 
  cleanNull: boolean = true,
  cleanEmpty: boolean = false
): any {
  // Tarkista onko null/undefined
  if (obj === null || obj === undefined) {
    return cleanNull ? undefined : obj;
  }

  // Tarkista onko tyhjä string
  if (cleanEmpty && typeof obj === "string" && obj.trim() === "") {
    return undefined;
  }

  // Käsittele stringit
  if (typeof obj === "string") {
    // Yritä parsia numeroiksi
    if (/^\d+$/.test(obj)) {
      return parseInt(obj, 10);
    }
    if (/^\d+\.\d+$/.test(obj)) {
      return parseFloat(obj);
    }
    // Yritä parsia boolean-arvoiksi
    if (obj.toLowerCase() === "true") return true;
    if (obj.toLowerCase() === "false") return false;

    // Palauta alkuperäinen string
    return obj;
  }

  // Käy läpi taulukot rekursiivisesti
  if (Array.isArray(obj)) {
    return obj
      .map((item) => enhanceJsonObject(item, cleanNull, cleanEmpty))
      .filter((item) => item !== undefined);
  }

  // Käy läpi objektit rekursiivisesti
  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = enhanceJsonObject(obj[key], cleanNull, cleanEmpty);
        if (value !== undefined) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  // Palauta muu arvo sellaisenaan
  return obj;
}