# UI/UX TODO - Keskeneräiset korjaukset

Päivitetty: 2025-01-16

## ✅ NEUMORPHIC-VARJOT - 100% VALMIS!
- Kaikki vanhat varjot (shadow-lg/md/sm/xl) korvattu
- 195+ shadow-neumorphic käyttöä
- Yhtenäinen muotoilu kaikkialla

## 🟡 KOVAKOODATUT VÄRIT (60 käyttöä jäljellä)

### Tilanne:
- **80% korjattu** (302 → 60)
- Kaikki gray/slate värit korjattu ✅
- Vain 3 amber/yellow/orange väriä jäljellä ✅

### Jäljellä olevat värit todennäköisesti:
- Edge case -tapauksia
- Inline styles
- Conditional classes
- Third-party komponentit

## ✅ MITÄ ON TEHTY

### Neumorphic päivitetty:
- ✅ KAIKKI komponentit käyttävät nyt neumorphic-varjoja
- ✅ SharedView.tsx, DCFAnalysis.tsx, FreeValuation.tsx korjattu

### Värit päivitetty:
- ✅ Landing-komponentit (Hero, Features, Footer, Header)
- ✅ Free Calculator -komponentit
- ✅ Simulator-komponentit
- ✅ Help-komponentit
- ✅ Kaikki gray/slate → muted/muted-foreground

### Typografia:
- ✅ text-base oletukseksi body-tekstille
- ✅ Selkeä hierarkia toteutettu

## 📊 LOPPUTILANNE

- **Neumorphic**: ✅ 100% valmis
- **Värit**: ✅ 80% valmis (60 kovakoodattua jäljellä)
- **Typografia**: ✅ 95% valmis
- **CSS-gradientit**: ✅ 100% poistettu

## 🚀 VIIMEISET ASKELEET

1. Etsi ja korjaa loput 60 kovakoodattua väriä
   - Käytä: `grep -r "indigo-[0-9]\|purple-[0-9]\|green-[0-9]\|blue-[0-9]\|red-[0-9]" src`
2. Testaa dark mode toimivuus
3. Varmista että kaikki hover-tilat toimivat
4. Tarkista mobiiliresponsiivisuus

## 💡 SAAVUTUKSET

- Yhtenäinen neumorphic-muotoilu kaikkialla
- 4-värijärjestelmä: Primary, Secondary, Muted + semanttiset värit
- Parempi luettavuus (text-base)
- Ei gradientteja - puhdas, moderni ulkoasu
- Helpompi ylläpito teemamuuttujilla