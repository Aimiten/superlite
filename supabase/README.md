
# Supabase-funktioiden käyttöohjeet

Tämä dokumentti sisältää ohjeet Supabase-funktioiden käyttämiseen, kehittämiseen ja deployaamiseen.

## Edge-funktioiden deployaaminen

Projektissa on mukana helppokäyttöinen deployaus-skripti, joka mahdollistaa funktioiden deployaamisen suoraan Replitistä ilman Docker-riippuvuutta.

### Funktioiden deployaaminen

Käytä `deploy-functions.js` skriptiä seuraavasti:

```bash
# Kaikkien funktioiden deployaaminen
node scripts/deploy-functions.js all

# Yksittäisen funktion deployaaminen
node scripts/deploy-functions.js send-email-valuation

# Useiden funktioiden deployaaminen
node scripts/deploy-functions.js func1 func2 func3
```

Voit myös käyttää valmista workflow:ta:
1. Valitse "Deploy Functions" workflow Run-nappulan vierestä
2. Klikkaa Run-nappia

### Huomioitavaa

- Skripti käyttää Supabase CLI:n beta-versiota, joka tukee `--use-api` lippua
- Docker-riippuvuutta ei tarvita, mikä mahdollistaa deployaamisen suoraan Replitistä
- Jokainen funktio deployataan erikseen
- Skripti asentaa tarvittaessa Supabase CLI:n beta-version

## Funktioiden testaaminen paikallisesti

Voit testata funktioita paikallisesti käyttämällä npx:ää:

```bash
npx supabase@beta functions serve --use-api
```

## Edge-funktioiden kutsuminen sovelluksesta

Sovellus käyttää `callEdgeFunction` apufunktiota edge-funktioiden kutsumiseen. Esimerkki:

```typescript
import { callEdgeFunction } from "@/utils/edge-function";

// Funktiokutsu yksinkertaisimmillaan
const { data, error } = await callEdgeFunction("send-email-valuation", { 
  email: "example@example.com", 
  valuationResult: valuationData 
});

// Funktiokutsu lisäasetuksilla
const { data, error } = await callEdgeFunction("send-email-valuation", payload, {
  maxRetries: 3,
  retryDelay: 1000,
  showToasts: true
});
```

## Esimerkkejä saatavilla olevista funktioista

Projektissa on useita käyttövalmiita funktioita:
- `ai-database-chat`: Tekoälyavusteinen tietokantakysely
- `assessment`: Yrityksen arviointi
- `chat-assistant`: Keskusteluavustaja
- `free-valuation`: Ilmainen yrityksen arviointi
- `generate-tasks`: Tehtävien generointi
- `get-shared-company`: Jaetun yrityksen tietojen hakeminen
- `send-email-valuation`: Arviointitulosten lähettäminen sähköpostilla
- `valuation`: Yrityksen arvonmääritys

## Supabase-kirjautuminen

Jos haluat tehdä muutoksia Supabaseen suoraan (ei funktioiden kautta):

1. Hanki Supabase Access Token [Supabase-hallintapaneelista](https://app.supabase.io/account/tokens)
2. Kirjaudu CLI:n kautta:
   ```
   npx supabase@beta login
   ```
   ja syötä token pyydettäessä.
