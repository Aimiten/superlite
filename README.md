
# Yrityksen arvonmäärityssovellus

Tervetuloa yrityksen arvonmäärityssovelluksen dokumentaatioon. Tämä sovellus mahdollistaa yritysten nopean ja tehokkaan arvonmäärityksen, tarjoten käyttäjille työkaluja arvon analysointiin ja raportointiin.

## Projektin tiedot

Tämä sovellus on rakennettu Lovable-alustalla, käyttäen moderneja web-teknologioita ja Supabase-palvelua taustajärjestelmänä.

## Sovelluksen ominaisuuksia

- Ilmainen yrityksen arvonmääritys
- Tekoälyavusteiset analyysit
- PDF-raporttien generointi
- Sähköposti-ilmoitukset
- Edge-funktiot taustapalveluina
- Suojattu käyttäjäautentikaatio Supabasella

## Teknologiat

Sovellus on rakennettu seuraavilla teknologioilla:

- **Frontend:** React, TypeScript, Vite
- **UI-kirjasto:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno)
- **Autentikaatio ja tietokanta:** Supabase
- **Deployaus:** Replit

## Paikallinen kehitys

Sovelluksen kehitys onnistuu seuraavilla komennoilla:

```sh
# Asenna riippuvuudet
npm install

# Käynnistä kehitysympäristö
npm run dev
```

Sovellus käynnistyy osoitteeseen http://localhost:8080/

## Supabase-funktioiden hallinta

Sovelluksen taustalla toimii useita Supabase Edge Functions -funktioita, joiden avulla toteutetaan mm. sähköpostien lähetys, tekoälytoiminnot ja datan käsittely.

Funktioiden deployaamiseen on rakennettu helppokäyttöinen työkalu:

```sh
# Deployaa kaikki funktiot
node scripts/deploy-functions.js all

# Deployaa yksittäinen funktio
node scripts/deploy-functions.js send-email-valuation
```

Tarkemmat ohjeet funktioiden käyttöön löydät [Supabase-kansion README-tiedostosta](./supabase/README.md).

## Ympäristömuuttujat

Sovellus käyttää seuraavia ympäristömuuttujia:

- `VITE_SUPABASE_URL`: Supabase-projektin URL
- `VITE_SUPABASE_ANON_KEY`: Supabase-projektin anonyymi API-avain

## Deployaus

Sovellus on konfiguroitu deployattavaksi Replit-alustalle. Deployaus tapahtuu Replit-ympäristössä yksinkertaisesti klikkaamalla "Run"-painiketta.

## Lisätietoja

Tarkempia ohjeita löydät seuraavista tiedostoista:
- Supabase-funktiot: [supabase/README.md](./supabase/README.md)
