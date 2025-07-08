import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Calculator, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ValuationHelpSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arvonmääritys</CardTitle>
        <CardDescription>
          Kattava työkalu yrityksen arvon määrittämiseen kolmella eri menetelmällä
        </CardDescription>
      </CardHeader>
      <CardContent>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="getting-started">
            <AccordionTrigger>🚀 Kuinka aloittaa arvonmääritys</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Valitse yritys</strong>
                    <p className="text-sm text-muted-foreground mt-1">Varmista että oikea yritys on valittuna työpöydän yläkulmasta</p>
                  </li>
                  <li>
                    <strong>Lataa tilinpäätös</strong>
                    <p className="text-sm text-muted-foreground mt-1">Tuetut muodot: PDF, Excel (.xlsx, .xls), CSV, TXT</p>
                  </li>
                  <li>
                    <strong>Anna AI:n analysoida</strong>
                    <p className="text-sm text-muted-foreground mt-1">Analyysi kestää 2-5 minuuttia riippuen dokumentin koosta</p>
                  </li>
                  <li>
                    <strong>Vastaa normalisointikysymyksiin</strong>
                    <p className="text-sm text-muted-foreground mt-1">Toimialakohtaiset kysymykset tarkentavat arvonmääritystä</p>
                  </li>
                  <li>
                    <strong>Saa kattava raportti</strong>
                    <p className="text-sm text-muted-foreground mt-1">Tulokset sisältävät arvoalueen ja yksityiskohtaisen analyysin</p>
                  </li>
                </ol>

                <Button onClick={() => navigate("/valuation")} className="w-full">
                  Aloita arvonmääritys →
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="methods">
            <AccordionTrigger>📊 Arvonmääritysmenetelmät</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Substanssiarvo</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Perustuu yrityksen varojen ja velkojen kirjanpitoarvoihin
                  </p>
                  <ul className="text-sm list-disc pl-6 space-y-1">
                    <li>Soveltuu omaisuusvaltaisille yrityksille</li>
                    <li>Huomioi taseen erät</li>
                    <li>Konservatiivinen arvio</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Tuottoarvo</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Diskonttaa tulevia kassavirtoja nykyarvoon
                  </p>
                  <ul className="text-sm list-disc pl-6 space-y-1">
                    <li>Perustuu yrityksen tuottavuuteen</li>
                    <li>Huomioi kasvuodotukset</li>
                    <li>Sovelias kasvuyrtityksille</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Markkinaperusteinen arvo</h4>
                    <Badge variant="secondary">Lite+</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vertailee samankaltaisten yritysten kauppahintoja
                  </p>
                  <ul className="text-sm list-disc pl-6 space-y-1">
                    <li>Toimialakohtaiset kertoimet</li>
                    <li>Markkina-aineisto Suomesta</li>
                    <li>Realistinen markkinaarvo</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="documents">
            <AccordionTrigger>📄 Dokumenttien käsittely</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tuetut tiedostomuodot</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>PDF-tilinpäätökset</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Excel-taulukot (.xlsx, .xls)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>CSV-tiedostot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Tekstitiedostot (.txt)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Parhaat käytännöt</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Käytä virallisia tilinpäätöksiä (ei luonnoksia)</li>
                    <li>Varmista että luvut ovat selkeästi luettavissa</li>
                    <li>Sisällytä tase ja tuloslaskelma</li>
                    <li>Lisää liitetiedot jos saatavilla</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dokumenttien tallennus</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ladatut dokumentit tallennetaan automaattisesti ja voit käyttää niitä uudelleen:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Dokumentit näkyvät "Valitse tallennettu dokumentti" -kohdassa</li>
                    <li>Voit poistaa tarpeettomia dokumentteja</li>
                    <li>Organisoi dokumentit vuosittain</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="analysis">
            <AccordionTrigger>🔍 Analyysin tulokset</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Mitä analyysi sisältää</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Taloudellinen analyysi</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Liikevaihto ja sen kehitys</li>
                        <li>EBITDA ja EBIT</li>
                        <li>Nettovoitto</li>
                        <li>Tunnusluvut</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">SWOT-analyysi</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Vahvuudet</li>
                        <li>Heikkoudet</li>
                        <li>Mahdollisuudet</li>
                        <li>Uhat</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Riskit</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Liiketoimintariskit</li>
                        <li>Taloudellinen riski</li>
                        <li>Toimialariskit</li>
                        <li>Markkinariskit</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Arvostus</h5>
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        <li>Arvoalue eri menetelmillä</li>
                        <li>Keskiarvo ja mediaani</li>
                        <li>Toimialavertailu</li>
                        <li>Perustelut</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Huom:</strong> Pro-versiossa (99€/kk) saat lisäksi toimialavertailut ja kehittyneempiä analyysityökaluja.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="normalization">
            <AccordionTrigger>⚙️ Normalisointikysymykset</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Normalisointikysymykset auttavat tarkentamaan arvonmääritystä ottamalla huomioon yrityskohtaiset erityispiirteet.
                </p>

                <div>
                  <h4 className="font-semibold mb-2">Tyypillisiä kysymyksiä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Onko liikevaihto toistuvaa vai kertaluonteista?</li>
                    <li>Sisältääkö tulos kertaluonteisia eriä?</li>
                    <li>Onko yrityksessä ylimääräisiä kuluja?</li>
                    <li>Kuinka riippuvainen yritys on avainhenkilöistä?</li>
                    <li>Onko asiakaskunta keskittynyt?</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Miksi normalisointi on tärkeää?</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Eliminoi kertaluonteiset erät</li>
                    <li>Huomioi riskitekijät</li>
                    <li>Parantaa arvostuksen tarkkuutta</li>
                    <li>Tekee arvostuksesta realistisemman</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Vinkki:</strong> Vastaa kysymyksiin mahdollisimman tarkasti - se parantaa merkittävästi arvonmäärityksen laatua.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>


          <AccordionItem value="tips">
            <AccordionTrigger>💡 Vinkkejä parhaaseen tulokseen</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Ennen arvonmääritystä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Varmista että yrityksen perustiedot ovat ajan tasalla</li>
                    <li>Hanki viimeisimmät tilinpäätökset</li>
                    <li>Valmistele tiedot normalisointikysymyksiin</li>
                    <li>Mieti yrityksen erityispiirteet etukäteen</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tulosten tulkinta</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Arvoalue on realistisempi kuin yksittäinen luku</li>
                    <li>Vertaile eri menetelmiä keskenään</li>
                    <li>Huomioi toimialan erityispiirteet</li>
                    <li>Katso SWOT ja riskit kokonaisuutena</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Jatkotoimenpiteet</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tee myyntikuntotesti nähdäksesi parannuskohteita</li>
                    <li>Keskustele tuloksista AI-assistentin kanssa</li>
                    <li>Jaa raportti neuvonantajille turvallisesti</li>
                    <li>Päivitä arvonmääritys säännöllisesti</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ValuationHelpSection;