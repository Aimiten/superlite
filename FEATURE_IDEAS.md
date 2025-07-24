# Superlite - Nopeat lisäominaisuudet

## Stripe-hinnoittelun konfigurointi

### Tuotteiden luominen Stripessä

1. **Kirjaudu Stripe Dashboardiin**
   - https://dashboard.stripe.com

2. **Luo subscription-tuote (19€/kk)**
   ```
   Products → + Add product
   
   Name: Superlite Pro
   Description: Yrityksen arvonmääritys ja AI-työkalut
   
   Pricing:
   - Recurring
   - 19.00 EUR
   - Billing period: Monthly
   - Price ID: price_monthly_19eur (tai kopioi generoitu)
   ```

3. **Luo lisämaksutuote (20€ kertaluontoinen)**
   ```
   Products → + Add product
   
   Name: Aloitusmaksu
   Description: Ensimmäisen kuukauden lisämaksu
   
   Pricing:
   - One time
   - 20.00 EUR
   - Price ID: price_addon_20eur (tai kopioi generoitu)
   ```

### Environment-muuttujat

Lisää `.env.local` tiedostoon:
```bash
VITE_STRIPE_PRICE_MONTHLY=price_1ABC... # Kopioi Stripestä
VITE_STRIPE_ADDON_SETUP=price_1DEF...   # Kopioi Stripestä
```

### Miten se toimii käyttäjälle

1. Käyttäjä klikkaa "Aloita nyt" → 39€
2. Stripe checkout näyttää:
   - Tilaus 19€/kk
   - Aloitusmaksu +20€
   - **Yhteensä tänään: 39€**
3. Seuraava veloitus 30pv päästä: 19€
4. Jatkuu 19€/kk kunnes peruu

### Testaus

1. Käytä Stripe test mode
2. Testikortit: https://stripe.com/docs/testing
3. Tarkista että:
   - Ensimmäinen lasku = 39€
   - Seuraavat laskut = 19€

---

## 1. Potentiaaliset ostajat (1-2h toteutus)

### Kuvaus
Automaattinen ostajahaku, joka löytää 5-10 potentiaalista ostajaa yrityksellesi.

### Toteutus
```typescript
// Edge function: find-potential-buyers
const findBuyers = async (company) => {
  const prompt = `
    Etsi 5-10 potentiaalista ostajaa tälle yritykselle:
    - Yritys: ${company.name}
    - Toimiala: ${company.industry}
    - Liikevaihto: ${company.revenue}
    - Sijainti: ${company.location}
    
    Hae seuraavia ostajatyyppejä:
    1. Suorat kilpailijat Suomessa
    2. Toimialan konsolidoijat
    3. Pääomasijoittajat (esim. Intera, Vaaka Partners)
    4. Strategiset ostajat (suuremmat yritykset)
    5. Kansainväliset toimijat
    
    Palauta JSON-muodossa: nimi, tyyppi, miksi kiinnostunut
  `;
  
  // Käytä Perplexity API tai Claude
  const buyers = await callPerplexity(prompt);
  return buyers;
};
```

### Rajoitukset
- 3 hakua per kuukausi
- Tallenna tulokset välimuistiin 30 päiväksi

### UI
- Uusi nappi dashboardissa: "Etsi ostajaehdokkaat"
- Näytä tulokset kortteina
- Mahdollisuus ladata PDF

## 2. Arvon nostamisen checklist (2-3h toteutus)

### Kuvaus
AI-generoitu toimenpidelista, joka näyttää konkreettiset askeleet yrityksen arvon nostamiseen.

### Toteutus
```typescript
// Generoi kerran arvonmäärityksen yhteydessä
const generateValueChecklist = async (valuation) => {
  const checklist = await generateWithAI({
    company: valuation.company,
    currentValue: valuation.value,
    weaknesses: valuation.risks,
    
    // Generoi 10-15 konkreettista toimenpidettä
    // Priorisoi vaikutuksen mukaan
  });
  
  // Tallenna tietokantaan
  await supabase.from('value_improvement_tasks').insert({
    company_id: company.id,
    tasks: checklist.tasks,
    potential_impact: checklist.totalImpact // +20-50%
  });
};
```

### Ominaisuudet
- Käyttäjä voi merkata tehdyksi
- Näyttää arvovaikutuksen per toimenpide (+2%, +5%, jne)
- Integroituu nykyiseen task-systeemiin
- Progress bar kokonaisedistymiselle

## 3. Jakamisen analytics dashboard (1h toteutus)

### Kuvaus
Näytä käyttäjälle kattava raportti siitä, ketkä ovat katsoneet jaettuja dokumentteja.

### Toteutus
Backend on jo valmis! Tarvitaan vain UI:
- Kuka katsoi (email, nimi, yritys)
- Milloin katsoi (aikaleima)
- Kuinka kauan (istunnon kesto)
- Mitä katsoi (mitkä välilehdet/dokumentit)
- Kartta IP-osoitteista

### Lisäominaisuudet
- Email-notifikaatio kun joku katsoo
- Viikkoraportti aktiivisuudesta
- "Hot leads" -näkymä (katsoi >3 kertaa)

## 4. Myyntiprosessin aikajana (2h toteutus)

### Kuvaus
Visuaalinen aikajana, joka näyttää missä vaiheessa myyntiprosessi on.

### Vaiheet
1. Arvonmääritys tehty ✓
2. Myyntikunto arvioitu
3. Kehitystoimet käynnissä (X/Y tehty)
4. Markkinointi aloitettu
5. Ostajaehdokkaita kontaktoitu
6. NDA:t allekirjoitettu
7. Due diligence käynnissä
8. Neuvottelut
9. Kauppa

### Ominaisuudet
- Automaattinen päivitys toimien perusteella
- Arvio kestosta per vaihe
- Vinkit seuraavista askeleista

## 5. Kilpailija-analyysi (1-2h toteutus)

### Kuvaus
Hae automaattisesti 3-5 kilpailijaa ja vertaa tunnuslukuja.

### Toteutus
```typescript
const analyzeCompetitors = async (company) => {
  // 1. Hae kilpailijat Perplexity/Claude
  const competitors = await findCompetitors(company.industry, company.size);
  
  // 2. Hae talousluvut (Finder scraping)
  const financials = await scrapeCompetitorData(competitors);
  
  // 3. Vertailu
  return {
    revenueComparison: chart,
    profitabilityComparison: chart,
    valuationMultiples: table,
    insights: aiGeneratedInsights
  };
};
```

## 6. Automaattinen myyntiesite (30min toteutus)

### Kuvaus
Generoi PDF-myyntiesite yrityksestä yhdellä napilla.

### Sisältö
- Yrityksen perustiedot
- Talousluvut (3v)
- Vahvuudet
- Markkina-asema
- Kasvumahdollisuudet
- Yhteystiedot (anonymisoitu)

### Toteutus
- Käytä olemassa olevaa PDF-generointia
- Template markdown-muodossa
- Logo + brändäys

## Priorisointi

1. **Potentiaaliset ostajat** - Korkein arvo, helppo toteuttaa
2. **Arvon nostamisen checklist** - Konkreettista hyötyä
3. **Jakamisen analytics** - Backend valmis, vain UI
4. **Myyntiesite** - Nopea toteuttaa
5. **Aikajana** - Nice to have
6. **Kilpailija-analyysi** - Vaatii enemmän työtä

## Hinnoittelu

Kaikki ominaisuudet sisältyvät 39€ + 19€/kk pakettiin, mutta:
- Ilmainen: Ei mitään näistä
- Pro: Kaikki ominaisuudet
- Käyttörajoitukset estävät väärinkäytön