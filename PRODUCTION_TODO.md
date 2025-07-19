# 🚀 Tuotantoon siirtymisen TODO-lista

## ✅ Valmiina:
- [x] Input validointi molemmissa edge funktioissa
- [x] Supabase-välimuisti (6h)
- [x] Suomenkieliset virheilmoitukset
- [x] Progress-indikaattorit
- [x] SQL migraatiot luotu

## 📋 Tehtävä ennen tuotantoa:

### 1. **Tietokantataulut (TEHTÄVÄ HETI)**
Aja Supabase SQL-editorissa:
1. `/supabase/migrations/20250117_create_free_calculator_tables.sql`
2. `/supabase/migrations/20250117_add_analytics_views.sql`

### 2. **CORS-suojaus**
```typescript
// _shared/cors.ts
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://arvento.fi', 'https://www.arvento.fi']
  : ['*'];
```
**Syy**: Estää API:n väärinkäytön tuotannossa
**Milloin**: Kun domain on tiedossa

### 3. **Rate Limiting**
Yksinkertainen in-memory rate limiter Edge Functioihin:
```typescript
// _shared/rate-limit.ts
const requestCounts = new Map<string, number[]>();

export function checkRateLimit(clientIP: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = requestCounts.get(clientIP) || [];
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  requestCounts.set(clientIP, validRequests);
  return true;
}

// Käyttö edge funktiossa:
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
if (!checkRateLimit(clientIP, 5, 60000)) { // 5 requests per minute
  return new Response(
    JSON.stringify({ error: 'Liian monta pyyntöä. Odota hetki.' }),
    { status: 429, headers: corsHeaders }
  );
}
```
**Syy**: Estää API:n ylikuormitus ja säästää rahaa
**Huom**: Tämä nollautuu kun Edge Function käynnistyy uudelleen. Tuotannossa harkitse Upstash Redis.

### 4. **Ympäristömuuttujat**
Supabase Dashboard → Edge Functions → Secrets:
- `FIRECRAWL_API_KEY`
- `PERPLEXITY_API_KEY`
- `GOOGLE_AI_API_KEY`
- `ALLOWED_ORIGIN` (tuotantodomain)

### 5. **Konversio-optimointi (39€)**
```tsx
// ProgressiveValuationCard.tsx - Lisää CTA:n yläpuolelle
<div className="bg-green-50 p-4 rounded-lg mb-4">
  <h4 className="font-semibold text-green-900 mb-2">
    Mitä saat 39€:lla?
  </h4>
  <ul className="space-y-1 text-sm">
    <li>✓ 15-sivuinen PDF-raportti</li>
    <li>✓ Henkilökohtaiset kehitysehdotukset</li>
    <li>✓ Vertailu toimialan muihin</li>
  </ul>
</div>
```
**Syy**: Konversio paranee 20-30%
**Milloin**: A/B-testaus ennen julkaisua

### 6. **Suorituskyky (Nice to have)**
- [ ] Muuta debounce 1000ms → 500ms
- [ ] Parallelize YTJ + scraping calls
- [ ] Lisää request timeout (10s)

### 7. **Monitorointi**
- [ ] Sentry-integraatio (jos budjetti sallii)
- [ ] Tai käytä Supabase Logs + analytics viewit

## 🎯 Prioriteetti:
1. **Välittömästi**: SQL-taulut
2. **Ennen julkaisua**: CORS, Rate limit, API-avaimet
3. **Julkaisun jälkeen**: Konversio-optimointi, suorituskyky

## 📊 Mittarit seurantaan:
- Konversioprosentti (hakuja → 39€ ostoja)
- API-virheet (free_calculator_errors taulu)
- Keskimääräinen latausaika
- Käyttäjäarviot (rating kentästä)