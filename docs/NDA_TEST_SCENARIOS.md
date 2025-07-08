# NDA Testing Scenarios

## Test Case 1: Potentiaalinen ostaja
**Vaiheet:**
1. Valitse jakoon: Arvonmääritys + 2 taloudellista dokumenttia
2. Vaadi NDA
3. Valitse: Potentiaalinen ostaja, 2 vuotta, 25,000 EUR
4. Esikatsele NDA

**Odotettu tulos:**
- Otsikko: "SALASSAPITOSOPIMUS - Luottamuksellisten tietojen jakaminen"
- Maininta: "potentiaaliselle ostajalle, joka arvioi mahdollista yrityskauppaa"
- Listattu: Arvento-arvonmääritysraportti, 2 dokumenttia
- Kesto: kaksi (2) vuotta
- Sopimussakko: 25 000 EUR

## Test Case 2: Sijoittaja
**Vaiheet:**
1. Valitse jakoon: Myyntikunto-analyysi + tehtävät
2. Vaadi NDA
3. Valitse: Sijoittaja, 3 vuotta, 10,000 EUR
4. Esikatsele NDA

**Odotettu tulos:**
- Maininta: "sijoittajalle, joka arvioi sijoitusmahdollisuutta"
- Listattu: Myyntikunto-analyysi, X kehitystehtävää
- Kesto: kolme (3) vuotta
- Sopimussakko: 10 000 EUR

## Test Case 3: Yhteistyökumppani
**Vaiheet:**
1. Valitse jakoon: Vain dokumentteja (ei arvonmääritystä)
2. Vaadi NDA
3. Valitse: Yhteistyökumppani, 1 vuosi, 5,000 EUR
4. Esikatsele NDA

**Odotettu tulos:**
- Maininta: "yhteistyökumppanille, joka arvioi yhteistyömahdollisuuksia"
- Listattu: Dokumentit (nimetty lista)
- Kesto: yksi (1) vuosi
- Sopimussakko: 5 000 EUR

## Test Case 4: Vastaanottajan tiedot
**Vaiheet:**
1. Syötä sähköposti: testi@example.com
2. Luo jako NDA:lla

**Odotettu tulos:**
- Vastaanottaja: "Tietojen vastaanottaja (testi@example.com)"
- EI placeholder-tekstejä [Vastaanottaja]

## Test Case 5: Jaetut tiedot näkyvyys
**Vaiheet:**
1. Valitse:
   - Arvonmääritys ✓
   - Myyntikunto ✓
   - 3 dokumenttia
   - 5 tehtävää (2 taloudellisella vaikutuksella)

**Odotettu tulos NDA:ssa:**
- "Arvento-arvonmääritysraportti sisältäen DCF-laskelmat..."
- "Myyntikunto-analyysi ja kehitysehdotukset"
- "Dokumentit: [lista dokumenttien nimistä]"
- "5 kehitystehtävää (2 taloudellisella vaikutuksella)"

## Test Case 6: UI/UX tarkistukset
**Tarkista:**
- Preview modal on riittävän leveä tekstille
- Info-kortit näkyvät oikein (vastaanottaja, kesto, sakko)
- Latausanimaatio toimii
- "Hyväksy sopimus ja luo jako" -painike toimii
- NDA hyväksytty -ilmoitus näkyy

## Test Case 7: Virhetilanteet
**Testaa:**
1. Edge Function ei vastaa → Näkyy virheilmoitus
2. Vaihda välilehteä → NDA-hyväksyntä nollautuu
3. Muuta NDA-asetuksia → Vaadi uusi hyväksyntä

## Hyväksymiskriteerit
- [ ] Ei mainintoja "yrityskauppaneuvotteluista"
- [ ] Aina maininta "arviointia varten"
- [ ] Jaetut tiedot listattu oikein
- [ ] Vastaanottajan rooli näkyy oikein
- [ ] Ei placeholder-tekstejä
- [ ] Ei allekirjoituskohtaa