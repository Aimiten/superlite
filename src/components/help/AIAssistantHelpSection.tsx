import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Mic, Download, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIAssistantHelpSection = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-assistentti</CardTitle>
        <CardDescription>
          Tekoälyavustaja joka tuntee yrityksesi tiedot ja auttaa kaikissa yrityskauppaan liittyvissä kysymyksissä
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Kontekstitietoinen:</strong> AI-assistentti tietää yrityksesi arvonmääritykset, tehtävät ja dokumentit.
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger>🤖 AI-assistentin yleiskuva</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-base text-muted-foreground">
                  AI-assistentti on keskusteleva tekoäly, joka on erikoistunut yrityskauppoihin ja liiketoiminnan myyntikuntoon.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Mitä AI tietää</h4>
                    <ul className="text-base list-disc pl-4 space-y-1">
                      <li>Yrityksesi arvonmääritykset</li>
                      <li>Myyntikuntotestin tulokset</li>
                      <li>Kaikki tehtävät ja niiden tilat</li>
                      <li>Ladatut dokumentit</li>
                      <li>Toimialan parhaat käytännöt</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Mitä AI osaa</h4>
                    <ul className="text-base list-disc pl-4 space-y-1">
                      <li>Vastata kysymyksiin</li>
                      <li>Luoda dokumentteja</li>
                      <li>Analysoida tietoja</li>
                      <li>Antaa suosituksia</li>
                      <li>Auttaa tehtävissä</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => navigate("/ai-assistant")} className="w-full">
                  Aloita keskustelu AI:n kanssa →
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chat">
            <AccordionTrigger>💬 Keskustelu ja kysymykset</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tyypillisiä kysymyksiä</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="border rounded p-2">
                      <strong>Arvonmääritys:</strong> "Miksi yritykseni arvo on X euroa?"
                    </div>
                    <div className="border rounded p-2">
                      <strong>Myyntikunto:</strong> "Mitkä ovat tärkeimmät kehityskohteet?"
                    </div>
                    <div className="border rounded p-2">
                      <strong>Tehtävät:</strong> "Mistä tehtävästä kannattaa aloittaa?"
                    </div>
                    <div className="border rounded p-2">
                      <strong>Due Diligence:</strong> "Miten valmistaudun DD-prosessiin?"
                    </div>
                    <div className="border rounded p-2">
                      <strong>Strategia:</strong> "Milloin on oikea aika myydä?"
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Keskusteluvihjeitä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Ole tarkka kysymyksissäsi</li>
                    <li>Kerro konteksti jos tarpeen</li>
                    <li>Pyydä esimerkkejä</li>
                    <li>Kysy jatkokysymyksiä</li>
                    <li>Hyödynnä keskusteluhistoriaa</li>
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
                  <h4 className="font-semibold mb-2">Dokumenttien lataus</h4>
                  <p className="text-base text-muted-foreground mb-2">
                    Voit ladata dokumentteja suoraan keskusteluun:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>PDF-tiedostot (sopimukset, raportit)</li>
                    <li>Excel-taulukot (budjetit, laskelmat)</li>
                    <li>Word-dokumentit (suunnitelmat)</li>
                    <li>Tekstitiedostot</li>
                    <li>Kuvat (kaaviot, prosessikuvat)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dokumenttien analysointi</h4>
                  <p className="text-base text-muted-foreground mb-2">
                    AI osaa analysoida ja vastata dokumenttien sisällöstä:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Tiivistää pääkohdat</li>
                    <li>Tunnistaa riskejä</li>
                    <li>Ehdottaa parannuksia</li>
                    <li>Vertailla eri dokumentteja</li>
                    <li>Luoda yhteenvetoja</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="generation">
            <AccordionTrigger>✍️ Dokumenttien generointi</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Mitä AI voi luoda</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Myyntidokumentit</h5>
                      <ul className="text-base list-disc pl-4 space-y-1">
                        <li>Teaser-dokumentti</li>
                        <li>Information Memorandum</li>
                        <li>Management Presentation</li>
                        <li>Myyntiesite</li>
                      </ul>
                    </div>
                    <div className="border rounded p-3">
                      <h5 className="font-medium mb-1">Juridiset dokumentit</h5>
                      <ul className="text-base list-disc pl-4 space-y-1">
                        <li>Salassapitosopimus (NDA)</li>
                        <li>Aiesopimus (LOI)</li>
                        <li>Due Diligence -luettelo</li>
                        <li>Sopimusluonnokset</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Generointiprosessi</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Kerro AI:lle mitä dokumenttia tarvitset</li>
                    <li>Anna tarvittavat lisätiedot</li>
                    <li>AI luo dokumentin yrityksen tietojen pohjalta</li>
                    <li>Tarkista ja muokkaa tarvittaessa</li>
                    <li>Tallenna ja jaa turvallisesti</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="voice">
            <AccordionTrigger>🎤 Puheohjaus (Pro)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>Pro (99€/kk)</Badge>
                  <Mic className="w-4 h-4" />
                </div>
                
                <p className="text-base text-muted-foreground">
                  Pro-versiossa (99€/kk) voit keskustella AI:n kanssa äänellä ja kuunnella vastaukset.
                </p>

                <div>
                  <h4 className="font-semibold mb-2">Käyttötapaukset</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Autossa tai liikkeellä ollessasi</li>
                    <li>Monitehtävötilanteissa</li>
                    <li>Pitkien tekstien kuunteluun</li>
                    <li>Esteettömyyssyistä</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Ominaisuudet</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Suomenkielinen puheentunnistus</li>
                    <li>Luonnollinen äänisynteesi</li>
                    <li>Katkaisematon keskustelu</li>
                    <li>Tauon ja jatkamisen mahdollisuus</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="history">
            <AccordionTrigger>📚 Keskusteluhistoria</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Keskustelujen tallentaminen</h4>
                  <p className="text-base text-muted-foreground mb-2">
                    Kaikki keskustelut tallennetaan automaattisesti:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Selaa aiempia keskusteluja</li>
                    <li>Jatka keskustelua mistä jäit</li>
                    <li>Etsi tiettyä tietoa keskusteluista</li>
                    <li>Jaa keskusteluja muiden kanssa</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Keskustelujen organisointi</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Anna keskusteluille kuvaavat nimet</li>
                    <li>Käytä tageja aihepiireittäin</li>
                    <li>Merkitse tärkeät keskustelut</li>
                    <li>Arkistoi vanhat keskustelut</li>
                  </ul>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Huom:</strong> Keskustelut säilytetään 12 kuukautta, jonka jälkeen ne arkistoidaan.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tips">
            <AccordionTrigger>💡 Vinkkejä tehokkaaseen käyttöön</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Parhaat käytännöt</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Ole spesifi kysymyksissäsi</li>
                    <li>Anna riittävästi kontekstia</li>
                    <li>Kysy jatkokysymyksiä tarkennuksiksi</li>
                    <li>Hyödynnä dokumenttien latausta</li>
                    <li>Tallenna tärkeät vastaukset</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tehokkuusvinkkejä</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Käytä AI:ta tehtävien suorittamisessa</li>
                    <li>Pyydä mallidokumentteja</li>
                    <li>Anna AI:n tarkistaa työsi</li>
                    <li>Kysy parannusehdotuksia</li>
                    <li>Hyödynnä benchmarking-tietoja</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Esimerkkikysymyksiä</h4>
                  <div className="space-y-2 text-sm">
                    <div className="border rounded p-2 bg-muted">
                      "Luo minulle NDA-sopimus yritykseni myyntiprosessiin"
                    </div>
                    <div className="border rounded p-2 bg-muted">
                      "Analysoi tämä sopimus ja kerro mahdolliset riskit"
                    </div>
                    <div className="border rounded p-2 bg-muted">
                      "Mitkä toimenpiteet nostaisivat yritykseni arvoa eniten?"
                    </div>
                    <div className="border rounded p-2 bg-muted">
                      "Auta minua täyttämään tämä DD-tehtävä"
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AIAssistantHelpSection;