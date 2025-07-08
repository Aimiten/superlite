// create-dd-tasks-prompt.ts - Luo DD-tehtävien generointiin käytetyn promptin

export function createDDTasksPrompt(data) {
  const { ddRiskAnalysis, companyData, companyInfo, tasks, assessmentData, 
          valuationData, impactData, documents } = data;

  // Erottele tehtävät suoritustilan mukaan
  const completedTasks = tasks.filter(t => t.completion_status === "completed");
  const inProgressTasks = tasks.filter(t => t.completion_status === "in_progress");
  const notStartedTasks = tasks.filter(t => t.completion_status === "not_started");

  // Funktio tehtävän vastauksen näyttämiseen optimaalisesti
  function getTaskResponseText(task) {
    // Ensisijaisesti käytä value-kentän tietoja
    if (task.value && Object.keys(task.value).length > 0) {
      if (task.type === 'checkbox') {
        return `Vastaus: ${task.value.checked ? 'Kyllä/Tehty' : 'Ei/Tekemättä'}`;
      } else if (task.type === 'multiple_choice' && task.value.selected) {
        return `Vastaus: ${task.value.selected}`;
      } else if (task.type === 'text_input' && task.value.text) {
        return `Vastaus: ${task.value.text}`;
      } else if (task.type === 'document_upload' && task.value.file_name) {
        return `Vastaus: Tiedosto "${task.value.file_name}" ladattu`;
      } else {
        return `Vastaus: ${JSON.stringify(task.value)}`;
      }
    } 
    // Toissijaisesti käytä task_responses-tietoja
    else if (task.task_responses && task.task_responses.length > 0) {
      const response = task.task_responses[0];
      if (response.text_response) {
        return `Vastaus: ${response.text_response}`;
      } else if (response.file_name) {
        return `Vastaus: Tiedosto "${response.file_name}" ladattu`;
      } else {
        return `Vastaus: Merkitty suoritetuksi`;
      }
    } 
    // Jos ei löydy vastausta, mutta tehtävä on suoritettu
    else if (task.completion_status === "completed") {
      return `Vastaus: Merkitty suoritetuksi ${task.completed_at ? 
        new Date(task.completed_at).toLocaleDateString('fi-FI') : 'tuntemattomana ajankohtana'}`;
    }
    // Muissa tapauksissa
    return '';
  }

  // Aloita prompt yrityksen perustiedoilla
  let prompt = `
Olet yrityskehityksen asiantuntija, joka auttaa luomaan konkreettisia tehtäviä due diligence -riskien korjaamiseksi.

# YRITYSPROFIILI
Nimi: ${companyData.name}
Toimiala: ${companyData.industry || 'Ei määritelty'}
Perustamisvuosi: ${companyData.founded || 'Ei tiedossa'}
Henkilöstömäärä: ${companyData.employees || 'Ei tiedossa'}
Yhtiömuoto: ${companyData.company_type || 'Ei määritelty'}
Kuvaus: ${companyData.description || 'Ei kuvausta'}
`;

  // Lisää yritysanalyysi jos saatavilla
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

  // Lisää arvioinnin tulokset jos saatavilla
  if (assessmentData && assessmentData.results) {
    prompt += `
# ARVIOINNIN TULOKSET
${typeof assessmentData.results === 'string' 
  ? assessmentData.results 
  : JSON.stringify(assessmentData.results, null, 2)}
`;
  }

  // Lisää arvovaikutusanalyysi jos saatavilla
  if (impactData) {
    prompt += `
# ARVOVAIKUTUSANALYYSI
Alkuperäinen arvonmääritys: ${JSON.stringify(impactData.original_valuation_snapshot || {}, null, 2)}
Mukautettu arvonmääritys: ${JSON.stringify(impactData.adjusted_valuation_result || {}, null, 2)}
Mukautuskertoimet: ${JSON.stringify(impactData.adjustment_factors || {}, null, 2)}
`;
  } else if (valuationData && valuationData.results) {
    prompt += `
# ARVONMÄÄRITYS
${typeof valuationData.results === 'string' 
  ? valuationData.results 
  : JSON.stringify(valuationData.results, null, 2)}
`;
  }

  // Lisää dokumentaatio jos saatavilla
  if (documents && documents.length > 0) {
    prompt += `
# DOKUMENTAATIO
Saatavilla olevat dokumentit (${documents.length} kpl):
${documents.map(doc => `- ${doc.name} (${doc.document_type || 'Dokumentti'})`).join('\n')}

TÄRKEÄÄ: Kaikki yllä mainitut dokumentit on sisällytetty tähän pyyntöön.
Tutki ne huolellisesti niiden sisältämien tietojen hyödyntämiseksi DD-riskianalyysissä.
`;
  }

  // Lisää riskianalyysin tiedot
  const riskDetails = ddRiskAnalysis.riskiKategoriat.map(risk => `
Riskiluokka: ${risk.kategoria}
Riskitaso: ${risk.riskitaso}/10
Vaikutus: ${risk.vaikutus}
Kuvaus: ${risk.kuvaus}

Havainnot:
${risk.havainnot.map(h => `- ${h}`).join('\n')}

Toimenpidesuositukset:
${risk.toimenpideSuositukset.map(s => `- ${s}`).join('\n')}
`).join('\n\n---\n\n');

  prompt += `
# DD-RISKIANALYYSI
Kokonaisriskitaso: ${ddRiskAnalysis.kokonaisRiskitaso}/10

Keskeiset löydökset:
${ddRiskAnalysis.keskeisimmatLöydökset.map(f => `- ${f}`).join('\n')}

Yhteenveto:
${ddRiskAnalysis.yhteenveto}

Riskikategorioiden yksityiskohdat:
${riskDetails}
`;

  // Lisää suoritetut tehtävät ja niiden vastaukset
  prompt += `
# SUORITETUT TEHTÄVÄT JA NIIDEN VASTAUKSET
Seuraavat tehtävät on jo suoritettu. Huomioi nämä tiedot ja vastaukset kehittäessäsi uusia tehtäviä:

${completedTasks.length > 0 ? completedTasks.map(task => `
## ${task.title}
- Kategoria: ${task.category}
- Prioriteetti: ${task.priority}
- Vaikutus: ${task.impact}
- Tyyppi: ${task.type}
- Kuvaus: ${task.description}
- ${getTaskResponseText(task)}
- Suoritettu: ${task.completed_at ? new Date(task.completed_at).toLocaleDateString('fi-FI') : 'tuntematon päivämäärä'}
`).join('\n---\n') : 'Ei vielä suoritettuja tehtäviä.'}
`;

  // Lisää keskeneräiset ja aloittamattomat tehtävät
  prompt += `
# KESKENERÄISET JA ALOITTAMATTOMAT TEHTÄVÄT
Seuraavat tehtävät ovat joko työn alla tai aloittamatta. Vältä luomasta lähes identtisiä tehtäviä, ellei riskiarvio erityisesti edellytä näiden alueiden vahvistamista:

${inProgressTasks.length > 0 ? `
## Työn alla olevat tehtävät:
${inProgressTasks.map(task => `- ${task.title} (${task.category}): ${task.description}`).join('\n')}
` : 'Ei keskeneräisiä tehtäviä.'}

${notStartedTasks.length > 0 ? `
## Aloittamattomat tehtävät:
${notStartedTasks.map(task => `- ${task.title} (${task.category}): ${task.description}`).join('\n')}
` : 'Ei aloittamattomia tehtäviä.'}
`;

  // Lisää ohjeita tehtävien luomiseen
  prompt += `
# OHJEITA TEHTÄVIEN LUOMISEEN

1. TÄYDENNÄ NYKYISIÄ TEHTÄVIÄ: Luo tehtäviä, jotka täydentävät jo suoritettuja tehtäviä ja rakentavat niissä opitun päälle.

2. ÄLÄ TOISTA TARPEETTOMASTI: Älä luo tehtäviä, jotka ovat identtisiä olemassaolevien kanssa, ellei riskianalyysi erityisesti painota tätä aluetta, muista perustella ja kertoa, jos päädyt tekemään näin.

3. JOSKUS TOISTO ON TARPEEN: Voit luoda päällekkäisiä tehtäviä jos:
   - Nykyiset tehtävät eivät täysin kata tunnistettua riskiä
   - Riskianalyysi painottaa tiettyä aluetta erityisesti
   - Tarvitaan vahvistusta tai seurantaa aiemmalle tehtävälle

4. PAINOTA RISKIALUEITA: Keskity erityisesti riskianalyysissä tunnistettuihin korkean riskin alueisiin.

5. HUOMIOI YRITYKSEN TIEDOT: Hyödynnä annettuja yritystietoja, dokumentteja ja aiempia analyyseja tehtävien räätälöimiseksi.

# TEHTÄVÄSI
Luo 8-15 konkreettista tehtävää, jotka auttavat korjaamaan yllä mainitut DD-riskit. Huomioi kaikki annetut tiedot yrityksestä, riskeistä ja olemassa olevista tehtävistä.

Luo tehtäviä eri kestoisille ajanjaksoille:
- Lyhyitä (0-5 päivää)
- Keskipitkiä (1-4 viikkoa)
- Pitkäkestoisia (1-12 kuukautta)
- Sisällytä vähintään 2-3 pitkäkestoista seurantatehtävää (esim. asiakastyytyväisyyden mittaus 12kk);
- Pitkäkestoiset tehtävät kohdentuvat riskiluokitukseltaan >7/10 olevaan kategoriaan.

Tehtävätyypit:
- checkbox (yksinkertainen kyllä/ei-tehtävä)
- multiple_choice (monivalintatehtävä)
- text_input (tekstimuotoinen vastaus)
- document_upload (tiedoston lataus)
- explanation (laajempi selite)
- contact_info (yhteystiedon lisääminen)

Kategoriat:
- financial (talous)
- legal (sopimukset)
- operations (toiminta)
- documentation (dokumentaatio)
- customers (asiakkaat)
- personnel (henkilöstö)
- strategy (strategia)

Palauta tehtävät AINOASTAAN JSON-muodossa seuraavan rakenteen mukaisesti:
[
  {
    "title": "Selkeä, toimintaa kuvaava otsikko",
    "description": "Yksityiskohtainen kuvaus tehtävästä",
    "category": "financial|legal|operations|documentation|customers|personnel|strategy",
    "type": "checkbox|multiple_choice|text_input|document_upload|explanation|contact_info",
    "priority": "high|medium|low",
    "impact": "high|medium|low",
    "estimated_time": "X tuntia/päivää",
    "expected_outcome": "Mitä tehtävän suorittamisesta seuraa",
    "options": ["Vaihtoehto 1", "Vaihtoehto 2", "Vaihtoehto 3"] // Vain multiple_choice-tehtäville
  }
]

TÄRKEÄÄ: Palauta VAIN JSON-muotoinen tehtävälista ilman mitään muuta tekstiä tai selityksiä.
`;

  return prompt;
}